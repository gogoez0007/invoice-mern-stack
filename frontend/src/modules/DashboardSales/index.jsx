import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Typography, Card, Divider, Spin, message, DatePicker } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs'; // Gunakan dayjs (standar AntD terbaru)
import {
    UserOutlined,
    EnvironmentOutlined,
    CheckCircleOutlined,
    RiseOutlined,
} from '@ant-design/icons';


import SummaryCard from './components/SummaryCard';
import LineChart from './components/LineChart';
import PieChart from './components/PieChart';
import RecentVisitsTable from './components/RecentVisitsTable';
import TopPerformersCard from './components/TopPerformersCard';


const { Header, Content } = Layout;
const { Title, Text } = Typography;

const iconMap = {
    EnvironmentOutlined,
    CheckCircleOutlined,
    UserOutlined,
    RiseOutlined,
};

function App() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    // State untuk filter tanggal (Default bulan ini)
    const [selectedDate, setSelectedDate] = useState(dayjs());

    useEffect(() => {
        fetchDashboardData();
    }, [selectedDate]); // Re-fetch data saat tanggal berubah

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Ambil bulan (1-12) dan tahun
            const month = selectedDate.month() + 1;
            const year = selectedDate.year();

            const response = await axios.get(`http://123.255.202.38:5000/api/visit/dashboard`, {
                params: { month, year }
            });
            setData(response.data.data);
        } catch (err) {
            message.error("Gagal memuat data dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (date) => {
        if (date) setSelectedDate(date);
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 'auto', paddingBottom: 16, paddingTop: 16 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        <RiseOutlined style={{ marginRight: 8 }} />
                        Sales Visit Dashboard
                    </Title>
                    <Text type="secondary">Monitoring periode: {selectedDate.format('MMMM YYYY')}</Text>
                </div>

                {/* FILTER DATEPICKER */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Text strong>Pilih Periode:</Text>
                    <DatePicker
                        picker="month"
                        value={selectedDate}
                        onChange={handleDateChange}
                        allowClear={false}
                        format="MMM YYYY"
                    />
                </div>
            </Header>

            <Content style={{ padding: 24 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>
                ) : (
                    <>
                        {/* SUMMARY CARDS */}
                        <Row gutter={[16, 16]}>
                            {data?.summary.map((card, index) => (
                                <Col xs={24} sm={12} lg={6} key={index}>
                                    <SummaryCard
                                        {...card}
                                        icon={iconMap[card.icon]}
                                    />
                                </Col>
                            ))}
                        </Row>

                        <Divider />

                        {/* Charts, Tables, etc (sama seperti sebelumnya) */}
                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={16}>
                                <Card>
                                    <LineChart data={data?.visitsBySales} title="Kunjungan Per Sales" />
                                </Card>
                            </Col>
                            <Col xs={24} lg={8}>
                                <Card>
                                    <PieChart data={data?.docDistribution} title="Distribusi Siklus DOC" />
                                </Card>
                            </Col>
                        </Row>

                        <Divider />

                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={16}>
                                <RecentVisitsTable visits={data?.recentVisits} title="Kunjungan Terbaru" />
                            </Col>
                            <Col xs={24} lg={8}>
                                <TopPerformersCard
                                    performers={data?.topPerformers.map(p => ({
                                        ...p,
                                        revenue: `${p.total_kolam} Kolam`
                                    }))}
                                    title="Top Performers"
                                />
                            </Col>
                        </Row>
                    </>
                )}
            </Content>
        </Layout>
    );
}

export default App;