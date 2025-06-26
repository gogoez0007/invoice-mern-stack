import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Col, Row, Typography, Radio, Select, InputNumber, Button, Table, Tooltip } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import RecentTable from './components/RecentTable';
import LineProductivityChart from './components/LineProductivityChart';
import PieProductivityChart from './components/ProductivityPieChartt';
import { erp } from '@/redux/erp/actions'; import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';
import * as XLSX from 'xlsx';
const { Text } = Typography;
const { Option } = Select;

const tableTypes = [
    { key: 'topFrekuensi', title: 'Top 5 Frekuensi Tertinggi' },
    { key: 'lowFrekuensi', title: 'Top 5 Frekuensi Terendah' },
    { key: 'topVolume', title: 'Top 5 Volume Tertinggi' },
    { key: 'lowVolume', title: 'Top 5 Volume Terendah' },
];

function includeToken() {
    axios.defaults.baseURL = API_BASE_URL;

    axios.defaults.withCredentials = true;
    const auth = storePersist.get('auth');

    if (auth) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${auth.current.token}`;
    }
}

export default function ProductivityIndex() {
    const dispatch = useDispatch();
    const [filterType, setFilterType] = useState('all');
    const [month, setMonth] = useState(null);
    const [year, setYear] = useState(null);
    const productivity = useSelector((state) => state.erp.productivity);
    const result = (productivity?.result ?? []).filter(
        item => item.status_kendaraan === "Delmar Group"
    );
    const period = productivity?.period ?? '';
    const isLoading = productivity?.isLoading;
    const [idleTruckData, setIdleTruckData] = useState([]);
    const [isLoadingIdle, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    console.log({ productivity })
    const exportToExcel = (columns, dataSource, fileName = 'Exported_Data') => {
        // Ambil hanya kolom yang memiliki dataIndex
        const exportableColumns = columns.filter((col) => col.dataIndex);

        // Buat data akhir untuk export
        const exportData = dataSource.map((item, index) => {
            const row = {};
            exportableColumns.forEach((col) => {
                const value = item[col.dataIndex];

                // Format number jika kolom punya render number
                if (typeof col.render === 'function') {
                    row[col.title] = col.render(value, item, index);
                } else {
                    row[col.title] = value;
                }
            });
            return row;
        });

        // Buat worksheet dan workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet['!cols'] = exportableColumns.map(() => ({ wch: 20 })); // set lebar kolom

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

        // Ekspor tanpa file-saver
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const fetchData = () => {
        const options = {};

        if (filterType === 'specific' && month && year) {
            options.bulan = month;
            options.tahun = year;

            dispatch(erp.productivity({
                entity: "summary",
                jsonData: options,
            }));
        } else {
            dispatch(erp.productivity({
                entity: "summary",
                options,
            }));
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const fetchIdleTruck = async () => {
            setIsLoading(true);
            try {
                includeToken()
                const response = await axios.get('/summary/summary_idle'); // ganti URL sesuai endpoint-mu
                const data = await response.data;
                setIdleTruckData(data.result);
            } catch (error) {
                console.error('Error fetching idle trucks:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchIdleTruck();
    }, []);

    const dataTableColumns = [
        { title: 'Plat No', dataIndex: 'nopol', key: 'nopol' },
        { title: 'Frekuensi', dataIndex: 'frekuensi', key: 'frekuensi' },
        { title: 'Status Truk', dataIndex: 'status_kendaraan', key: 'status_kendaraan' },
        {
            title: 'Volume Panen (kg)',
            dataIndex: 'volume_panen',
            key: 'volume_panen',
            render: (value) => new Intl.NumberFormat('id-ID').format(Number(value) || 0),
        },
        {
            title: 'Volume Bongkar (kg)',
            dataIndex: 'volume_bongkar',
            key: 'volume_bongkar',
            render: (value) => new Intl.NumberFormat('id-ID').format(Number(value) || 0),
        },
    ];

    const dataIdleColumns = [
        {
            title: 'No',
            key: 'index',
            render: (text, record, index) =>
                (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        { title: 'Plat No', dataIndex: 'nopol', key: 'nopol' },
        { title: 'Nama Driver', dataIndex: 'nama_driver', key: 'nama_driver' },
    ];

    return (
        <>
            <Card title="Filter Data" variant="outlined" style={{ marginBottom: 24, borderRadius: '10px' }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Radio.Group
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            optionType="button"
                            style={{ display: 'inline-flex', overflow: 'hidden', borderRadius: 20 }}
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
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={fetchData}
                            style={{ borderRadius: 8, fontWeight: 600 }}
                        >
                            Tampilkan Data
                        </Button>
                    </Col>
                </Row>
            </Card>
            <Row gutter={[32, 32]}>
                <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 12 }}>
                    <div
                        className="whiteBox shadow pad20"
                        style={{
                            height: '100%',
                            borderRadius: '16px',
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '0 20px 10px' }}>
                            <h3 style={{ color: '#22075e', marginBottom: 0 }}>
                                Frekuensi Truk{' '}
                                <Tooltip title="Informasi mengenai frekuensi truk">
                                    <InfoCircleOutlined style={{ color: '#8c8c8c', marginLeft: 8 }} />
                                </Tooltip>
                            </h3>
                        </div>

                        {/* Chart */}
                        <div style={{ flexGrow: 1 }}>
                            <PieProductivityChart type="frekuensi" />
                        </div>

                        {/* Period di bawah blok, rata kanan */}
                        <div style={{ padding: '10px 20px 0', textAlign: 'right' }}>
                            <Text type="secondary">{period}</Text>
                        </div>
                    </div>
                </Col>
                <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 12 }}>
                    <div
                        className="whiteBox shadow pad20"
                        style={{ height: '100%', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}
                    >
                        <h3 style={{ color: '#22075e', marginBottom: 5, padding: '0 20px 20px' }}>
                            Volume Muatan Truk{' '}
                            <Tooltip title="Informasi mengenai volume muat">
                                <InfoCircleOutlined style={{ color: '#8c8c8c', marginLeft: 8 }} />
                            </Tooltip>
                        </h3>
                        <PieProductivityChart
                            type='volume'
                        />
                        <div style={{ padding: '10px 20px 0', textAlign: 'right' }}>
                            <Text type="secondary">{period}</Text>
                        </div>
                    </div>
                </Col>
                {/* <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 12 }}>
                    <div
                        className="whiteBox shadow pad20"
                        style={{ height: '100%', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}
                    >
                        <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ color: '#22075e', margin: 0 }}>
                                Daftar Truk Idle (Delmar Group)
                            </h3>
                            <Button type="primary" onClick={() => exportToExcel(dataIdleColumns, idleTruckData, 'Daftar_Truk_Idle')}>
                                Export ke Excel
                            </Button>
                        </div>
                        <Table
                            columns={dataIdleColumns}
                            rowKey={(item) => item.id || item.key || JSON.stringify(item)}
                            dataSource={idleTruckData}
                            pagination={{
                                current: pagination.current,
                                pageSize: pagination.pageSize,
                                onChange: (page, pageSize) => {
                                    setPagination({ current: page, pageSize });
                                },
                            }}
                            loading={isLoading}
                            scroll={{ x: true }}
                        />
                    </div>
                </Col> */}
            </Row>
            <div className="space30"></div>
            <Row gutter={[32, 32]}>
            </Row>
            <div className="space30"></div>
            <Row gutter={[32, 32]}>
                <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }}>

                    <div
                        className="whiteBox shadow pad20"
                        style={{ height: '100%', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}
                    >
                        <h3 style={{ color: '#22075e', marginBottom: 5, padding: '0 20px 20px' }}>
                            Frekuensi{' '}
                            <Tooltip title="Chart mengenai frekuensi truk">
                                <InfoCircleOutlined style={{ color: '#8c8c8c', marginLeft: 8 }} />
                            </Tooltip>
                        </h3>
                        <LineProductivityChart types={"single"} />
                        <div style={{ padding: '10px 20px 0', textAlign: 'right' }}>
                            <Text type="secondary">{period}</Text>
                        </div>
                    </div>
                </Col>
            </Row>
            <div className="space30"></div>
            <Row gutter={[32, 32]}>
                <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }}>

                    <div
                        className="whiteBox shadow pad20"
                        style={{ height: '100%', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}
                    >
                        <h3 style={{ color: '#22075e', marginBottom: 5, padding: '0 20px 20px' }}>
                            Volume{' '}
                            <Tooltip title="Chart volume truk">
                                <InfoCircleOutlined style={{ color: '#8c8c8c', marginLeft: 8 }} />
                            </Tooltip>
                        </h3>
                        <LineProductivityChart types={"dual"} />
                        <div style={{ padding: '10px 20px 0', textAlign: 'right' }}>
                            <Text type="secondary">{period}</Text>
                        </div>
                    </div>
                </Col>
            </Row>
            <div className="space30"></div>

            <Row gutter={[32, 32]}>
                {tableTypes.map((item) => (
                    <Col
                        key={item.key}
                        className="gutter-row w-full"
                        sm={{ span: 24 }}
                        lg={{ span: 12 }}
                    >
                        <div
                            className="whiteBox shadow pad20"
                            style={{ height: '100%', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}
                        >
                            <h3 style={{ color: '#22075e', marginBottom: 5, padding: '0 20px 20px' }}>
                                {item.title}{' '}
                                <Tooltip title={`Informasi: ${item.title}`}>
                                    <InfoCircleOutlined style={{ color: '#8c8c8c', marginLeft: 8 }} />
                                </Tooltip>
                            </h3>

                            <RecentTable
                                dataTableColumns={dataTableColumns}
                                types={item.key}
                            />
                            <div style={{ padding: '10px 20px 0', textAlign: 'right' }}>
                                <Text type="secondary">{period}</Text>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
            <div className="space30"></div>
            <Row gutter={[32, 32]}>
                <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }}>

                    <div
                        className="whiteBox shadow pad20"
                        style={{ height: '100%', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}
                    >
                        <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ color: '#22075e', marginBottom: 5, padding: '0 20px 20px' }}>
                                Daftar Lengkap Frekuensi Muat Truk{' '}
                                <Tooltip title={`Informasi Daftar Lengkap Frekuensi Muat Tru`}>
                                    <InfoCircleOutlined style={{ color: '#8c8c8c', marginLeft: 8 }} />
                                </Tooltip>
                            </h3>
                            <Button type="primary" onClick={() => exportToExcel(dataTableColumns, result, 'Daftar Frekuensi Truk')}>
                                Export ke Excel
                            </Button>
                        </div>
                        <Table
                            columns={dataTableColumns}
                            rowKey={(item) => item.id || item.key || JSON.stringify(item)}
                            dataSource={result}
                            pagination={true}
                            loading={isLoading}
                            scroll={{ x: true }}
                        />
                        <div style={{ padding: '10px 20px 0', textAlign: 'right' }}>
                            <Text type="secondary">{period}</Text>
                        </div>
                    </div>
                </Col>
            </Row>
        </>
    );
}