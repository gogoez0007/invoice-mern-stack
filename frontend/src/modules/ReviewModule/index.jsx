import React, { useEffect, useState } from 'react';
import {
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  Badge,
  Typography,
  Spin,
  Empty,
  Table,
  Radio,
  Input,
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDate } from '@/settings';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;


const statusLabels = {
  'Belum Review': 'Belum Review',
  Proses: 'On Review',
  Approved: 'Approved',
  Rejected: 'Rejected',
};

const statusColors = {
  'Belum Review': 'default',
  Proses: 'warning',
  Approved: 'success',
  Rejected: 'error',
};

const statusIcons = {
  'Belum Review': <FileTextOutlined />,
  Proses: <HourglassOutlined />,
  Approved: <CheckCircleOutlined />,
  Rejected: <CloseCircleOutlined />,
};

const Review = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'));
  const [year, setYear] = useState(currentDate.getFullYear());
  const [filterMode, setFilterMode] = useState('all'); // 'all' atau 'monthYear'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { dateFormat } = useDate();
  const [searchName, setSearchName] = useState('');

  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};

      if (filterMode === 'monthYear') {
        params.month = month;
        params.year = year;
      }

      const res = await axios.get(`http://localhost:5000/api/review`, { params });
      setData(res.data.data);
      setSelectedStatus(null);
      setCurrentPage(1);
    } catch (err) {
      console.error('Gagal ambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMode]);

  const getCountByStatus = (status) =>
    data.filter((item) => (item.status || 'Belum Review') === status).length;

  const handleAction = (item, actionType) => {
    if (actionType === 'Review') {
      navigate('/review/process', {
        state: { month, year, name: item.name },
      });
    }
  };

  const handleSummaryClick = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const filteredData = data.filter((item) => {
    const statusMatch = selectedStatus ? (item.status || 'Belum Review') === selectedStatus : true;
    const nameMatch = item.name.toLowerCase().includes(searchName.toLowerCase());
    return statusMatch && nameMatch;
  });

  const columns = [
    {
      title: 'No.',
      key: 'index',
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Nama',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={statusColors[status || 'Belum Review']}
          text={statusLabels[status || 'Belum Review']}
        />
      ),
    },
    {
      title: 'Tanggal Review',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (text) => <Text>{text ? dayjs(text).format(dateFormat) : '-'}</Text>,
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button type="default" onClick={() => handleAction(record, 'Review')}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Card title="Filter Data" variant="outlined" style={{ marginBottom: 24, borderRadius: '10px' }}>
        <Row gutter={16} align="middle" wrap={false} style={{ marginBottom: 16 }}>

          <Col flex="none" style={{ display: 'flex', alignItems: 'center' }}>
            <Radio.Group
              onChange={(e) => setFilterMode(e.target.value)}
              value={filterMode}
              style={{
                display: 'inline-flex',
                overflow: 'hidden', // biar sudut keliatan rapi
                borderRadius: 20,
              }}
            >
              <Radio.Button
                value="all"
                style={{
                  borderRadius: '20px 0 0 20px', // sudut kiri rounded
                }}
              >
                Semua Data
              </Radio.Button>

              <Radio.Button
                value="monthYear"
                style={{
                  borderRadius: '0 20px 20px 0', // sudut kanan rounded
                }}
              >
                Bulan & Tahun
              </Radio.Button>
            </Radio.Group>

          </Col>

          {filterMode === 'monthYear' && (
            <>
              <Col flex="none">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text strong style={{ minWidth: 50, marginRight: 8 }}>Bulan</Text>
                  <Select
                    value={month}
                    onChange={setMonth}
                    style={{ width: 140 }}
                    options={Array.from({ length: 12 }, (_, i) => ({
                      value: (i + 1).toString().padStart(2, '0'),
                      label: (i + 1).toString().padStart(2, '0'),
                    }))}
                  />
                </div>
              </Col>

              <Col flex="none">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text strong style={{ minWidth: 50, marginRight: 8 }}>Tahun</Text>
                  <InputNumber
                    value={year}
                    onChange={setYear}
                    style={{ width: 140 }}
                    min={2025}
                    max={new Date().getFullYear()}
                  />
                </div>
              </Col>

              <Col flex="none">
                <Button type="primary" onClick={fetchData} style={{ padding: '0 20px' }}>
                  Refresh
                </Button>
              </Col>
            </>
          )}
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {['Belum Review', 'Proses', 'Approved', 'Rejected'].map((status) => (
          <SummaryCard
            key={status}
            label={statusLabels[status]}
            count={getCountByStatus(status)}
            color={statusColors[status]}
            icon={statusIcons[status]}
            onClick={() => handleSummaryClick(status)}
          />
        ))}
      </Row>
      <Card
        title="List Review"
        extra={
          <Input
            placeholder="Cari data..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined style={{ color: '#999' }} />}
          />
        }
        variant="outlined"
        style={{ borderRadius: '10px' }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : filteredData.length === 0 ? (
          <Empty description="Tidak ada data." />
        ) : (
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey={(record, index) => record.id || `temp-id-${index}`}
            pagination={{
              pageSize,
              current: currentPage,
              onChange: (page) => setCurrentPage(page),
            }}
          />
        )}
      </Card>
    </div>
  );
};

const SummaryCard = ({ label, count, color, icon, onClick }) => {
  const bgColorMap = {
    default: ['#e0e0e0', '#f7f7f7'],
    warning: ['#fff4e5', '#fff0b3'],
    success: ['#d9f7be', '#b7eb8f'],
    error: ['#ffe7e7', '#ffccc7'],
  };
  const [bg1, bg2] = bgColorMap[color];

  return (
    <Col xs={12} md={6}>
      <Card
        onClick={onClick}
        style={{
          textAlign: 'center',
          position: 'relative',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${bg1} 0%, ${bg2} 100%)`,
          cursor: 'pointer',
        }}
        variant="outlined"
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: 10,
            backgroundColor:
              color === 'default'
                ? '#d9d9d9'
                : color === 'warning'
                  ? '#faad14'
                  : color === 'success'
                    ? '#52c41a'
                    : '#f5222d',
            borderRadius: '12px 0 0 12px',
          }}
        />
        <div style={{ paddingLeft: 20 }}>
          <Text type="secondary">{label}</Text>
          <Title level={2} style={{ margin: 0, fontWeight: '600' }}>
            {icon}
            <span style={{ marginLeft: 8 }}>{count}</span>
          </Title>
        </div>
      </Card>
    </Col>
  );
};

export default Review;
