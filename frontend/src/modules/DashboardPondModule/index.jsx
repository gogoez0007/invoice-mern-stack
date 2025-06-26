import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Col, Row, Typography, Tooltip, Select, Table } from 'antd';
import {
    InfoCircleOutlined,
    AreaChartOutlined,
    DotChartOutlined,
    LineChartOutlined,
    BarChartOutlined,
    FundOutlined,
} from '@ant-design/icons';
import { erp } from '@/redux/erp/actions';
import LinePondChart from './components/LinePondChart';

const { Text } = Typography;

export default function PondsIndex() {
    const dispatch = useDispatch();
    const [ponds, setPonds] = useState([]);
    const excludedKeys = ['id', 'pl_source', 'pond_area_m2', 'pond', 'stocking_date', 'created_date', 'modified_date'];

    const dataPonds = useSelector((state) => state.erp.ponds);

    useEffect(() => {
        setPonds(dataPonds?.result ?? [])
    }, [dataPonds])

    // Ambil opsi blok berdasarkan huruf pertama pond
    const blokOptions = useMemo(() => {
        const blokSet = new Set();
        ponds.forEach((item) => {
            if (item.pond && typeof item.pond === 'string') {
                const firstChar = item.pond.trim().charAt(0).toUpperCase();
                blokSet.add(firstChar);
            }
        });
        return Array.from(blokSet).sort();
    }, [ponds]);

    // Keys yang bisa dipilih untuk select kanan
    const dynamicKeys = useMemo(() => {
        if (!ponds.length) return [];
        const sampleItem = ponds[0];
        return Object.keys(sampleItem).filter((key) => !excludedKeys.includes(key));
    }, [ponds]);

    // Fetch data awal
    const fetchData = () => {
        dispatch(
            erp.ponds({
                entity: 'summary',
                options: {},
            })
        );
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Hitung agregasi berdasarkan blok yang dipilih atau semua data jika tidak ada blok yang dipilih
    const calculateAggregatedData = (blok) => {
        const filtered = blok
            ? ponds.filter(
                (item) => item.pond && item.pond.trim().charAt(0).toUpperCase() === blok
            )
            : ponds;

        if (filtered.length === 0) return null;

        const sum = (arr, key) => arr.reduce((acc, cur) => acc + (Number(cur[key]) || 0), 0);

        const avg = (arr, key) => {
            const total = sum(arr, key);
            return total / arr.length;
        };

        return {
            pond_area_m2: sum(filtered, 'pond_area_m2'),
            last_adg: avg(filtered, 'last_adg'),
            rata2_idx_sr: avg(filtered, 'rata2_idx_sr'),
            total_biomass_kg: sum(filtered, 'total_biomass_kg'),
            total_cc_kg_ha: sum(filtered, 'total_cc_kg_ha'),
        };
    };

    // Format number sesuai Indonesia
    const formatNumber = (value, decimalPlaces = 0) => {
        if (typeof value !== 'number' || isNaN(value)) return '-';
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        }).format(value);
    };

    // Mapping parameter ke ikon dan warna
    const paramIcons = {
        'Pond Area (m2)': <AreaChartOutlined style={{ color: '#1890ff', fontSize: 18 }} />,
        'Last ADG': <DotChartOutlined style={{ color: '#52c41a', fontSize: 18 }} />,
        'Rata2 IDX SR': <LineChartOutlined style={{ color: '#fa8c16', fontSize: 18 }} />,
        'Total Biomass (Kg)': <BarChartOutlined style={{ color: '#eb2f96', fontSize: 18 }} />,
        'Total CC (Kg/Ha)': <FundOutlined style={{ color: '#722ed1', fontSize: 18 }} />,
    };

    const generateTableData = (aggregatedData) => {
        return aggregatedData
            ? [
                { key: '1', label: 'Pond Area (m2)', value: formatNumber(aggregatedData.pond_area_m2, 0) },
                { key: '2', label: 'Last ADG', value: formatNumber(aggregatedData.last_adg, 2) },
                { key: '3', label: 'Rata2 IDX SR', value: formatNumber(aggregatedData.rata2_idx_sr, 2) },
                { key: '4', label: 'Total Biomass (Kg)', value: formatNumber(aggregatedData.total_biomass_kg, 2) },
                { key: '5', label: 'Total CC (Kg/Ha)', value: formatNumber(aggregatedData.total_cc_kg_ha, 2) },
            ]
            : [];
    };

    const columns = [
        {
            title: 'Summary',
            dataIndex: 'label',
            key: 'label',
            render: (text) => (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 12px',
                        backgroundColor: '#e6f7ff',
                        color: '#1890ff',
                        fontWeight: 600,
                        borderTopLeftRadius: 6,
                        borderBottomLeftRadius: 6,
                        minWidth: 180,
                    }}
                >
                    {paramIcons[text]} <span>{text}</span>
                </div>
            ),
        },
        {
            title: '',
            dataIndex: 'value',
            key: 'value',
            render: (value) => (
                <div
                    style={{
                        padding: '6px 12px',
                        backgroundColor: '#fff',
                        fontWeight: 700,
                        color: '#333',
                        borderTopRightRadius: 6,
                        borderBottomRightRadius: 6,
                        textAlign: 'right',
                        minWidth: 100,
                    }}
                >
                    {value}
                </div>
            ),
        },
    ];
    const [selectedKeys, setSelectedKeys] = useState({});
    useEffect(() => {
        if (dynamicKeys.length > 0 && Object.keys(selectedKeys).length === 0) {
            const defaultValue = dynamicKeys[0]; // value teratas
            const newSelectedKeys = blokOptions.reduce((acc, blok) => {
                acc[blok] = defaultValue;
                return acc;
            }, {});
            setSelectedKeys(newSelectedKeys);
        }
    }, [dynamicKeys, blokOptions, selectedKeys]);


    const handleKeyChange = (blok, value) => {
        setSelectedKeys(prevKeys => ({
            ...prevKeys,
            [blok]: value,
        }));
    };

    return (
        <>
            <Row gutter={[32, 32]}>
                {blokOptions.map((blok, index) => {
                    const aggregatedData = calculateAggregatedData(blok);
                    const tableData = generateTableData(aggregatedData);
                    const selectedKey = selectedKeys[blok];
                    const uniqueKey = `blok-${blok}-${index}`;

                    return (
                        <>
                            <Col key={uniqueKey} className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 8 }} lg={{ span: 8 }}>
                                <div
                                    className="whiteBox shadow pad20"
                                    style={{
                                        height: '100%',
                                        borderRadius: '16px',
                                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-start',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0 20px 20px',
                                        }}
                                    >
                                        <h3
                                            style={{
                                                color: '#22075e',
                                                margin: 0,
                                                paddingRight: 12,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            Blok {blok}{' '}
                                            <Tooltip title={`Summary blok ${blok}`}>
                                                <InfoCircleOutlined style={{ color: '#8c8c8c', marginLeft: 8 }} />
                                            </Tooltip>
                                        </h3>
                                    </div>

                                    {/* Tabel dua kolom dengan summary */}
                                    <div style={{ padding: '0 20px' }}>
                                        <Table
                                            columns={columns}
                                            dataSource={tableData}
                                            pagination={false}
                                            size="small"
                                            bordered={false}
                                            rowKey="key"
                                            style={{ marginTop: 12 }}
                                        />
                                    </div>
                                </div>
                            </Col>

                            <Col key={`blok-${uniqueKey}-right`} className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 16 }} lg={{ span: 16 }}>
                                <div
                                    className="whiteBox shadow pad20"
                                    style={{
                                        height: '100%',
                                        borderRadius: '16px',
                                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-start',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0 20px 20px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span>Menampilkan data untuk</span>
                                            <Select
                                                placeholder="Pilih data berdasarkan"
                                                style={{ width: 180 }}
                                                onChange={(value) => handleKeyChange(blok, value)}
                                                allowClear
                                                value={selectedKey}
                                                options={dynamicKeys.map((key) => ({
                                                    value: key,
                                                    label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                                                }))}
                                            />
                                        </div>
                                    </div>


                                    {/* Content chart atau lainnya di bawah */}
                                    <div style={{ padding: '0 20px', marginTop: 16 }}>
                                        <LinePondChart
                                            data={ponds}
                                            selectedKey={selectedKey}
                                            selectedBlok={blok} // Tampilkan chart untuk blok ini
                                        />
                                    </div>
                                </div>
                            </Col>
                        </>
                    );
                })}
            </Row>
        </>
    );
}