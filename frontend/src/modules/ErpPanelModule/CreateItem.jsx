import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Tag, Divider } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { settingsAction } from '@/redux/settings/actions';
import { erp } from '@/redux/erp/actions';
import { selectCreatedItem } from '@/redux/erp/selectors';
import calculate from '@/utils/calculate';
import { generate as uniqueId } from 'shortid';
import Loading from '@/components/Loading';
import {
    ArrowLeftOutlined,
    CloseCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

function SaveForm({ onSubmit }) { // Terima onSubmit sebagai prop
    const translate = useLanguage();
    const handleClick = () => {
        onSubmit(); // Panggil onSubmit yang diterima
    };

    // return (
    //     <Button onClick={handleClick} type="primary" icon={<PlusOutlined />}>
    //         {translate('Save')}
    //     </Button>
    // );
}

export default function CreateItem({ config, CreateForm }) {
    const translate = useLanguage();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(settingsAction.list({ entity: 'setting' }));
    }, []);

    let { entity } = config;

    const { isLoading, isSuccess, result } = useSelector(selectCreatedItem);
    const [subTotal, setSubTotal] = useState(0);
    const [offerSubTotal, setOfferSubTotal] = useState(0);

    const [formValues, setFormValues] = useState({}); // State untuk menyimpan nilai form

    const [detailBongkar, setDetailBongkar] = useState({}); // Angkat state detailBongkar

    const handleAddDetailBongkar = (posisi) => {
        setDetailBongkar(prevDetailBongkar => {
            const existingDetails = prevDetailBongkar[posisi] || [];
            return {
                ...prevDetailBongkar,
                [posisi]: [...existingDetails, { report_no: '', berat_bongkar: '', size: '', persen_molting: '', harga: '', subtotal: '' }],
            };
        });
    };

    const handleDetailChange = (posisi, index, field, value) => {
        setDetailBongkar(prevDetailBongkar => {
            const updatedDetails = [...(prevDetailBongkar[posisi] || [])];
            updatedDetails[index] = { ...updatedDetails[index], [field]: value };
            return { ...prevDetailBongkar, [posisi]: updatedDetails };
        });
    };


    const handleRemoveDetailBongkar = (posisi, index) => {
        setDetailBongkar(prevDetailBongkar => {
            const updatedDetails = [...(prevDetailBongkar[posisi] || [])];
            updatedDetails.splice(index, 1); // Hapus item pada index
            return { ...prevDetailBongkar, [posisi]: updatedDetails };
        });
    };


    const handleValuesChange = useCallback((changedValues, values) => {
        // Hanya perbarui formValues jika ada perubahan signifikan
        if (JSON.stringify(values) !== JSON.stringify(formValues)) {
            setFormValues(values);

            const items = values['items'];
            let subTotal = 0;
            let subOfferTotal = 0;

            if (items) {
                items.map((item) => {
                    if (item) {
                        if (item.offerPrice && item.quantity) {
                            let offerTotal = calculate.multiply(item['quantity'], item['offerPrice']);
                            subOfferTotal = calculate.add(subOfferTotal, offerTotal);
                        }
                        if (item.quantity && item.price) {
                            let total = calculate.multiply(item['quantity'], item['price']);
                            //sub total
                            subTotal = calculate.add(subTotal, total);
                        }
                    }
                });
                setSubTotal(subTotal);
                setOfferSubTotal(offerSubTotal);
            }
        }
    }, [formValues]); // Tambahkan formValues sebagai dependency

    useEffect(() => {
        if (isSuccess) {
            dispatch(erp.resetAction({ actionType: 'create' }));
            setSubTotal(0);
            setOfferSubTotal(0);
            navigate(`/${entity.toLowerCase()}/read/${result.id}`);
        }
        return () => { };
    }, [isSuccess, dispatch, navigate, entity, result]); // Tambahkan dependencies

    const onSubmit = async (values) => { // Terima data form dari child
        // console.log('🚀 ~ onSubmit ~ formValues:', values);

        let fieldsValue = { ...values };
        const panenData = values.panenData; // ambil panenData dari values
        const detailBongkarFromForm = values.detailBongkar; // ambil detailBongkar dari values

        delete fieldsValue.panenData; // hapus agar tidak dobel
        delete fieldsValue.detailBongkar; // hapus agar tidak dobel

        if (fieldsValue) {
            if (fieldsValue.items) {
                let newList = [...fieldsValue.items];
                newList.map((item) => {
                    item.total = calculate.multiply(item.quantity, item.price);
                });
                fieldsValue = {
                    ...fieldsValue,
                    items: newList,
                };
            }
        }

        // Format tanggal (pastikan dayjs sudah di-import di sini jika belum)
        fieldsValue.tanggal_bongkar = dayjs(fieldsValue.tanggal_bongkar).format('YYYY-MM-DD');

        // Transformasi data detailBongkar
        const detailBongkarArray = [];
        for (const posisi in detailBongkarFromForm) {
            if (detailBongkarFromForm.hasOwnProperty(posisi)) {
                detailBongkarFromForm[posisi].forEach(item => {
                    detailBongkarArray.push({
                        ...item,
                        posisi: posisi,
                        detail_panen_ids: panenData?.detail
                            .filter(panenItem => panenItem.posisi === posisi)
                            .map(panenItem => panenItem.id) || [] // Ambil semua ID detail panen untuk posisi ini
                    });
                });
            }
        }

        // Gabungkan semua data yang diperlukan
        const dataToSend = {
            ...fieldsValue,
            detailBongkar: detailBongkarArray, // Data detail sekarang dalam format array
            id_tambak: 6
        };

        // Cetak semua parameter yang akan disubmit
        console.log("Data yang akan disubmit ke backend:", JSON.stringify(dataToSend, null, 2)); // Cetak dengan format JSON yang mudah dibaca
        // process.exit();

        dispatch(erp.create({ entity, jsonData: dataToSend }));
    };

    return (
        <>
            <PageHeader
                onBack={() => {
                    navigate(`/${entity.toLowerCase()}`);
                }}
                backIcon={<ArrowLeftOutlined />}
                title={translate(`New ${translate(entity)}`)}
                ghost={false}
                extra={[
                    <Button
                        key={`${uniqueId()}`}
                        onClick={() => navigate(`/${entity.toLowerCase()}`)}
                        icon={<CloseCircleOutlined />}
                    >
                        {translate('Cancel')}
                    </Button>,
                    <SaveForm key={`${uniqueId()}`} onSubmit={onSubmit} />, // Kirim onSubmit ke SaveForm
                ]}
                style={{
                    padding: '20px 0px',
                }}
            />
            <Divider dashed />
            <Loading isLoading={isLoading}>
                {/* Render CreateForm dan kirimkan props yang diperlukan */}
                <CreateForm
                    subTotal={subTotal}
                    offerTotal={offerSubTotal}
                    onValuesChange={handleValuesChange}
                    detailBongkar={detailBongkar} // Kirim detailBongkar
                    handleAddDetailBongkar={handleAddDetailBongkar} // Kirim fungsi
                    handleDetailChange={handleDetailChange} // Kirim fungsi
                    handleRemoveDetailBongkar={handleRemoveDetailBongkar} // Kirim fungsi
                    onSubmit={onSubmit} // Kirim fungsi onSubmit
                />
            </Loading>
        </>
    );
}