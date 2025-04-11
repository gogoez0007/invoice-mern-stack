import React, { useState, useEffect, useRef, useCallback  } from 'react';
import { Form, Input, InputNumber, Button, Select, DatePicker, Row, Col, Card, Descriptions, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined, CheckOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import axios from 'axios';
import dayjs from 'dayjs';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import calculate from '@/utils/calculate'; // Import library calculate
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

const { TextArea } = Input;

const cardStyle = {
    marginBottom: '20px',
    border: '1px solid #e8e8e8',
    borderRadius: '40',
};
const positionColors = {
    Depan: "#E6C200",   // Soft Gold (lebih elegan dari emas terang)
    Tengah: "#A4D0A4",  // Pastel Green (lebih lembut)
    Belakang: "#A4C7E6" // Soft Blue (lebih kalem)
};

export default function BongkarForm({
    subTotal,
    offerTotal,
    onValuesChange,
    onSubmit
}) {
    const translate = useLanguage();
    const [form] = Form.useForm();
    const [panenData, setPanenData] = useState(null);
    const [loadingPanen, setLoadingPanen] = useState(false);
    const [idTambak, setIdTambak] = useState(null);
    
    const [potPercentage, setPotPercentage] = useState('');
    const [subtotal, setSubtotal] = useState('');
    const [potPercentageDisabled, setPotPercentageDisabled] = useState(true);
    const [subtotalDisabled, setSubtotalDisabled] = useState(true);

    const updateFormValue = useCallback((fieldName, value) => {
        if (value !== form.getFieldValue(fieldName)) {
            form.setFieldsValue({ [fieldName]: value });
        }
    }, [form]);

    useEffect(() => {
        setPotPercentageDisabled(subtotal.length > 0);
        setSubtotalDisabled(potPercentage.length > 0);
    }, [potPercentage, subtotal]);


    const handlePotPercentageChange = useCallback((e) => {
        const val = e.target.value;
        setPotPercentage(val);
        updateFormValue('persen_potongan', val);
    }, [updateFormValue]);

    const handleSubtotalChange = useCallback((e) => {
        const val = e.target.value;
        setSubtotal(val);
        updateFormValue('sub_total', val);
    }, [updateFormValue]);

    // State baru untuk menyimpan detail bongkar secara lokal (untuk perhitungan)
    const [localDetailBongkar, setLocalDetailBongkar] = useState({});
    
    function includeToken() {
    axios.defaults.baseURL = API_BASE_URL;

    axios.defaults.withCredentials = true;
    const auth = storePersist.get('auth');

    if (auth) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${auth.current.token}`;
    }
    }

    const handleGetPanenData = async () => {
        setLoadingPanen(true);
        try {
            const nopol = form.getFieldValue('nopol');
            const tanggal = form.getFieldValue('tanggal_panen') ? dayjs(form.getFieldValue('tanggal_panen')).format('YYYY-MM-DD') : null;

            if (!nopol || !tanggal || !idTambak) {
                console.error('Nopol dan tanggal bongkar harus diisi');
                return;
            }
                    
            includeToken();
            const response = await axios.get(`panen/getDetailPanenbyNopol?nopol=${nopol}&tanggal=${tanggal}&id_tambak=${idTambak}`)

            if (response.data.success && response.data.result.length > 0) {
                const dataPanen = response.data.result[0];
                setPanenData(dataPanen);

                // Isi form dengan data dari API
                form.setFieldsValue({
                    nopol: dataPanen.nopol,
                    driver: dataPanen.driver,
                    staff: dataPanen.staff,
                    id_panen: dataPanen.id // Set ID Panen di form
                });

                // Inisialisasi localDetailBongkar dengan posisi saja (tanpa detail awal)
                const initialLocalDetailBongkar = {};
                dataPanen.detail.forEach(detail => {
                    const posisi = detail.posisi;
                    if (!initialLocalDetailBongkar[posisi]) {
                        initialLocalDetailBongkar[posisi] = [];
                    }
                });
                setLocalDetailBongkar(initialLocalDetailBongkar);


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

    const getTotals = (posisi, useBongkarData = false) => {
        let total = 0;

        if (!panenData?.detail) return 0;

        if (useBongkarData) {
            // Menghitung total berat dari localDetailBongkar
            const details = localDetailBongkar[posisi] || [];
            total = details.reduce((acc, detail) => {
                return acc + (parseFloat(detail.berat_bongkar) || 0);
            }, 0);
        } else {
            total = panenData.detail
                .filter(d => d.posisi === posisi)
                .reduce((acc, curr) => acc + parseFloat(curr.berat), 0);
        }

        return total;
    };

    // Fungsi untuk menghitung subtotal berdasarkan localDetailBongkar
    const calculateSubtotal = (posisi) => {
        let total = 0;
        const details = localDetailBongkar[posisi] || [];

        details.forEach(detail => {
            const berat = parseFloat(detail.berat_bongkar) || 0;
            const harga = parseFloat(detail.harga) || 0;
            const persen_molting = parseFloat(detail.persen_molting) || 0;
            const subtotal = parseFloat(detail.subtotal) || 0;

            //Pastikan nilai persen_molting tidak NaN
            const molting = isNaN(persen_molting) ? 0 : persen_molting;

            // subtotal = calculate.add(subtotal, (berat * harga)-(berat * harga * (molting / 100)));
            total = calculate.add(total, subtotal);
        });

        return total;
    };

    // Fungsi untuk menghandle perubahan pada input detail bongkar
    const handleLocalDetailChange = (posisi, index, field, value) => {
        setLocalDetailBongkar(prev => {
            const updatedDetails = { ...prev };
            if (!updatedDetails[posisi]) {
                updatedDetails[posisi] = [];
            }
            if (!updatedDetails[posisi][index]) {
                updatedDetails[posisi][index] = {};
            }
            updatedDetails[posisi][index] = { ...updatedDetails[posisi][index], [field]: value };

            return updatedDetails;
        });
    };

    // Fungsi untuk menambahkan detail bongkar baru
    const handleLocalAddDetailBongkar = (posisi) => {
        setLocalDetailBongkar(prev => {
            const updatedDetails = { ...prev };
            if (!updatedDetails[posisi]) {
                updatedDetails[posisi] = [];
            }

            const detailPanenUntukPosisi = panenData.detail.filter(d => d.posisi === posisi);
            const currentIndex = updatedDetails[posisi].length; // Index detail yang akan ditambahkan

            let detailPanenId;

            // Jika index masih dalam rentang detail panen, ambil ID sesuai index
            if (currentIndex < detailPanenUntukPosisi.length) {
                detailPanenId = detailPanenUntukPosisi[currentIndex].id;
            } else {
                // Jika melebihi, gunakan ID panen terakhir
                detailPanenId = detailPanenUntukPosisi[detailPanenUntukPosisi.length - 1]?.id || null; // Ambil ID detail panen terakhir atau null jika tidak ada
            }

            updatedDetails[posisi] = [...updatedDetails[posisi], {
                id_detail_panen: detailPanenId,
                berat_bongkar: '',
                size: '',
                kualitas: '', // Tambahkan field untuk input kualitas
                persen_molting: '',
                harga: '',
                subtotal: ''
            }];
            return updatedDetails;
        });
    };

    // Fungsi untuk menghapus detail bongkar
    const handleLocalRemoveDetailBongkar = (posisi, index) => {
        setLocalDetailBongkar(prev => {
            const updatedDetails = { ...prev };
            updatedDetails[posisi].splice(index, 1);
            return updatedDetails;
        });
    };

    const isInitialRender = useRef(true);

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        if (onValuesChange) {
            onValuesChange({}, form.getFieldsValue());
        }
    }, [onValuesChange]);

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
                onSubmit({ ...values, panenData, localDetailBongkar });// Kirim data form ke CreateItem
            }}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="tanggal_panen"
                        label={translate('Tanggal Panen')}
                        rules={[{ required: true, message: 'Tanggal panen harus diisi' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="nopol"
                        label={translate('Nomor Polisi')}
                        rules={[{ required: true, message: 'Nomor polisi harus diisi' }]}
                    >
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="id_tambak"
                        label={translate('Tambak')}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >

                        <AutoCompleteAsync
                            entity={'tambak'}
                            displayLabels={['nama_perusahaan']}
                            searchFields={'nama_perusahaan'}
                            onChange={(selectedId) => setIdTambak(selectedId)}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="id_panen"
                        hidden={true}
                    >
                        <Input />
                    </Form.Item>
                </Col>
            </Row>

            <Button type="primary" onClick={handleGetPanenData} loading={loadingPanen}>
                {translate('Ambil Data Panen')}
            </Button>

            {panenData && (
                <div >
                    <div className="space30"></div>
                    {/* <hr /> */}
                    <Row gutter={16} style={{ fontWeight: 'bold', background: '#f0f0f0', padding: '10px', borderBottom: '1px solid #ddd' }}>
                        <Col span={6}>{translate('Lokasi')}</Col>
                        <Col span={6}>{translate('Staff')}</Col>
                        <Col span={6}>{translate('Perusahaan')}</Col>
                        <Col span={6}>{translate('No Polisi')}</Col>
                    </Row>
                    <Row gutter={16} style={{ padding: '10px' }}>
                        <Col span={6}>{panenData.lokasi}</Col>
                        <Col span={6}>{panenData.staff}</Col>
                        <Col span={6}>{panenData.nama_perusahaan}</Col>
                        <Col span={6}>{panenData.nopol}</Col>
                    </Row>
                    <hr />

                    <div className="space30"></div>
                    <div>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item
                                    name="pabrik"
                                    label={translate('Nama Pabrik')}
                                    rules={[{ required: true, message: 'Nama pabrik harus diisi' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="tanggal_bongkar"
                                    label={translate('Tanggal Bongkar')}
                                    rules={[{ required: true, message: 'Tanggal bongkar harus diisi' }]}
                                >
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={5}>
                                <Form.Item
                                    name="persen_potongan"
                                    label={translate('Pot (%)')}
                                >
                                    <Input
                                        disabled={potPercentageDisabled}
                                        onChange={handlePotPercentageChange}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="sub_total"
                                    label={translate('Subtotal (Nota)')}
                                >
                                     <Input
                                        disabled={subtotalDisabled}
                                        onChange={handleSubtotalChange}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                </div>
            )}
            <Row gutter={16}>
                {panenData?.detail && [...new Set(panenData.detail.map(d => d.posisi))].map(posisi => {
                    // Hitung Total Subtotal untuk posisi ini
                    const totalSubtotal = calculateSubtotal(posisi);
                    const details = localDetailBongkar[posisi] || [];

                    return (

                        <Col span={24} key={posisi}>
                            <Card
                                style={{
                                    ...cardStyle,
                                    backgroundColor: "#f0f0f0",
                                    body: { paddingBottom: "10px" }
                                }}

                                title={ // Judul sebagai Card Header
                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <span
                                                style={{
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    padding: '8px',
                                                    backgroundColor: positionColors[posisi] || "#f0f0f0",
                                                    borderRadius: '5px',
                                                    display: "block",
                                                    color: '#ffffff'
                                                }}
                                            >
                                                {translate(posisi)}
                                            </span>
                                        </Col>
                                    </Row>
                                }
                            >
                                <Row gutter={16}>
                                    {/* Data Panen di Kiri */}
                                    <Col span={6}>
                                        <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong>Data Panen:</strong>

                                        </p>
                                        <Row gutter={8} style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '5px', fontWeight: 'bold' }}>
                                            <Col span={8}>Tanggal</Col>
                                            <Col span={8}>Berat (Kg)</Col>
                                            <Col span={8}>Size</Col>
                                        </Row>
                                        {panenData && panenData.detail && panenData.detail
                                            .filter(d => d.posisi === posisi)
                                            .map((detailPanen, index) => (
                                                <Row key={index} gutter={8} style={{ borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '3px', position: 'relative' }}>
                                                    <Col span={8}>{detailPanen.created_date}</Col>
                                                    <Col span={8}>{detailPanen.berat}</Col>
                                                    <Col span={8}>{detailPanen.size}</Col>
                                                </Row>
                                            ))}
                                    </Col>

                                    {/* Divider Dashed di Tengah */}
                                    <Col span={1} style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div style={{
                                            borderRight: '2px dashed #999',
                                            height: '100%',
                                            minHeight: '120px'
                                        }} />
                                    </Col>

                                    {/* Data Bongkar di Kanan */}
                                    <Col span={16}>
                                        <p><strong>Data Bongkar:</strong></p>
                                        {/* Input Detail Bongkar (Awalnya Kosong) */}
                                        <Row gutter={16} style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                            <Col span={4}>{translate('Berat (Kg)')}</Col>
                                            <Col span={4}>{translate('Size')}</Col>
                                            <Col span={3}>{translate('Kualitas')}</Col>
                                            <Col span={3}>{translate('Molting (%)')}</Col>
                                            <Col span={4}>{translate('Harga')}</Col>
                                            <Col span={4}>{translate('Subtotal')}</Col>
                                            <Col span={1}></Col>
                                        </Row>

                                        {details.map((detail, index) => (
                                            <Row gutter={16} align="middle" key={index}>
                                                <Col span={4}>
                                                    <Form.Item>
                                                        <InputNumber
                                                            style={{ width: '100%' }}
                                                            value={detail.berat_bongkar}
                                                            onChange={(value) => handleLocalDetailChange(posisi, index, 'berat_bongkar', value)}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={4}>
                                                    <Form.Item>
                                                        <InputNumber
                                                            style={{ width: '100%' }}
                                                            value={detail.size}
                                                            onChange={(value) => handleLocalDetailChange(posisi, index, 'size', value)}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                {/* Input Text Baru (Kualitas) */}
                                                <Col span={3}>
                                                    <Form.Item>
                                                        <Input
                                                            style={{ width: '100%' }}
                                                            value={detail.kualitas}
                                                            onChange={(e) => handleLocalDetailChange(posisi, index, 'kualitas', e.target.value)}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={3}>
                                                    <Form.Item>
                                                        <InputNumber
                                                            style={{ width: '100%' }}
                                                            value={detail.persen_molting}
                                                            onChange={(value) => handleLocalDetailChange(posisi, index, 'persen_molting', value)}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={4}>
                                                    <Form.Item>
                                                        <InputNumber
                                                            style={{ width: '100%' }}
                                                            value={detail.harga}
                                                            onChange={(value) => handleLocalDetailChange(posisi, index, 'harga', value)}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={4}>
                                                    <Form.Item>
                                                        <InputNumber
                                                            style={{ width: '100%' }}
                                                            value={detail.subtotal}
                                                            onChange={(value) => handleLocalDetailChange(posisi, index, 'subtotal', value)}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={1}>
                                                    <Button
                                                        type="danger"
                                                        icon={<MinusCircleOutlined />}
                                                        style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-20px' }}
                                                        onClick={() => handleLocalRemoveDetailBongkar(posisi, index)} />
                                                </Col>
                                            </Row>
                                        ))}

                                        <Button type="dashed" onClick={() => handleLocalAddDetailBongkar(posisi)} icon={<PlusOutlined />}>
                                            {translate('Add Detail')}
                                        </Button>
                                    </Col>
                                </Row>

                                {/* Footer Card untuk Total Panen & Bongkar */}
                                <div style={{
                                    borderTop: "2px solid #ccc",
                                    paddingTop: "10px",
                                    marginTop: "15px",
                                    fontWeight: "bold",
                                    textAlign: "center"
                                }}>
                                    <Row>
                                        <Col span={8} style={{ textAlign: "left" }}>Total Panen: {getTotals(posisi)} Kg</Col>
                                        <Col span={3} style={{ textAlign: "left" }}>Total Bongkar </Col>
                                        <Col span={1} style={{ textAlign: "left" }}> : </Col>
                                        <Col span={8} style={{ textAlign: "left" }}> {getTotals(posisi, true)} Kg</Col>
                                    </Row>
                                    <Row>
                                        <Col span={8} />
                                        <Col span={3} style={{ textAlign: "left" }}>Total Harga </Col>
                                        <Col span={1} style={{ textAlign: "left" }}> : </Col>
                                        <Col span={8} style={{ textAlign: "left", fontWeight: "bold" }}>
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'decimal',
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }).format(totalSubtotal)}
                                        </Col>
                                    </Row>
                                </div>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {panenData && (
                <Form.Item style={{ marginTop: 20 }}>
                    <Button type="primary" htmlType="submit">
                        {translate('Simpan')}
                    </Button>
                </Form.Item>
            )}
        </Form>
    );
}