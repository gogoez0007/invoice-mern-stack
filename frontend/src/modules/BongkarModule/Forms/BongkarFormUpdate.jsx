import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Form, Input, InputNumber, Button, DatePicker, Select,
    Row, Col, Card, Modal, Table, Typography, Divider, message, Empty, Tag, Popconfirm
} from 'antd';
import {
    PlusOutlined, MinusCircleOutlined, CheckOutlined,
    ShoppingOutlined, DatabaseOutlined, FileTextOutlined,
    PercentageOutlined, DollarOutlined, CalendarOutlined,
    NumberOutlined, BarcodeOutlined, StarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

const { Text } = Typography;

// ===== Helpers / constants =====
const positionColors = { Depan: '#FFA500', Tengah: '#4CAF50', Belakang: '#2196F3' };
const cardStyle = {
    marginBottom: 20,
    border: '1px solid #e8e8e8',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
};

function includeToken() {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.withCredentials = true;
    const auth = storePersist.get('auth');
    if (auth?.current?.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${auth.current.token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
}

/** ====== Util angka (locale Indonesia) — sama dengan yang kamu pakai ======
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

export default function BongkarFormUpdate({
    translate,
    itemsByPosition = {},        // existing bongkar grouped by posisi (untuk edit)
    currentErp = {},             // { id, panen_id, ... }
    dateFormat = 'YYYY-MM-DD',
    formatNumber = (n) => (n || 0).toLocaleString('id-ID'),
    onSubmit,
}) {
    const [form] = Form.useForm();

    // ===== State =====
    const [panenData, setPanenData] = useState(null);
    const [showPanenSelection, setShowPanenSelection] = useState(false);
    const [currentPosisi, setCurrentPosisi] = useState(null);

    const [potPercentage, setPotPercentage] = useState('');
    const [subtotalNota, setSubtotalNota] = useState('');
    const [potPercentageDisabled, setPotPercentageDisabled] = useState(true);
    const [subtotalDisabled, setSubtotalDisabled] = useState(true);

    // Struktur lokal per posisi -> array of rows
    // Row: {_localKey?, id?, id_detail_panen, berat_bongkar, size, kualitas, persen_molting, harga, subtotal, tanggal, spb_ids?, spb_alokasi?{}}
    const [localDetailBongkar, setLocalDetailBongkar] = useState({});
    const [modifiedDetail, setModifiedDetail] = useState([]);

    // ====== SPB lookup ======
    const [spbOptions, setSpbOptions] = useState([]);
    const [spbLoading, setSpbLoading] = useState(false);
    const [spbMap, setSpbMap] = useState({}); // id -> no_spb

    const fetchSPB = async (q = '') => {
        try {
            setSpbLoading(true);
            includeToken();
            const { data } = await axios.get('spb/search', { params: { q } });
            const list = (data?.result || data?.data || []).map((d) => ({
                label: d.no_spb, value: d.id,
            }));
            setSpbOptions(list);
            const dict = {};
            list.forEach((it) => { dict[String(it.value)] = it.label; });
            setSpbMap(dict);
        } catch (_) {
            // ignore
        } finally {
            setSpbLoading(false);
        }
    };
    useEffect(() => { fetchSPB(''); }, []);

    // ===== Prefill form dari currentErp (tanpa no_spb) =====
    useEffect(() => {
        form.setFieldsValue({
            tanggal_panen: currentErp?.tanggal_panen ? dayjs(currentErp.tanggal_panen) : null,
            nopol: currentErp?.nopol,
            nama_pabrik: currentErp?.nama_pabrik || currentErp?.pabrik,
            tanggal_bongkar: currentErp?.tanggal_bongkar ? dayjs(currentErp.tanggal_bongkar) : null,
            persen_potongan: currentErp?.persen_potongan,
            master_sub_total: currentErp?.sub_total,
            id_panen: currentErp?.panen_id ?? currentErp?.id_panen ?? undefined,
        });
        setPotPercentage(currentErp?.persen_potongan ?? '');
        setSubtotalNota(currentErp?.sub_total ?? '');
    }, [currentErp, form]);

    // ===== Seed details dari hasil read (itemsByPosition) =====
    useEffect(() => {
        const grouped = {};
        Object.keys(itemsByPosition || {}).forEach((pos) => {
            grouped[pos] = (itemsByPosition[pos] || []).map((it) => {
                const rels = Array.isArray(it.spb_relations) ? it.spb_relations : [];
                const spb_ids = rels.map((r) => r.permintaan_id ?? r.id);
                const spb_alokasi = {};
                rels.forEach((r) => { spb_alokasi[String(r.permintaan_id ?? r.id)] = r.alokasi_qty ?? null; });

                return {
                    _localKey: `seed-${it.id || Math.random()}`,
                    id: it.id,
                    posisi: it.posisi || pos,
                    id_detail_panen: it.detail_panen_id ?? it.detailPanenId ?? null,
                    detail_bongkar_id: it.detail_bongkar_id ?? it.detailBongkarId ?? it.urutan ?? null,
                    urutan: it.urutan ?? it.detail_bongkar_id ?? null,
                    tanggal: it.tanggal || it.created_date || null,
                    berat_bongkar: it.berat_bongkar ?? '',
                    size: it.size ?? '',
                    kualitas: it.kualitas ?? '',
                    persen_molting: it.persen_molting ?? '',
                    harga: it.harga ?? '',
                    subtotal: it.sub_total ?? it.subtotal ?? '',
                    spb_ids,
                    spb_alokasi,
                };
            });
        });
        setLocalDetailBongkar(grouped);
    }, [itemsByPosition]);

    // ===== Mutual exclude Pot(%) vs Subtotal Nota =====
    const updateFormValue = useCallback((field, value) => {
        if (value !== form.getFieldValue(field)) form.setFieldsValue({ [field]: value });
    }, [form]);

    useEffect(() => {
        const hasSubtotal = !(subtotalNota === '' || subtotalNota === null || subtotalNota === undefined);
        const hasPot = !(potPercentage === '' || potPercentage === null || potPercentage === undefined);

        if (hasSubtotal) updateFormValue('persen_potongan', '');
        else updateFormValue('master_sub_total', '');

        setPotPercentageDisabled(hasSubtotal);
        setSubtotalDisabled(hasPot);
    }, [potPercentage, subtotalNota, updateFormValue]);

    const handlePotPercentageChange = (value) => {
        setPotPercentage(value);
        updateFormValue('persen_potongan', value);
    };
    const handleSubtotalChange = (value) => {
        setSubtotalNota(value);
        updateFormValue('master_sub_total', value);
    };

    // ====== Fetch master + detail panen by panen_id (auto) ======
    const fetchPanenById = useCallback(async (panenId) => {
        if (!panenId) return;
        try {
            includeToken();
            const res = await axios.get(`panen/read/${panenId}`);
            const payload = res?.data?.result || res?.data?.data || res?.data;
            if (!payload) return;

            const normalized = {
                id: payload.id ?? panenId,
                nopol: payload.nopol,
                staff: payload.staff,
                lokasi: payload.lokasi,
                nama_perusahaan: payload.nama_perusahaan,
                detail: (payload.detail || payload.details || []).map((d) => ({
                    id: d.id,
                    created_date: d.created_date || d.tanggal,
                    berat: d.berat ?? d.weight,
                    size: d.size,
                    posisi: d.posisi,
                })),
            };
            setPanenData(normalized);
        } catch (e) {
            try {
                const resAlt = await axios.get(`panen/${panenId}`);
                const p = resAlt?.data;
                if (p) setPanenData({ ...p, detail: p.detail || p.details || [] });
            } catch (_) { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        const pid = currentErp?.panen_id ?? currentErp?.id_panen ?? form.getFieldValue('id_panen');
        fetchPanenById(pid);
    }, [currentErp?.panen_id, currentErp?.id_panen, fetchPanenById, form]);

    // ===== Utilities =====
    const recalcSubtotal = (detail) => {
        const berat = toNum(detail.berat_bongkar);
        const harga = toNum(detail.harga);
        const molting = toNum(detail.persen_molting);
        return berat * harga - berat * harga * (molting / 100);
    };

    const upsertModified = (predicate, patch) => {
        setModifiedDetail((prev) => {
            const i = prev.findIndex(predicate);
            if (i > -1) {
                const copy = [...prev];
                copy[i] = { ...copy[i], ...patch };
                return copy;
            }
            return [...prev, patch];
        });
    };

    // ===== validasi alokasi SPB saat > 1 =====
    const validateSPBAllocations = () => {
        const errors = [];
        Object.entries(localDetailBongkar).forEach(([posisi, rows]) => {
            (rows || []).forEach((row, idx) => {
                const ids = row.spb_ids || [];
                if (ids.length > 1) {
                    const alloc = row.spb_alokasi || {};
                    for (const id of ids) {
                        const key = String(id);
                        const val = toNum(alloc[key]);
                        if (!Number.isFinite(val) || val < 0) {
                            errors.push(`Posisi ${posisi} baris ${idx + 1}: alokasi untuk SPB ${spbMap[key] || key} harus angka ≥ 0`);
                        }
                    }
                }
            });
        });
        return errors;
    };

    // ===== Handlers: edit / add / remove =====
    const onChangeRow = (posisi, idx, field, value) => {
        setLocalDetailBongkar((prev) => {
            const next = { ...prev };
            const row = { ...(next[posisi]?.[idx] || {}) };

            if (field === 'spb_ids') {
                const selected = value || [];
                const currentAlloc = row.spb_alokasi || {};
                Object.keys(currentAlloc).forEach((k) => {
                    const nk = String(k);
                    if (!selected.includes(Number(nk)) && !selected.includes(nk)) delete currentAlloc[nk];
                });
                selected.forEach((sid) => {
                    const nk = String(sid);
                    if (currentAlloc[nk] === undefined) currentAlloc[nk] = 0;
                });
                row.spb_ids = selected;
                row.spb_alokasi = currentAlloc;
            } else if (field === 'spb_alokasi') {
                row.spb_alokasi = value || {};
            } else {
                row[field] = value;
                if (['berat_bongkar', 'harga', 'persen_molting'].includes(field)) row.subtotal = recalcSubtotal(row);
            }

            const updated = [...(next[posisi] || [])];
            updated[idx] = row;
            next[posisi] = updated;

            const pinnedDetailId = row.id_detail_panen ?? null;
            const patchCommon = {
                posisi: row.posisi || posisi,
                detail_panen_id: pinnedDetailId,
                detail_bongkar_id: row.detail_bongkar_id ?? row.urutan ?? null,
                tanggal: row.tanggal || null,
                berat_bongkar: row.berat_bongkar,
                size: row.size,
                kualitas: row.kualitas,
                persen_molting: row.persen_molting,
                harga: row.harga,
                sub_total: row.subtotal,
                spb_ids: row.spb_ids || [],
                spb_alokasi: row.spb_alokasi || {},
            };

            if (row.id) {
                upsertModified((d) => d.id === row.id && d.action !== 'delete', {
                    action: 'edit',
                    id: row.id,
                    ...patchCommon,
                });
            } else {
                upsertModified((d) => d.action === 'add' && d._localKey === row._localKey, {
                    action: 'add',
                    id: currentErp?.id,
                    _localKey: row._localKey,
                    ...patchCommon,
                });
            }
            return next;
        });
    };

    const removeRow = (posisi, idx) => {
        const row = localDetailBongkar[posisi]?.[idx];
        if (!row) return;

        if (row.id) {
            upsertModified((d) => d.id === row.id, { action: 'delete', id: row.id });
        } else {
            setModifiedDetail((prev) => prev.filter((d) => d._localKey !== row._localKey));
        }

        setLocalDetailBongkar((prev) => {
            const next = { ...prev };
            next[posisi] = (next[posisi] || []).filter((_, i) => i !== idx);
            return next;
        });
    };

    const openPanenModal = (pos) => {
        if (!panenData?.detail || panenData.detail.length === 0) {
            message.warning(translate?.('Data panen belum tersedia (butuh panen_id yang valid)') || 'Data panen belum tersedia');
            return;
        }
        setCurrentPosisi(pos);
        setShowPanenSelection(true);
    };

    const handleSelectPanenDetail = (selected) => {
        if (!currentPosisi) return;
        setShowPanenSelection(false);

        const lk = `${Date.now()}-${Math.random()}`;

        setLocalDetailBongkar((prev) => {
            const next = { ...prev };
            const list = [...(next[currentPosisi] || [])];
            list.push({
                _localKey: lk,
                id: undefined,
                posisi: currentPosisi,
                id_detail_panen: selected.id,
                detail_bongkar_id: null,
                urutan: null,
                tanggal: selected.created_date || selected.tanggal || null,
                berat_bongkar: '',
                size: '',
                kualitas: '',
                persen_molting: '',
                harga: '',
                subtotal: '',
                spb_ids: [],
                spb_alokasi: {},
            });
            next[currentPosisi] = list;
            return next;
        });

        setModifiedDetail((prev) => [
            ...prev,
            {
                action: 'add',
                posisi: currentPosisi,
                id: currentErp?.id,
                _localKey: lk,
                detail_panen_id: selected.id,
                detail_bongkar_id: null,
                tanggal: selected.created_date || selected.tanggal || null,
                berat_bongkar: '',
                size: '',
                kualitas: '',
                persen_molting: '',
                harga: '',
                sub_total: '',
                spb_ids: [],
                spb_alokasi: {},
            },
        ]);
    };

    // ===== panen table (modal) =====
    const panenColumns = [
        {
            title: translate('Tanggal'),
            dataIndex: 'created_date',
            key: 'tanggal',
            render: (v, r) => (r.created_date || r.tanggal ? dayjs(r.created_date || r.tanggal).format(dateFormat) : '-'),
        },
        { title: translate('Berat (Kg)'), dataIndex: 'berat', key: 'berat' },
        { title: translate('Size'), dataIndex: 'size', key: 'size' },
        { title: translate('Posisi'), dataIndex: 'posisi', key: 'posisi' },
        {
            title: 'Action',
            key: 'action',
            render: (_, rec) => (
                <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleSelectPanenDetail(rec)}>
                    {translate('Pilih')}
                </Button>
            ),
        },
    ];

    // ===== Submit =====
    const handleSubmit = () => {
        form.validateFields().then((values) => {
            const errs = validateSPBAllocations();
            if (errs.length) {
                message.error(errs[0]);
                return;
            }

            const panenDateMap = {};
            if (panenData?.detail) for (const d of panenData.detail) panenDateMap[d.id] = d.created_date || d.tanggal || null;

            const normalizedDetails = modifiedDetail.map((d) => {
                const pinnedDetailId = d.detail_panen_id ?? d.id_detail_panen ?? null;
                return {
                    ...d,
                    detail_panen_id: pinnedDetailId,
                    tanggal: d.tanggal || (pinnedDetailId ? panenDateMap[pinnedDetailId] : null),
                };
            });

            const localForPayload = {};
            Object.keys(localDetailBongkar || {}).forEach((pos) => {
                localForPayload[pos] = (localDetailBongkar[pos] || []).map((r) => ({
                    id_detail_panen: r.id_detail_panen ?? null,
                    tanggal: r.tanggal || (r.id_detail_panen ? panenDateMap[r.id_detail_panen] : null),
                    berat_bongkar: r.berat_bongkar,
                    size: r.size,
                    kualitas: r.kualitas,
                    persen_molting: r.persen_molting,
                    harga: r.harga,
                    subtotal: r.subtotal,
                    spb_ids: r.spb_ids || [],
                    spb_alokasi: r.spb_alokasi || {},
                }));
            });

            const payload = {
                ...values,
                tanggal_bongkar: values.tanggal_bongkar ? dayjs(values.tanggal_bongkar).format('YYYY-MM-DD') : null,
                id: currentErp?.id,
                details: normalizedDetails,           // legacy mode
                localDetailBongkar: localForPayload,  // new mode (SPB)
            };

            if (onSubmit) onSubmit(payload);
        });
    };

    // ===== Derived =====
    const allPositions = useMemo(
        () =>
            Array.from(
                new Set([
                    ...Object.keys(itemsByPosition || {}),
                    ...(panenData?.detail ? panenData.detail.map((d) => d.posisi) : []),
                ])
            ).filter(Boolean),
        [itemsByPosition, panenData]
    );

    const getTotalsPanen = (posisi) =>
        (panenData?.detail || [])
            .filter((d) => d.posisi === posisi)
            .reduce((acc, curr) => acc + toNum(curr.berat), 0);

    const getTotalsBongkar = (posisi) =>
        (localDetailBongkar[posisi] || []).reduce((acc, d) => acc + toNum(d.berat_bongkar), 0);

    const calculateSubtotalPosisi = (posisi) =>
        (localDetailBongkar[posisi] || []).reduce((acc, d) => acc + toNum(d.subtotal), 0);

    const panenOptionsForCurrentPosisi = useMemo(() => {
        if (!currentPosisi || !panenData?.detail) return [];
        return (panenData.detail || []).filter((d) => d.posisi === currentPosisi);
    }, [currentPosisi, panenData]);

    return (
        <div style={{ padding: 10 }}>
            <Form form={form} layout="vertical">
                {/* Info master panen */}
                {panenData && (
                    <Card style={{ marginBottom: 16 }}>
                        <Row gutter={16} style={{ fontWeight: 'bold', marginBottom: 8 }}>
                            <Col span={6}><FileTextOutlined style={{ marginRight: 8 }} />{translate('Lokasi')}</Col>
                            <Col span={6}><FileTextOutlined style={{ marginRight: 8 }} />{translate('Staff')}</Col>
                            <Col span={6}><FileTextOutlined style={{ marginRight: 8 }} />{translate('Perusahaan')}</Col>
                            <Col span={6}><FileTextOutlined style={{ marginRight: 8 }} />{translate('No Polisi')}</Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={6}><Tag color="processing">{currentErp?.lokasi ?? panenData.lokasi}</Tag></Col>
                            <Col span={6}><Tag color="success">{currentErp?.staff ?? panenData.staff}</Tag></Col>
                            <Col span={6}><Tag color="blue">{currentErp?.nama_perusahaan ?? panenData.nama_perusahaan}</Tag></Col>
                            <Col span={6}><Tag color="purple">{currentErp?.nopol ?? panenData.nopol}</Tag></Col>
                        </Row>
                    </Card>
                )}

                {/* Pabrik / Tgl Bongkar / Pot / Subtotal */}
                <Card style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item
                                name="nama_pabrik"
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
                                    style={{ width: '100%' }}
                                    onChange={handlePotPercentageChange}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item
                                name="master_sub_total"
                                label={<span><DollarOutlined style={{ marginRight: 8 }} />{translate('Subtotal (Nota)')}</span>}
                            >
                                <InputNumber
                                    {...numberID}
                                    stringMode
                                    precision={2}
                                    step="0.01"
                                    min={0}
                                    disabled={subtotalDisabled}
                                    style={{ width: '100%' }}
                                    onChange={handleSubtotalChange}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* ===== Per posisi ===== */}
                <Row gutter={16}>
                    {panenData?.detail && [...new Set(panenData.detail.map(d => d.posisi))].map((posisi) => {
                        const details = localDetailBongkar[posisi] || [];
                        const panenDetails = panenData.detail.filter(d => d.posisi === posisi);
                        const totalSubtotal = calculateSubtotalPosisi(posisi);

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

                                        {/* Isi */}
                                        {panenDetails.length ? (
                                            panenDetails.map((detailPanen, panenIndex) => {
                                                const related = details.filter(d => d.id_detail_panen === detailPanen.id);

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
                                                            <div style={{ width: 100 }}>
                                                                {detailPanen.created_date ? dayjs(detailPanen.created_date).format(dateFormat) : '-'}
                                                            </div>
                                                            <div style={{ width: 80 }}>{detailPanen.berat ?? '-'}</div>
                                                            <div style={{ width: 80 }}>{detailPanen.size ?? '-'}</div>
                                                        </div>

                                                        {/* Deretan baris bongkar terkait */}
                                                        {related.length ? (
                                                            related.map((row, i) => {
                                                                const idx = (localDetailBongkar[posisi] || []).indexOf(row);

                                                                return (
                                                                    <div
                                                                        key={`b-${detailPanen.id}-${i}`}
                                                                        style={{
                                                                            display: 'flex',
                                                                            padding: '8px 0',
                                                                            alignItems: 'center',
                                                                            background: i % 2 === 0 ? '#f9f9f9' : '#fff'
                                                                        }}
                                                                    >
                                                                        {/* spacer kiri */}
                                                                        <div style={{ width: 260 }} />
                                                                        {/* kanan: input bongkar */}
                                                                        <div style={{ flex: 1 }}>
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
                                                                                        onChange={(v) => onChangeRow(posisi, idx, 'berat_bongkar', v)}
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
                                                                                        onChange={(v) => onChangeRow(posisi, idx, 'size', v)}
                                                                                    />
                                                                                </Col>
                                                                                <Col span={3}>
                                                                                    <Input
                                                                                        style={{ width: '100%' }}
                                                                                        value={row.kualitas}
                                                                                        onChange={(e) => onChangeRow(posisi, idx, 'kualitas', e.target.value)}
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
                                                                                        onChange={(v) => onChangeRow(posisi, idx, 'persen_molting', v)}
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
                                                                                        onChange={(v) => onChangeRow(posisi, idx, 'harga', v)}
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
                                                                                        onConfirm={() => removeRow(posisi, idx)}
                                                                                    >
                                                                                        <Button type="text" danger icon={<MinusCircleOutlined />} />
                                                                                    </Popconfirm>
                                                                                </Col>
                                                                            </Row>

                                                                            {/* === Relasi SPB per baris === */}
                                                                            <div style={{ marginTop: 8 }}>
                                                                                <div style={{ fontSize: 12, marginBottom: 6 }}>
                                                                                    <FileTextOutlined style={{ marginRight: 6 }} />
                                                                                    Nomor SPB (bisa pilih lebih dari satu)
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
                                                                                    onChange={(vals) => onChangeRow(posisi, idx, 'spb_ids', vals)}
                                                                                    style={{ width: '100%' }}
                                                                                />
                                                                                {(row.spb_ids || []).length > 1 && (
                                                                                    <div style={{ background: '#fff', border: '1px dashed #ddd', padding: 8, marginTop: 8, borderRadius: 6 }}>
                                                                                        <Text strong>Alokasi kuantitas per SPB</Text>
                                                                                        <Row gutter={8} style={{ marginTop: 8 }}>
                                                                                            {(row.spb_ids || []).map((sid) => {
                                                                                                const key = String(sid);
                                                                                                const alloc = row.spb_alokasi || {};
                                                                                                return (
                                                                                                    <Col xs={24} md={12} lg={8} key={key} style={{ marginBottom: 8 }}>
                                                                                                        <InputNumber
                                                                                                            {...numberID}
                                                                                                            stringMode
                                                                                                            precision={2}
                                                                                                            step="0.01"
                                                                                                            min={0}
                                                                                                            addonBefore={spbMap[key] || `SPB ${key}`}
                                                                                                            style={{ width: '100%' }}
                                                                                                            value={alloc[key]}
                                                                                                            onChange={(v) => {
                                                                                                                const next = { ...(row.spb_alokasi || {}) };
                                                                                                                next[key] = v;
                                                                                                                onChangeRow(posisi, idx, 'spb_alokasi', next);
                                                                                                            }}
                                                                                                        />
                                                                                                    </Col>
                                                                                                );
                                                                                            })}
                                                                                        </Row>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {/* === End SPB block === */}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div style={{ padding: '8px 0', color: '#999' }}>
                                                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={translate('Belum ada bongkar untuk panen ini')} />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={translate('Belum ada data panen di posisi ini')} />
                                        )}

                                        {/* Tombol Tambah Bongkar */}
                                        <Button
                                            type="dashed"
                                            onClick={() => openPanenModal(posisi)}
                                            icon={<PlusOutlined />}
                                            style={{ width: '100%', marginTop: 16 }}
                                        >
                                            {translate('Tambah Bongkar')}
                                        </Button>
                                    </div>

                                    <Divider />

                                    {/* Totals */}
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Text strong>
                                                <NumberOutlined style={{ marginRight: 8 }} />
                                                {translate('Total Panen')}: {formatNumber(getTotalsPanen(posisi))} Kg
                                            </Text>
                                        </Col>
                                        <Col span={12}>
                                            <Text strong>
                                                <NumberOutlined style={{ marginRight: 8 }} />
                                                {translate('Total Bongkar')}: {formatNumber(getTotalsBongkar(posisi))} Kg
                                            </Text>
                                        </Col>
                                    </Row>
                                    <Row style={{ marginTop: 8 }}>
                                        <Col span={24}>
                                            <Text strong>
                                                <DollarOutlined style={{ marginRight: 8 }} />
                                                {translate('Total Harga')}: {formatNumber(totalSubtotal)}
                                            </Text>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                {/* Simpan */}
                <Form.Item style={{ marginTop: 20 }}>
                    <Button type="primary" onClick={handleSubmit} icon={<CheckOutlined />} size="large">
                        {translate('Simpan')}
                    </Button>
                </Form.Item>

                {/* Modal pilih panen */}
                <Modal
                    title={<span><DatabaseOutlined style={{ marginRight: 8 }} />{translate('Pilih Data Panen')}</span>}
                    open={showPanenSelection}
                    onCancel={() => setShowPanenSelection(false)}
                    footer={null}
                    width={800}
                >
                    <Table
                        columns={panenColumns}
                        dataSource={panenOptionsForCurrentPosisi}
                        rowKey={(r) => r.id}
                        pagination={false}
                    />
                </Modal>
            </Form>
        </div>
    );
}
