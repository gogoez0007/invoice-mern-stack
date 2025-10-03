// src/modules/spb/SPBAnalytics.jsx
import React, { useMemo, useState } from 'react';
import {
    Card, Row, Col, DatePicker, Input, Button, Table, Space, Typography,
    message, Tabs, Tag, Empty, Descriptions, Divider
} from 'antd';
import {
    ArrowLeftOutlined, BarChartOutlined, FileExcelOutlined,
    FilterOutlined, ReloadOutlined, FileTextOutlined, CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const nf = new Intl.NumberFormat('id-ID');
const fmtInt = (v) => nf.format(Number(v || 0));

function includeToken() {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.withCredentials = true;
    const auth = storePersist.get('auth');
    if (auth?.current?.token) axios.defaults.headers.common['Authorization'] = `Bearer ${auth.current.token}`;
    else delete axios.defaults.headers.common['Authorization'];
}

export default function SPBAnalytics() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({ nama_pabrik: '', range: [] });
    const [loading, setLoading] = useState(false);
    const [summaryRows, setSummaryRows] = useState([]);        // Summary Kontrak (qty-only)
    const [detailBySpb, setDetailBySpb] = useState({});        // { no_spb: [{ tanggal, items:[], subtotal:{} }, ...] }

    // ===== Summary Columns (qty saja) =====
    const summaryCols = useMemo(() => ([
        { title: 'No SPB', dataIndex: 'no_spb' },
        { title: 'Perusahaan', dataIndex: 'perusahaan' },
        {
            title: 'Tanggal Kontrak',
            render: (_, r) => `${r.tanggal_awal || '-'} — ${r.tanggal_akhir || '-'}`
        },
        {
            title: 'Qty Kontrak',
            dataIndex: 'kontrak_qty',
            align: 'right',
            render: (v) => fmtInt(v)
        },
        {
            title: 'Qty Realisasi (filter)',
            dataIndex: 'realized_qty',
            align: 'right',
            render: (v) => fmtInt(v)
        },
        {
            title: 'Terpenuhi',
            dataIndex: 'terpenuhi_qty',
            align: 'right',
            render: (v) => fmtInt(v)
        },
        {
            title: 'Over/Short',
            dataIndex: 'over_short_qty',
            align: 'right',
            render: (v) => {
                const n = Number(v || 0);
                const txt = fmtInt(Math.abs(n));
                if (n === 0) return <Tag color="default">0</Tag>;
                return n > 0
                    ? <Tag color="green">Over {txt}</Tag>
                    : <Tag color="red">Short {txt}</Tag>;
            }
        }
    ]), []);

    // ===== Detail Columns (baris item dalam grup tanggal) =====
    const detailCols = useMemo(() => ([
        { title: 'No SPB', dataIndex: 'no_spb' },
        { title: 'Tanggal Bongkar', dataIndex: 'tanggal_bongkar' },
        { title: 'Pabrik', dataIndex: 'nama_pabrik' },
        { title: 'Size', dataIndex: 'size', align: 'right', render: (v) => fmtInt(v) },
        { title: 'Berat Bongkar', dataIndex: 'berat_bongkar', align: 'right', render: (v) => fmtInt(v) },
        { title: 'Dialokasikan ke SPB ini', dataIndex: 'alokasi_ke_spb_ini', align: 'right', render: (v) => fmtInt(v) },
        { title: 'Sisa Belum Teralokasi', dataIndex: 'sisa_belum_teralokasi', align: 'right', render: (v) => fmtInt(v) },
    ]), []);

    // ===== Fetch =====
    const handleFetch = async () => {
        try {
            setLoading(true);
            includeToken();
            const params = {};
            if (filters.nama_pabrik) params.nama_pabrik = filters.nama_pabrik;
            if (filters.range?.length === 2) {
                params.from = dayjs(filters.range[0]).format('YYYY-MM-DD');
                params.to = dayjs(filters.range[1]).format('YYYY-MM-DD');
            }
            const { data } = await axios.get('spb/analytics', { params });

            if (!data?.success) throw new Error(data?.message || 'Gagal ambil data');

            // Summary aman
            const summary = Array.isArray(data.summary) ? data.summary : [];

            // detailsBySpb: { [no_spb]: [{ tanggal, items:[], subtotal:{} }, ...] }
            const rawBySpb = (data.detailsBySpb && typeof data.detailsBySpb === 'object') ? data.detailsBySpb : {};
            const normalizedBySpb = {};

            Object.keys(rawBySpb).forEach((noSpb) => {
                const groups = Array.isArray(rawBySpb[noSpb]) ? rawBySpb[noSpb] : [];
                normalizedBySpb[noSpb] = groups.map((g, gi) => ({
                    tanggal: g?.tanggal || '',
                    subtotal: {
                        alokasi_ke_spb_ini: Number(g?.subtotal?.alokasi_ke_spb_ini || 0),
                        berat_bongkar: Number(g?.subtotal?.berat_bongkar || 0),
                    },
                    items: Array.isArray(g?.items) ? g.items.map((r, i) => ({
                        key: `${noSpb}-${gi}-${i}`,
                        no_spb: r.no_spb || noSpb,
                        tanggal_bongkar: r.tanggal_bongkar || g?.tanggal || '',
                        nama_pabrik: r.nama_pabrik || '',
                        size: Number(r.size || 0),
                        berat_bongkar: Number(r.berat_bongkar || 0),
                        alokasi_ke_spb_ini: Number(r.alokasi_ke_spb_ini || 0),
                        sisa_belum_teralokasi: Number(r.sisa_belum_teralokasi || 0),
                    })) : []
                }));
            });

            setSummaryRows(summary);
            setDetailBySpb(normalizedBySpb);
        } catch (e) {
            console.error(e);
            message.error('Gagal memuat analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFilters({ nama_pabrik: '', range: [] });
        setSummaryRows([]);
        setDetailBySpb({});
    };

    // ===== Export Excel (Summary + Sheet per SPB, grouped per tanggal) =====
    const exportExcel = () => {
        if (!summaryRows.length) {
            message.warning('Tidak ada data untuk diexport');
            return;
        }
        const wb = XLSX.utils.book_new();

        // Sheet 1: Summary
        const summaryData = [
            ['No SPB', 'Perusahaan', 'Tanggal Kontrak', 'Qty Kontrak', 'Qty Realisasi (filter)', 'Terpenuhi', 'Over/Short'],
            ...summaryRows.map(r => ([
                r.no_spb,
                r.perusahaan,
                `${r.tanggal_awal || ''} — ${r.tanggal_akhir || ''}`,
                Number(r.kontrak_qty || 0),
                Number(r.realized_qty || 0),
                Number(r.terpenuhi_qty || 0),
                Number(r.over_short_qty || 0),
            ]))
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // Sheet per SPB, isi per tanggal (dengan subtotal)
        Object.entries(detailBySpb).forEach(([noSpb, groups]) => {
            if (!Array.isArray(groups) || groups.length === 0) return;

            const aoa = [];
            groups.forEach((g, idx) => {
                // Header tanggal + subtotal ringkas
                aoa.push([`Tanggal: ${g.tanggal}`, '', '', '', 'Subtotal Berat Bongkar', Number(g.subtotal?.berat_bongkar || 0)]);
                aoa.push(['No SPB', 'Tanggal Bongkar', 'Pabrik', 'Size', 'Berat Bongkar', 'Dialokasikan ke SPB ini', 'Sisa Belum Teralokasi']);
                (g.items || []).forEach((r) => {
                    aoa.push([
                        r.no_spb,
                        r.tanggal_bongkar || '',
                        r.nama_pabrik || '',
                        Number(r.size || 0),
                        Number(r.berat_bongkar || 0),
                        Number(r.alokasi_ke_spb_ini || 0),
                        Number(r.sisa_belum_teralokasi || 0),
                    ]);
                });
                // Subtotal baris
                aoa.push(['', '', '', '', 'Subtotal Alokasi', Number(g.subtotal?.alokasi_ke_spb_ini || 0)]);
                if (idx !== groups.length - 1) aoa.push([]); // spasi antar tanggal
            });

            const safeTitle = String(noSpb || 'SPB').substring(0, 31).replace(/[\\/?*[\]:]/g, ' ');
            const ws = XLSX.utils.aoa_to_sheet(aoa);
            XLSX.utils.book_append_sheet(wb, ws, safeTitle || 'Detail SPB');
        });

        XLSX.writeFile(wb, `SPB_Analytics_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
    };

    // ===== Tabs Detail Per SPB (tiap tab dipecah per tanggal) =====
    const spbTabs = useMemo(() => {
        const spbKeys = Object.keys(detailBySpb || {});
        if (!spbKeys.length) return null;

        return (
            <Tabs
                items={spbKeys.map((noSpb) => {
                    const groups = detailBySpb[noSpb] || [];
                    const totalBaris = groups.reduce((acc, g) => acc + (g.items?.length || 0), 0);
                    const totalAlokasi = groups.reduce((acc, g) => acc + Number(g.subtotal?.alokasi_ke_spb_ini || 0), 0);
                    const totalBerat = groups.reduce((acc, g) => acc + Number(g.subtotal?.berat_bongkar || 0), 0);

                    return {
                        key: noSpb || 'SPB',
                        label: (
                            <Space>
                                <FileTextOutlined />
                                <span style={{ fontWeight: 600 }}>{noSpb || 'SPB'}</span>
                                <Tag color="blue">{totalBaris} baris</Tag>
                            </Space>
                        ),
                        children: (
                            <>
                                <Descriptions size="small" column={3} style={{ marginBottom: 8 }}>
                                    <Descriptions.Item label="Total Alokasi">{fmtInt(totalAlokasi)}</Descriptions.Item>
                                    <Descriptions.Item label="Total Berat Bongkar">{fmtInt(totalBerat)}</Descriptions.Item>
                                    <Descriptions.Item label="Jumlah Tanggal">{groups.length}</Descriptions.Item>
                                </Descriptions>
                                {groups.length ? groups.map((g, idx) => (
                                    <Card
                                        key={`${noSpb}-${g.tanggal}-${idx}`}
                                        size="small"
                                        style={{ marginBottom: 12, borderTop: '3px solid #722ed1' }}
                                        title={
                                            <Space>
                                                <CalendarOutlined style={{ color: '#722ed1' }} />
                                                <span style={{ color: '#722ed1', fontWeight: 600 }}>
                                                    Tanggal: {g.tanggal || '-'}
                                                </span>
                                                <Tag>Subtotal Alokasi: {fmtInt(g.subtotal?.alokasi_ke_spb_ini || 0)}</Tag>
                                                <Tag>Subtotal Berat: {fmtInt(g.subtotal?.berat_bongkar || 0)}</Tag>
                                            </Space>
                                        }
                                    >
                                        <Table
                                            rowKey={(r) => r.key}
                                            dataSource={g.items || []}
                                            columns={detailCols}
                                            size="middle"
                                            pagination={{ pageSize: 20 }}
                                        />
                                    </Card>
                                )) : (
                                    <Empty
                                        description="Tidak ada detail untuk SPB ini pada filter"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </>
                        )
                    };
                })}
            />
        );
    }, [detailBySpb, detailCols]);

    return (
        <>
            {/* Header / Filter */}
            <Card
                style={{ marginBottom: 16, borderTop: '4px solid #1677ff' }}
                title={
                    <Space wrap>
                        <BarChartOutlined style={{ color: '#1677ff' }} />
                        <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
                            Analitik Kontrak (SPB) vs Realisasi
                        </Title>
                    </Space>
                }
                extra={
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                        Kembali
                    </Button>
                }
            >
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} md={8}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                            <FileTextOutlined /> Nama Pabrik
                        </div>
                        <Input
                            placeholder="Filter pabrik (opsional)"
                            value={filters.nama_pabrik}
                            onChange={(e) => setFilters({ ...filters, nama_pabrik: e.target.value })}
                            allowClear
                        />
                    </Col>

                    <Col xs={24} md={10}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                            <CalendarOutlined /> Tanggal Bongkar (Range)
                        </div>
                        <RangePicker
                            style={{ width: '100%' }}
                            value={filters.range}
                            onChange={(v) => setFilters({ ...filters, range: v || [] })}
                            allowClear
                        />
                    </Col>

                    <Col xs={24} md={6}>
                        <Space wrap style={{ width: '100%', justifyContent: 'flex-start' }}>
                            <Button type="primary" icon={<FilterOutlined />} onClick={handleFetch} loading={loading}>
                                Terapkan Filter
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={handleReset}>
                                Reset
                            </Button>
                            <Button icon={<FileExcelOutlined />} onClick={exportExcel} disabled={!summaryRows.length}>
                                Export Excel
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>


            {/* Summary */}
            <Card
                style={{ borderTop: '3px solid #13c2c2', marginBottom: 16 }}
                title={<span style={{ color: '#13c2c2', fontWeight: 600 }}>Summary Semua Kontrak</span>}
            >
                <Table
                    rowKey={(r) => `${r.spb_id}`}
                    dataSource={summaryRows}
                    loading={loading}
                    pagination={{ pageSize: 20 }}
                    columns={summaryCols}
                    size="middle"
                />
            </Card>

            {/* Detail Per Nomor SPB (Tabs) */}
            <Card
                style={{ borderTop: '3px solid #722ed1' }}
                title={<span style={{ color: '#722ed1', fontWeight: 600 }}>Detail Kontrak vs Bongkar (Per Nomor SPB)</span>}
            >
                {Object.keys(detailBySpb || {}).length
                    ? spbTabs
                    : (
                        <Empty
                            description="Tidak ada detail pada filter saat ini"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )
                }
            </Card>
        </>
    );
}
