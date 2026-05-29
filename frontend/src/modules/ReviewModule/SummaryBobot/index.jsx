import React, { useEffect, useState } from 'react';
import {
    Select,
    InputNumber,
    Button,
    Card,
    Typography,
    Spin,
    Empty,
    Table,
    Tag,
    Tooltip,
    Radio,
    Row, Col
} from 'antd';
import { ReloadOutlined, SmileOutlined, MehOutlined, FrownOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Text } = Typography;

const groupByOptions = [
    { value: 'byTambak', label: 'Tambak' },
    { value: 'byPanen', label: 'Panen' },
    { value: 'byNopol', label: 'Nopol' },
    { value: 'byPabrik', label: 'Pabrik' },
];

const renderTags = (value) => {
    const items = (value || '').split(',').map(t => t.trim()).filter(Boolean);
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map((item, i) => (
                <Tooltip key={i}>
                    <Tag
                        color="green"
                        style={{
                            cursor: 'pointer',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontWeight: 500,
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={e => (e.target.style.transform = 'scale(1.1)')}
                        onMouseLeave={e => (e.target.style.transform = 'scale(1)')}
                    >
                        {item}
                    </Tag>
                </Tooltip>
            ))}
        </div>
    );
};

const ExpandableCell = ({ value }) => {
    const items = (value || '').split(',').map(t => t.trim()).filter(Boolean);
    const [expanded, setExpanded] = useState(false);

    if (items.length === 0) return <span>-</span>;

    const visibleItems = expanded ? items : items.slice(0, 1);
    const hiddenCount = items.length - visibleItems.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {visibleItems.map((item, i) => (
                    <Tag key={i} color="blue" style={{ cursor: 'pointer' }}>
                        {item}
                    </Tag>
                ))}
            </div>
            {items.length > 1 && (
                <a
                    onClick={() => setExpanded(!expanded)}
                    style={{ fontSize: 12, marginTop: 4, alignSelf: 'flex-start', color: '#1890ff' }}
                >
                    {expanded ? 'Tutup' : `[+${hiddenCount} lagi]`}
                </a>
            )}
        </div>
    );
};

const BongkarReport = () => {
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [groupBy, setGroupBy] = useState('byTambak');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [activeColumns, setActiveColumns] = useState([]);
    const [pageSize, setPageSize] = useState(10); // <-- Tambahan

    const baseColumns = [
        {
            title: 'Plat Nomor',
            dataIndex: 'nopol',
            key: 'nopol',
            width: 150, // default width for larger screens
            responsive: ['md'], // for screens >= 768px
        },
        {
            title: 'Tanggal Panen',
            dataIndex: 'tanggal_panen',
            key: 'tanggal_panen',
            render: (text) => <ExpandableCell value={text} />,
        },
        {
            title: 'Tanggal Bongkar',
            dataIndex: 'tanggal_bongkar',
            key: 'tanggal_bongkar',
            render: (text) => <ExpandableCell value={text} />,
        },
        {
            title: 'Pabrik',
            dataIndex: 'nama_pabrik',
            key: 'nama_pabrik',
            render: (text) => renderTags(text),
        },
        {
            title: 'Tambak',
            dataIndex: 'tambak',
            key: 'tambak',
            render: (text) => renderTags(text),
        },
        {
            title: 'Staff Panen',
            dataIndex: 'staff',
            key: 'staff',
            render: (text) => renderTags(text),
        },
        {
            title: 'Berat Panen (kg)',
            dataIndex: 'total_berat_panen',
            key: 'total_berat_panen',
            render: (value) => {
                // Menggunakan Intl.NumberFormat untuk format angka dengan ribuan dan desimal
                if (value) {
                    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
                }
                return '-';
            },
        },
        {
            title: 'Berat Bongkar (kg)',
            dataIndex: 'total_berat_bongkar',
            key: 'total_berat_bongkar',
            render: (value) => {
                // Format angka dengan ribuan dan desimal
                if (value) {
                    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
                }
                return '-';
            },
        },
        {
            title: 'Randeman (%)',
            dataIndex: 'selisih_persen',
            key: 'selisih_persen',
            render: (value) => {
                // Cek apakah value valid dan bisa diproses
                const validValue = parseFloat(value);

                // Jika value bukan angka atau NaN, kembalikan tanda hubung
                if (isNaN(validValue)) {
                    return <span>-</span>;
                }

                let color = '';
                let icon = <FrownOutlined style={{ color: 'red' }} />; // Default red (below 5%)

                // Menentukan warna dan icon berdasarkan nilai
                if (validValue < 5) {
                    color = 'red';
                    icon = <FrownOutlined style={{ color: 'red' }} />;
                } else if (validValue >= 5 && validValue <= 10) {
                    color = 'orange';
                    icon = <MehOutlined style={{ color: 'orange' }} />;
                } else if (validValue > 10) {
                    color = 'green';
                    icon = <SmileOutlined style={{ color: 'green' }} />;
                }

                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Tag
                            color={color}
                            style={{
                                fontWeight: 600,
                                cursor: 'pointer',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '18px',  // Membesarkan ukuran font
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <span style={{ marginRight: 8 }}>
                                {validValue.toFixed(2)}%
                            </span>
                            {icon}
                        </Tag>
                    </div>
                );
            },
        }

    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = filterType === 'all' ? { groupBy } : { month, year, groupBy };
            const res = await axios.get('http://123.255.202.38:5000/api/review/summary', { params });
            setData(res.data.data || []);

            const filteredColumns =
                (groupBy === 'byNopol' || groupBy === 'byPanen')
                    ? baseColumns
                    : baseColumns.filter(col => col.dataIndex !== 'nopol');

            setActiveColumns(filteredColumns);
        } catch (err) {
            console.error('Gagal ambil data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
            <Card title="Filter Data" variant="outlined" style={{ marginBottom: 24, borderRadius: '10px' }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Radio.Group
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            optionType="button"
                            style={{
                                display: 'inline-flex',
                                overflow: 'hidden',
                                borderRadius: 20,
                            }}
                        >
                            <Radio.Button value="all" style={{ borderRadius: '20px 0 0 20px' }}>Semua Data</Radio.Button>
                            <Radio.Button value="specific" style={{ borderRadius: '0 20px 20px 0' }}>Bulan & Tahun</Radio.Button>
                        </Radio.Group>
                    </Col>

                    {filterType === 'specific' && (
                        <>
                            <Col flex="none">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Text strong style={{ minWidth: 50, marginRight: 4 }}>Bulan</Text>
                                    <Select
                                        value={month}
                                        onChange={setMonth}
                                        placeholder="Pilih bulan"
                                        style={{ width: 140 }}
                                    >
                                        {[
                                            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                                            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                                        ].map((name, index) => {
                                            const m = (index + 1).toString().padStart(2, '0');
                                            return <Option key={m} value={m}>{name}</Option>;
                                        })}
                                    </Select>
                                </div>
                            </Col>

                            <Col flex="none">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Text strong style={{ minWidth: 50, marginRight: 4 }}>Tahun</Text>
                                    <InputNumber
                                        value={year}
                                        onChange={setYear}
                                        placeholder="Tahun"
                                        min={2024}
                                        max={new Date().getFullYear()}
                                        style={{ width: 140 }}
                                    />
                                </div>
                            </Col>
                        </>
                    )}

                    <Col flex="none">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Text strong style={{ minWidth: 50, marginRight: 8 }}>Kategori</Text>
                            <Select
                                value={groupBy}
                                onChange={setGroupBy}
                                placeholder="Group data"
                                style={{ width: 140 }}
                            >
                                {groupByOptions.map((opt) => (
                                    <Option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: 30 }}>
                    <Col flex="none">
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={fetchData}
                            style={{
                                borderRadius: 8,
                                fontWeight: 600,
                            }}
                        >
                            Tampilkan Data
                        </Button>
                    </Col>
                </Row>

            </Card>


            <Card style={{ borderRadius: 12, background: '#f9f9f9' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin size="large" />
                    </div>
                ) : data.length === 0 ? (
                    <Empty description="Tidak ada data." />
                ) : (
                    <Table
                        dataSource={data}
                        columns={activeColumns}
                        rowKey={(record, index) => record.id || `temp-id-${index}`}
                        pagination={{
                            pageSize,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            onShowSizeChange: (current, size) => setPageSize(size),
                        }}
                    />
                )}
            </Card>
        </div>
    );
};

export default BongkarReport;
