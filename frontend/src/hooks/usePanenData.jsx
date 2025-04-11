import { useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

const usePanenData = (form) => {
    const [panenData, setPanenData] = useState(null);
    const [loadingPanen, setLoadingPanen] = useState(false);
    const [idTambak, setIdTambak] = useState(null);

    const handleGetPanenData = async () => {
        setLoadingPanen(true);
        try {
            const nopol = form.getFieldValue('nopol');
            const tanggal = form.getFieldValue('tanggal_panen') ? dayjs(form.getFieldValue('tanggal_panen')).format('YYYY-MM-DD') : null;

            if (!nopol || !tanggal || !idTambak) {
                console.error('Nopol dan tanggal bongkar harus diisi');
                return;
            }

            const apiUrl = `http://localhost:5000/api/panen/getDetailPanenbyNopol?nopol=${nopol}&tanggal=${tanggal}&id_tambak=${idTambak}`;
            const response = await axios.get(apiUrl);

            if (response.data.success && response.data.result.length > 0) {
                const dataPanen = response.data.result[0];
                setPanenData(dataPanen);

                // Isi form dengan data dari API
                form.setFieldsValue({
                    nopol: dataPanen.nopol,
                    driver: dataPanen.driver,
                    staff: dataPanen.staff,
                });

                 // Process detail panen - store positions
                const positions = [...new Set(dataPanen.detail.map(d => d.posisi))];

                // Initialize detailBongkar with an empty array for each position
                const initialDetailBongkar = {};
                positions.forEach(posisi => {
                    initialDetailBongkar[posisi] = [{ berat_bongkar: '', persen_molting: '', harga: '', size: '' }]; // Start with one empty row
                });
                //setDetailBongkar(initialDetailBongkar); // Jangan set state langsung, gunakan fungsi prop

                // Panggil handleAddDetailBongkar untuk setiap posisi
                // positions.forEach(posisi => {
                //     handleAddDetailBongkar(posisi); // Gunakan fungsi prop
                // });

            } else {
                setPanenData(null);
                console.log('Data panen tidak ditemukan');
            }
        } catch (error) {
            console.error('Error fetching panen data:', error);
        } finally {
            setLoadingPanen(false);
        }
    };

    return {
        panenData,
        setPanenData,
        loadingPanen,
        setLoadingPanen,
        idTambak,
        setIdTambak,
        handleGetPanenData,
    };
};

export default usePanenData;