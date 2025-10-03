import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Form, Input, InputNumber, Button, Select, DatePicker,
    Row, Col, Card, Modal, Table, Typography, Divider, Popconfirm, message, Empty
} from 'antd';
import {
    PlusOutlined, MinusCircleOutlined, CheckOutlined,
    ShoppingOutlined, TruckOutlined,
    DatabaseOutlined, FileTextOutlined, PercentageOutlined,
    DollarOutlined, CalendarOutlined, NumberOutlined,
    BarcodeOutlined, StarOutlined, CloudOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import axios from 'axios';
import dayjs from 'dayjs';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import calculate from '@/utils/calculate';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

const { Text } = Typography;

const cardStyle = {
    marginBottom: '20px',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
};

const positionColors = {
    Depan: '#FFA500',
    Tengah: '#4CAF50',
    Belakang: '#2196F3'
};

/** ====== Util angka (locale Indonesia) ======
 *  - formatter: tampilan ribuan '.' dan desimal ','
 *  - parser: buang ribuan & ganti ',' jadi '.'
 *  Pakai di <InputNumber {...numberID} stringMode />
 */
const numberID = {
    formatter: (val) => {
        if (val === null || val === undefined || val === '') return '';
        const s = String(val);
        const norm = s.replace(',', '.'); // normalisasi
        const parts = norm.split('.');
        const intPartRaw = parts[0];
        const decPart = parts[1];
        const intOnly = (intPartRaw || '').replace(/[^\d-]/g, '');
        const intFmt = intOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return decPart !== undefined ? `${intFmt},${decPart}` : intFmt;
    },
    parser: (val) => {
        if (typeof val !== 'string') return val;
        return val.replace(/\./g, '').replace(',', '.');
    },
};

// parse aman ke number
const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
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
    const [showPanenSelection, setShowPanenSelection] = useState(false);
    const [currentPosisi, setCurrentPosisi] = useState(null);

    const [potPercentage, setPotPercentage] = useState(''); // stringMode
    const [subtotal, setSubtotal] = useState('');           // stringMode
    const [potPercentageDisabled, setPotPercentageDisabled] = useState(true);
    const [subtotalDisabled, setSubtotalDisabled] = useState(true);

    // detail bongkar per posisi
    const [localDetailBongkar, setLocalDetailBongkar] = useState({});

    // ========== SPB (searchable, multi) ==========
    const [spbOptions, setSpbOptions] = useState([]);
    const [spbLoading, setSpbLoading] = useState(false);
    const [spbMap, setSpbMap] = useState({}); // id -> no_spb

    function includeToken() {
        axios.defaults.baseURL = API_BASE_URL;
        axios.defaults.withCredentials = true;
        const auth = storePersist.get('auth');
        if (auth) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${auth.current.token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }

    const fetchSPB = async (q = '') => {
        try {
            setSpbLoading(true);
            includeToken();
            const { data } = await axios.get('spb/search', { params: { q } });
            const list = (data?.result || data?.data || []).map((d) => ({
                label: d.no_spb,
                value: d.id,
            }));
            setSpbOptions(list);
            const dict = {};
            list.forEach((it) => { dict[String(it.value)] = it.label; });
            setSpbMap(dict);
        } catch {
            // silent
        } finally {
            setSpbLoading(false);
        }
    };
    useEffect(() => { fetchSPB(''); }, []);

    // ===== Pot(%) vs Subtotal toggle =====
    const updateFormValue = useCallback((fieldName, value) => {
        if (value !== form.getFieldValue(fieldName)) {
            form.setFieldsValue({ [fieldName]: value });
        }
    }, [form]);

    useEffect(() => {
        setPotPercentageDisabled((subtotal ?? '').length > 0);
        setSubtotalDisabled((potPercentage ?? '').length > 0);
    }, [potPercentage, subtotal]);

    // handler untuk InputNumber (bukan e.target.value)
    const handlePotPercentageChange = useCallback((val) => {
        const v = (val ?? '');
        setPotPercentage(v);
        updateFormValue('persen_potongan', v);
    }, [updateFormValue]);

    const handleSubtotalChange = useCallback((val) => {
        const v = (val ?? '');
        setSubtotal(v);
        updateFormValue('sub_total', v);
    }, [updateFormValue]);

    // ===== Ambil data panen =====
    const handleGetPanenData = async () => {
        setLoadingPanen(true);
        try {
            const nopol = form.getFieldValue('nopol');
            const tanggal = form.getFieldValue('tanggal_panen')
                ? dayjs(form.getFieldValue('tanggal_panen')).format('YYYY-MM-DD')
                : null;

            if (!nopol || !tanggal || !idTambak) {
                console.error('Nopol dan tanggal bongkar harus diisi');
                return;
            }

            includeToken();
            const response = await axios.get(`panen/getDetailPanenbyNopol?nopol=${nopol}&tanggal=${tanggal}&id_tambak=${idTambak}`);

            if (response.data.success && response.data.result.length > 0) {
                const dataPanen = response.data.result[0];
                setPanenData(dataPanen);

                form.setFieldsValue({
                    nopol: dataPanen.nopol,
                    driver: dataPanen.driver,
                    staff: dataPanen.staff,
                    id_panen: dataPanen.id
                });

                // seed struktur posisi (tanpa baris)
                const initialLocalDetailBongkar = {};
                (dataPanen.detail || []).forEach((detail) => {
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

    // ===== Agregasi/Hitung =====
    const getTotals = (posisi, useBongkarData = false) => {
        if (!panenData?.detail) return 0;
        if (useBongkarData) {
            const details = localDetailBongkar[posisi] || [];
            return details.reduce((acc, detail) => acc + toNum(detail.berat_bongkar), 0);
        } else {
            return panenData.detail
                .filter((d) => d.posisi === posisi)
                .reduce((acc, curr) => acc + toNum(curr.berat), 0);
        }
    };

    const calculateSubtotal = (posisi) => {
        let total = 0;
        const details = localDetailBongkar[posisi] || [];
        details.forEach(detail => {
            total = calculate.add(total, toNum(detail.subtotal));
        });
        return total;
    };

    // ===== Mutasi baris detail (termasuk spb_ids + spb_alokasi) =====
    const handleLocalDetailChange = (posisi, index, field, value) => {
        setLocalDetailBongkar(prev => {
            const updatedDetails = { ...prev };
            if (!updatedDetails[posisi]) updatedDetails[posisi] = [];
            if (!updatedDetails[posisi][index]) updatedDetails[posisi][index] = {};

            // init struktur alokasi saat pertama kali ada spb dipilih
            if (field === 'spb_ids') {
                const selected = value || [];
                const currentAlloc = updatedDetails[posisi][index].spb_alokasi || {};
                // hapus alokasi yang tidak dipilih lagi
                Object.keys(currentAlloc).forEach(id => {
                    if (!selected.includes(Number(id)) && !selected.includes(id)) {
                        delete currentAlloc[id];
                    }
                });
                // siapkan kunci alokasi untuk spb yang baru dipilih
                selected.forEach((id) => {
                    const key = String(id);
                    if (currentAlloc[key] === undefined) currentAlloc[key] = '';
                });
                updatedDetails[posisi][index] = {
                    ...updatedDetails[posisi][index],
                    spb_ids: selected,
                    spb_alokasi: currentAlloc
                };
                return updatedDetails;
            }

            // perubahan biasa
            updatedDetails[posisi][index] = {
                ...updatedDetails[posisi][index],
                [field]: value
            };

            // hitung ulang subtotal kalau field terkait berubah
            if (['berat_bongkar', 'harga', 'persen_molting'].includes(field)) {
                const berat = toNum(updatedDetails[posisi][index].berat_bongkar);
                const harga = toNum(updatedDetails[posisi][index].harga);
                const molting = toNum(updatedDetails[posisi][index].persen_molting);
                const gross = berat * harga;
                const pot = gross * (molting / 100);
                updatedDetails[posisi][index].subtotal = gross - pot;
            }

            return updatedDetails;
        });
    };

    const handleAddDetailClick = (posisi) => {
        setCurrentPosisi(posisi);
        setShowPanenSelection(true);
    };

    const handleSelectPanenDetail = (selectedPanenDetail) => {
        setShowPanenSelection(false);
        if (!currentPosisi) return;
        setLocalDetailBongkar(prev => {
            const updatedDetails = { ...prev };
            if (!updatedDetails[currentPosisi]) updatedDetails[currentPosisi] = [];

            updatedDetails[currentPosisi] = [
                ...updatedDetails[currentPosisi],
                {
                    id_detail_panen: selectedPanenDetail.id,
                    berat_bongkar: null,   // InputNumber happy dengan null
                    size: null,
                    kualitas: '',
                    persen_molting: null,
                    harga: null,
                    subtotal: 0,
                    spb_ids: [],
                    spb_alokasi: {} // { [spbId]: qty (stringMode) }
                }
            ];
            return updatedDetails;
        });
    };

    const handleLocalRemoveDetailBongkar = (posisi, index) => {
        setLocalDetailBongkar(prev => {
            const updatedDetails = { ...prev };
            updatedDetails[posisi].splice(index, 1);
            return updatedDetails;
        });
    };

    // ===== notif parent =====
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        if (onValuesChange) {
            onValuesChange({}, form.getFieldsValue());
        }
    }, [onValuesChange, form]);

    // ===== modal pilih detail panen =====
    const panenColumns = [
        { title: 'Tanggal', dataIndex: 'created_date', key: 'created_date' },
        { title: 'Berat (Kg)', dataIndex: 'berat', key: 'berat' },
        { title: 'Size', dataIndex: 'size', key: 'size' },
        { title: 'Posisi', dataIndex: 'posisi', key: 'posisi' },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button type="primary" icon={<CheckOutlined />} onClick={() => handleSelectPanenDetail(record)}>
                    Pilih
                </Button>
            ),
        },
    ];

    // ===== Validasi alokasi SPB per baris (dipanggil saat submit) =====
    const validateSPBAllocations = () => {
        const errors = [];
        Object.entries(localDetailBongkar).forEach(([posisi, rows]) => {
            (rows || []).forEach((row, idx) => {
                const ids = row.spb_ids || [];
                if (ids.length > 1) {
                    const alloc = row.spb_alokasi || {};
                    for (const id of ids) {
                        const key = String(id);
                        const val = toNum(alloc[key]); // stringMode → parse
                        if (!Number.isFinite(val)) {
                            errors.push(`Posisi ${posisi} baris ${idx + 1}: alokasi untuk SPB ${spbMap[key] || key} harus angka`);
                        }
                        if (val < 0) {
                            errors.push(`Posisi ${posisi} baris ${idx + 1}: alokasi untuk SPB ${spbMap[key] || key} tidak boleh negatif`);
                        }
                    }
                    // Opsional: pastikan total alokasi = berat_bongkar
                    // const sumAlloc = ids.reduce((a, id) => a + toNum(alloc[String(id)]), 0);
                    // const berat = toNum(row.berat_bongkar);
                    // if (Math.abs(sumAlloc - berat) > 1e-9) {
                    //   errors.push(`Posisi ${posisi} baris ${idx + 1}: total alokasi (${sumAlloc}) harus sama dengan berat bongkar (${berat})`);
                    // }
                }
            });
        });
        return errors;
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
                const errs = validateSPBAllocations();
                if (errs.length) {
                    message.error(errs[0]);
                    return;
                }
                onSubmit({ ...values, panenData, localDetailBongkar });
            }}
        >
            {/* FILTER PENGAMBILAN DATA PANEN */}
            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item
                        name="tanggal_panen"
                        label={<span><CalendarOutlined style={{ marginRight: 8 }} />{translate('Tanggal Panen')}</span>}
                        rules={[{ required: true, message: 'Tanggal panen harus diisi' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="nopol"
                        label={<span><TruckOutlined style={{ marginRight: 8 }} />{translate('Nomor Polisi')}</span>}
                        rules={[{ required: true, message: 'Nomor polisi harus diisi' }]}
                    >
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="id_tambak"
                        label={<span><DatabaseOutlined style={{ marginRight: 8 }} />{translate('Tambak')}</span>}
                        rules={[{ required: true }]}
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
                    <Form.Item name="id_panen" hidden>
                        <Input />
                    </Form.Item>
                </Col>
            </Row>

            <Button
                type="primary"
                onClick={handleGetPanenData}
                loading={loadingPanen}
                icon={<CloudOutlined />}
                style={{ marginBottom: 16 }}
            >
                {translate('Ambil Data Panen')}
            </Button>

            {/* INFO PANEN + MASTER INPUT */}
            {panenData && (
                <div>
                    <Card style={{ marginBottom: 16 }}>
                        <Row gutter={16} style={{ fontWeight: 'bold', marginBottom: 8 }}>
                            <Col span={6}><FileTextOutlined style={{ marginRight: 8 }} />{translate('Lokasi')}</Col>
                            <Col span={6}><FileTextOutlined style={{ marginRight: 8 }} />{translate('Staff')}</Col>
                            <Col span={6}><FileTextOutlined style={{ marginRight: 8 }} />{translate('Perusahaan')}</Col>
                            <Col span={6}><FileTextOutlined style={{ marginRight: 8 }} />{translate('No Polisi')}</Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={6}>{panenData.lokasi}</Col>
                            <Col span={6}>{panenData.staff}</Col>
                            <Col span={6}>{panenData.nama_perusahaan}</Col>
                            <Col span={6}>{panenData.nopol}</Col>
                        </Row>
                    </Card>

                    <Card style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item
                                    name="pabrik"
                                    label={<span><ShoppingOutlined style={{ marginRight: 8 }} />{translate('Nama Pabrik')}</span>}
                                    rules={[{ required: true, message: 'Nama pabrik harus diisi' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="tanggal_bongkar"
                                    label={<span><CalendarOutlined style={{ marginRight: 8 }} />{translate('Tanggal Bongkar')}</span>}
                                    rules={[{ required: true, message: 'Tanggal bongkar harus diisi' }]}
                                >
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={5}>
                                <Form.Item
                                    name="persen_potongan"
                                    label={<span><PercentageOutlined style={{ marginRight: 8 }} />{translate('Pot (%)')}</span>}
                                >
                                    <InputNumber
                                        {...numberID}
                                        stringMode
                                        precision={2}
                                        step="0.01"
                                        min={0}
                                        disabled={potPercentageDisabled}
                                        onChange={handlePotPercentageChange}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="sub_total"
                                    label={<span><DollarOutlined style={{ marginRight: 8 }} />{translate('Subtotal (Nota)')}</span>}
                                >
                                    <InputNumber
                                        {...numberID}
                                        stringMode
                                        precision={2}
                                        step="0.01"
                                        min={0}
                                        disabled={subtotalDisabled}
                                        onChange={handleSubtotalChange}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </div>
            )}

            {/* MODAL PILIH DETAIL PANEN */}
            <Modal
                title={<span><DatabaseOutlined style={{ marginRight: 8 }} />Pilih Data Panen</span>}
                open={showPanenSelection}
                onCancel={() => setShowPanenSelection(false)}
                footer={null}
                width={800}
            >
                <Table
                    columns={panenColumns}
                    dataSource={panenData?.detail?.filter((d) => d.posisi === currentPosisi) || []}
                    rowKey="id"
                    pagination={false}
                />
            </Modal>

            {/* PER POSISI */}
            <Row gutter={16}>
                {panenData?.detail && [...new Set(panenData.detail.map((d) => d.posisi))].map((posisi) => {
                    const totalSubtotal = calculateSubtotal(posisi);
                    const details = localDetailBongkar[posisi] || [];
                    const panenDetails = panenData.detail.filter((d) => d.posisi === posisi);

                    return (
                        <Col span={24} key={posisi}>
                            <Card
                                style={{ ...cardStyle, borderTop: `3px solid ${positionColors[posisi] || '#888'}` }}
                                title={
                                    <Text strong style={{ color: positionColors[posisi] || '#555', fontSize: 24 }}>
                                        <DatabaseOutlined style={{ marginRight: 8 }} />
                                        {translate(posisi)}
                                    </Text>
                                }
                            >
                                {/* Header kolom */}
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', marginBottom: 8, fontWeight: 'bold' }}>
                                        {/* kiri (data panen) */}
                                        <div style={{ width: 100 }}>
                                            <CalendarOutlined style={{ marginRight: 8 }} />
                                            Tanggal
                                        </div>
                                        <div style={{ width: 80 }}>
                                            <NumberOutlined style={{ marginRight: 8 }} />
                                            Berat
                                        </div>
                                        <div style={{ width: 80 }}>
                                            <BarcodeOutlined style={{ marginRight: 8 }} />
                                            Size
                                        </div>
                                        {/* kanan (input bongkar) */}
                                        <div style={{ flex: 1, marginLeft: 24 }}>
                                            <Row gutter={8}>
                                                <Col span={3}><NumberOutlined style={{ marginRight: 8 }} />Berat</Col>
                                                <Col span={3}><BarcodeOutlined style={{ marginRight: 8 }} />Size</Col>
                                                <Col span={3}><StarOutlined style={{ marginRight: 8 }} />Kualitas</Col>
                                                <Col span={3}><PercentageOutlined style={{ marginRight: 8 }} />Molting</Col>
                                                <Col span={5}><DollarOutlined style={{ marginRight: 8 }} />Harga</Col>
                                                <Col span={5}><FileTextOutlined style={{ marginRight: 8 }} />Subtotal</Col>
                                                <Col span={2}></Col>
                                            </Row>
                                        </div>
                                    </div>

                                    {/* Isi per detail panen */}
                                    {panenDetails.length ? (
                                        panenDetails.map((detailPanen, panenIndex) => {
                                            const relatedBongkars = details.filter((d) => d.id_detail_panen === detailPanen.id);
                                            return (
                                                <div key={`p-${panenIndex}`} style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {/* Baris panen (kiri) */}
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            padding: '8px 0',
                                                            alignItems: 'center',
                                                            borderBottom: '1px solid #eee'
                                                        }}
                                                    >
                                                        <div style={{ width: 100 }}>{detailPanen.created_date}</div>
                                                        <div style={{ width: 80 }}>{detailPanen.berat}</div>
                                                        <div style={{ width: 80 }}>{detailPanen.size}</div>
                                                    </div>

                                                    {/* Baris bongkar terkait (kanan) */}
                                                    {relatedBongkars.length ? relatedBongkars.map((row, idx) => {
                                                        const detailIndex = details.findIndex((d) => d.id_detail_panen === detailPanen.id && d === row);
                                                        const alloc = row.spb_alokasi || {};
                                                        return (
                                                            <div
                                                                key={`b-${idx}`}
                                                                style={{ display: 'flex', padding: '8px 0', alignItems: 'center', background: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}
                                                            >
                                                                <div style={{ width: 260 }} />
                                                                <div style={{ flex: 1 }}>
                                                                    {/* Row input angka utama */}
                                                                    <Row gutter={8}>
                                                                        <Col span={3}>
                                                                            <InputNumber
                                                                                {...numberID}
                                                                                stringMode
                                                                                precision={2}
                                                                                step="0.01"
                                                                                min={0}
                                                                                style={{ width: '100%' }}
                                                                                value={row.berat_bongkar}
                                                                                onChange={(v) => handleLocalDetailChange(posisi, detailIndex, 'berat_bongkar', v)}
                                                                            />
                                                                        </Col>
                                                                        <Col span={3}>
                                                                            <InputNumber
                                                                                {...numberID}
                                                                                stringMode
                                                                                precision={2}
                                                                                step="0.1"
                                                                                min={0}
                                                                                style={{ width: '100%' }}
                                                                                value={row.size}
                                                                                onChange={(v) => handleLocalDetailChange(posisi, detailIndex, 'size', v)}
                                                                            />
                                                                        </Col>
                                                                        <Col span={3}>
                                                                            <Input
                                                                                style={{ width: '100%' }}
                                                                                value={row.kualitas}
                                                                                onChange={(e) => handleLocalDetailChange(posisi, detailIndex, 'kualitas', e.target.value)}
                                                                            />
                                                                        </Col>
                                                                        <Col span={3}>
                                                                            <InputNumber
                                                                                {...numberID}
                                                                                stringMode
                                                                                precision={2}
                                                                                step="0.01"
                                                                                min={0}
                                                                                style={{ width: '100%' }}
                                                                                value={row.persen_molting}
                                                                                onChange={(v) => handleLocalDetailChange(posisi, detailIndex, 'persen_molting', v)}
                                                                            />
                                                                        </Col>
                                                                        <Col span={5}>
                                                                            <InputNumber
                                                                                {...numberID}
                                                                                stringMode
                                                                                precision={2}
                                                                                step="0.01"
                                                                                min={0}
                                                                                style={{ width: '100%' }}
                                                                                value={row.harga}
                                                                                onChange={(v) => handleLocalDetailChange(posisi, detailIndex, 'harga', v)}
                                                                            />
                                                                        </Col>
                                                                        <Col span={5}>
                                                                            <InputNumber
                                                                                {...numberID}
                                                                                stringMode
                                                                                precision={2}
                                                                                disabled
                                                                                style={{ width: '100%' }}
                                                                                value={toNum(row.subtotal).toFixed(2)}
                                                                            />
                                                                        </Col>
                                                                        <Col span={2}>
                                                                            <Popconfirm
                                                                                title={translate('Hapus baris ini?')}
                                                                                okText={translate('Hapus')}
                                                                                cancelText={translate('Batal')}
                                                                                onConfirm={() => handleLocalRemoveDetailBongkar(posisi, detailIndex)}
                                                                            >
                                                                                <Button type="text" danger icon={<MinusCircleOutlined />} />
                                                                            </Popconfirm>
                                                                        </Col>
                                                                    </Row>

                                                                    {/* Select SPB (multi) */}
                                                                    <Row gutter={8} style={{ marginTop: 8 }}>
                                                                        <Col span={24}>
                                                                            <div style={{ fontSize: 12, marginBottom: 6 }}>
                                                                                <FileTextOutlined style={{ marginRight: 6 }} />
                                                                                Nomor SPB (bisa lebih dari satu)
                                                                            </div>
                                                                            <Select
                                                                                mode="multiple"
                                                                                allowClear
                                                                                showSearch
                                                                                placeholder="Pilih SPB…"
                                                                                value={row.spb_ids || []}
                                                                                options={spbOptions}
                                                                                loading={spbLoading}
                                                                                filterOption={false}
                                                                                onSearch={(txt) => fetchSPB(txt)}
                                                                                onChange={(vals) => handleLocalDetailChange(posisi, detailIndex, 'spb_ids', vals)}
                                                                                style={{ width: '100%' }}
                                                                            />
                                                                        </Col>
                                                                    </Row>

                                                                    {/* Alokasi per SPB (muncul jika > 1) */}
                                                                    {(row.spb_ids || []).length > 1 && (
                                                                        <div style={{ background: '#fff', border: '1px dashed #ddd', padding: 8, marginTop: 8, borderRadius: 6 }}>
                                                                            <Text strong>Alokasi kuantitas per SPB</Text>
                                                                            <Row gutter={8} style={{ marginTop: 8 }}>
                                                                                {(row.spb_ids || []).map((sid) => {
                                                                                    const key = String(sid);
                                                                                    return (
                                                                                        <Col xs={24} md={12} lg={8} key={key} style={{ marginBottom: 8 }}>
                                                                                            <div style={{ fontSize: 12, marginBottom: 4 }}>
                                                                                                {spbMap[key] || `SPB ${key}`}
                                                                                            </div>
                                                                                            <InputNumber
                                                                                                {...numberID}
                                                                                                stringMode
                                                                                                precision={2}
                                                                                                step="0.01"
                                                                                                min={0}
                                                                                                style={{ width: '100%' }}
                                                                                                value={(row.spb_alokasi && row.spb_alokasi[key]) || null}
                                                                                                onChange={(v) => {
                                                                                                    const next = { ...(row.spb_alokasi || {}) };
                                                                                                    next[key] = v;
                                                                                                    handleLocalDetailChange(posisi, detailIndex, 'spb_alokasi', next);
                                                                                                }}
                                                                                            />
                                                                                        </Col>
                                                                                    );
                                                                                })}
                                                                            </Row>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <div style={{ padding: '8px 0', color: '#999' }}>
                                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={translate('Belum ada bongkar untuk panen ini')} />
                                                        </div>
                                                    )}

                                                    {/* Tombol tambah baris bongkar */}
                                                    <Button
                                                        type="dashed"
                                                        onClick={() => handleAddDetailClick(posisi)}
                                                        icon={<PlusOutlined />}
                                                        style={{ width: '100%', marginTop: 16 }}
                                                    >
                                                        {translate('Tambah Bongkar')}
                                                    </Button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ padding: '8px 0', color: '#999' }}>
                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={translate('Belum ada data panen di posisi ini')} />
                                        </div>
                                    )}
                                </div>

                                <Divider />

                                {/* Totals */}
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Text strong>
                                            <NumberOutlined style={{ marginRight: 8 }} />
                                            {translate('Total Panen')}: {getTotals(posisi)} Kg
                                        </Text>
                                    </Col>
                                    <Col span={12}>
                                        <Text strong>
                                            <NumberOutlined style={{ marginRight: 8 }} />
                                            {translate('Total Bongkar')}: {getTotals(posisi, true)} Kg
                                        </Text>
                                    </Col>
                                </Row>
                                <Row style={{ marginTop: 8 }}>
                                    <Col span={24}>
                                        <Text strong>
                                            <DollarOutlined style={{ marginRight: 8 }} />
                                            {translate('Total Harga')}: {new Intl.NumberFormat('id-ID', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalSubtotal)}
                                        </Text>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {panenData && (
                <Form.Item style={{ marginTop: 20 }}>
                    <Button type="primary" htmlType="submit" icon={<CheckOutlined />} size="large">
                        {translate('Simpan')}
                    </Button>
                </Form.Item>
            )}
        </Form>
    );
}
