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
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
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
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0')); // Menyesuaikan dengan bulan saat ini
  const [year, setYear] = useState(currentDate.getFullYear());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { dateFormat } = useDate();

  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://123.255.202.38:5000/api/review`, {
        params: { month, year },
      });
      setData(res.data.data);
      setSelectedStatus(null); // reset filter status saat refresh
      setCurrentPage(1); // reset halaman ke 1 saat refresh
    } catch (err) {
      console.error('Gagal ambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCountByStatus = (status) =>
    data.filter((item) => (item.status || 'Belum Review') === status).length;

  const handleAction = (item, actionType) => {
    if (actionType === 'Review') {
      navigate('/review/process', {
        state: {
          month,
          year,
          name: item.name,
        },
      });
    }
  };

  const handleSummaryClick = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const filteredData = selectedStatus
    ? data.filter((item) => (item.status || 'Belum Review') === selectedStatus)
    : data;

  const columns = [
    {
      title: 'No.',
      key: 'index',
      render: (text, record, index) =>
        (currentPage - 1) * pageSize + index + 1,
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
      render: (text) => <Text> {text ? dayjs(text).format(dateFormat) : '-'} </Text>,
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button
          type="default"
          onClick={() => handleAction(record, 'Review')}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Card
        title="Filter Data"
        variant="outlined"
        style={{ marginBottom: 24, borderRadius: '10px' }}
      >
        <Row gutter={16} align="bottom">
          <Col>
            <Text strong>Bulan</Text>
            <Select
              value={month}
              onChange={setMonth}
              style={{ width: 100 }}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const m = (i + 1).toString().padStart(2, '0');
                return (
                  <Option key={m} value={m}>
                    {m}
                  </Option>
                );
              })}
            </Select>
          </Col>
          <Col>
            <Text strong>Tahun</Text>
            <InputNumber value={year} onChange={setYear} style={{ width: 120 }} />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchData}>
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <SummaryCard
          label="Belum Review"
          count={getCountByStatus('Belum Review')}
          color="default"
          icon={statusIcons['Belum Review']}
          onClick={() => handleSummaryClick('Belum Review')}
        />
        <SummaryCard
          label="On Review"
          count={getCountByStatus('Proses')}
          color="warning"
          icon={statusIcons.Proses}
          onClick={() => handleSummaryClick('Proses')}
        />
        <SummaryCard
          label="Approved"
          count={getCountByStatus('Approved')}
          color="success"
          icon={statusIcons.Approved}
          onClick={() => handleSummaryClick('Approved')}
        />
        <SummaryCard
          label="Rejected"
          count={getCountByStatus('Rejected')}
          color="error"
          icon={statusIcons.Rejected}
          onClick={() => handleSummaryClick('Rejected')}
        />
      </Row>

      <Card
        title="List Review"
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
