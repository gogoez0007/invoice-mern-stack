import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Input,
  Select,
  Button,
  Modal,
  Typography,
  Descriptions,
  Image,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip,
} from 'antd';
import {
  FileProtectOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  CloseCircleTwoTone,
  PaperClipOutlined,
  ExportOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_BASE_URL, BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';
import useResponsive from '@/hooks/useResponsive';

const { Title, Text, Paragraph } = Typography;

const ATTENDANCE_FILES_BASE_URL = 'https://attendance.delmargroup.co.id';

const getLeaveDocFullUrl = (docPath) => {
  if (!docPath) return '';
  const trimmed = String(docPath).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${ATTENDANCE_FILES_BASE_URL}${cleanPath}`;
};

const LEAVE_TYPE_MAP = {
  PLANNED_ABSENCE: { label: 'Cuti / Izin Terencana', color: 'blue' },
  UNPLANNED_ABSENCE: { label: 'Izin Mendadak', color: 'orange' },
  LEAVE_WORKPLACE: { label: 'Meninggalkan Kantor (LW)', color: 'geekblue' },
  LATE_ARRIVAL: { label: 'Datang Terlambat (LA)', color: 'warning' },
  EARLY_DEPARTURE: { label: 'Pulang Cepat (ED)', color: 'volcano' },
  LATE_ARRIVAL_OFFSITE: { label: 'Terlambat - Dinas Luar', color: 'purple' },
  EARLY_DEPARTURE_OFFSITE: { label: 'Pulang Cepat - Dinas Luar', color: 'purple' },
  SICK_NO_CERT: { label: 'Sakit (Tanpa Surat Dokter)', color: 'red' },
  SICK_WITH_CERT: { label: 'Sakit (Ada Surat Dokter)', color: 'magenta' },
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

export default function LeaveRequestsPage() {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  // Detail Modal State
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const fetchLeaveRequests = async (page = 1, pageSize = 15, q = search) => {
    setLoading(true);
    includeToken();
    try {
      const params = {
        page,
        items: pageSize,
        q: q ? q.trim() : undefined,
        sortBy: 'id',
        sortValue: '2', // Descending
      };

      const res = await axios.get('/leaveRequest/list', { params });
      if (res.data?.success) {
        const list = res.data.result || [];
        setData(list);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: res.data.pagination?.count || list.length,
        });
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests(1, pagination.pageSize, search);
  }, []);

  // Filter client-side untuk status & type
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchType = filterType ? item.leave_type === filterType : true;
      const statusNormalized = (item.status || 'pending').toLowerCase();
      const matchStatus = filterStatus ? statusNormalized === filterStatus.toLowerCase() : true;
      return matchType && matchStatus;
    });
  }, [data, filterType, filterStatus]);

  // Statistik ringkasan
  const stats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    data.forEach((r) => {
      const s = (r.status || 'pending').toLowerCase();
      if (s === 'approved') approved++;
      else if (s === 'rejected') rejected++;
      else pending++;
    });
    return { total: pagination.total || data.length, approved, pending, rejected };
  }, [data, pagination.total]);

  const handleOpenDetail = (record) => {
    setSelectedLeave(record);
    setDetailModalVisible(true);
  };

  const parseSupportingDocs = (docField) => {
    if (!docField) return [];
    if (Array.isArray(docField)) return docField;
    try {
      const parsed = JSON.parse(docField);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch (_) {
      return [String(docField)];
    }
  };

  const columns = [
    {
      title: 'No',
      width: 60,
      align: 'center',
      render: (_, __, i) => (pagination.current - 1) * pagination.pageSize + i + 1,
    },
    {
      title: 'Nama Karyawan',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text) => <Text strong>{text || '-'}</Text>,
    },
    {
      title: 'Departemen / Divisi',
      dataIndex: 'department_division',
      key: 'department_division',
      render: (text) => text || '-',
    },
    {
      title: 'Jenis Izin / Cuti',
      dataIndex: 'leave_type',
      key: 'leave_type',
      render: (type) => {
        const meta = LEAVE_TYPE_MAP[type] || { label: type || 'Lainnya', color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Periode Cuti',
      key: 'periode',
      render: (_, r) => {
        const start = r.start_date ? dayjs(r.start_date).format('DD MMM YYYY') : '-';
        const end = r.return_date ? dayjs(r.return_date).format('DD MMM YYYY') : '-';
        return (
          <Space orientation="vertical" size={0}>
            <span>{start} s/d {end}</span>
          </Space>
        );
      },
    },
    {
      title: 'Tgl Pengajuan',
      dataIndex: 'submission_date',
      key: 'submission_date',
      width: 130,
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (status) => {
        const s = (status || 'pending').toLowerCase();
        if (s === 'approved') return <Tag color="success">Approved</Tag>;
        if (s === 'rejected') return <Tag color="error">Rejected</Tag>;
        return <Tag color="gold">Pending</Tag>;
      },
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, r) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleOpenDetail(r)}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Header Banner */}
      <Card
        className="shadow-sm"
        style={{
          marginBottom: 16,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #4338CA 0%, #0891B2 100%)',
          color: '#ffffff',
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Space orientation="vertical" size={4}>
          <Space align="center" size={10}>
            <FileProtectOutlined style={{ fontSize: 24, color: '#fff' }} />
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              Daftar Pengajuan Cuti & Izin Karyawan
            </Title>
          </Space>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            Monitoring dan riwayat seluruh pengajuan cuti, sakit, dan izin kerja karyawan (Hermes HRIS)
          </Text>
        </Space>
      </Card>

      {/* Summary Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10, borderLeft: '4px solid #4F46E5' }}>
            <Statistic
              title="Total Pengajuan"
              value={stats.total}
              prefix={<CalendarOutlined style={{ color: '#4F46E5' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10, borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="Disetujui (Approved)"
              value={stats.approved}
              prefix={<CheckCircleTwoTone twoToneColor="#52c41a" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10, borderLeft: '4px solid #faad14' }}>
            <Statistic
              title="Menunggu (Pending)"
              value={stats.pending}
              prefix={<ClockCircleTwoTone twoToneColor="#faad14" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10, borderLeft: '4px solid #ff4d4f' }}>
            <Statistic
              title="Ditolak (Rejected)"
              value={stats.rejected}
              prefix={<CloseCircleTwoTone twoToneColor="#ff4d4f" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Toolbar & Filter */}
      <Card className="shadow-sm" style={{ borderRadius: 12, marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space wrap size={10}>
            <Input.Search
              placeholder="Cari nama karyawan..."
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: isMobile ? '100%' : 260 }}
              onSearch={(v) => {
                setSearch(v);
                fetchLeaveRequests(1, pagination.pageSize, v);
              }}
            />
            <Select
              allowClear
              placeholder="Filter Jenis Cuti/Izin"
              style={{ width: isMobile ? '100%' : 220 }}
              value={filterType}
              onChange={setFilterType}
              options={Object.entries(LEAVE_TYPE_MAP).map(([val, { label }]) => ({
                value: val,
                label,
              }))}
            />
            <Select
              allowClear
              placeholder="Filter Status"
              style={{ width: isMobile ? '100%' : 140 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchLeaveRequests(pagination.current, pagination.pageSize, search)}
          >
            Refresh
          </Button>
        </Space>

        {/* Tabel Data */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          size="middle"
          scroll={{ x: 900 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '15', '25', '50'],
            showTotal: (total) => `Total ${total} pengajuan cuti`,
            onChange: (p, ps) => fetchLeaveRequests(p, ps, search),
          }}
        />
      </Card>

      {/* Modal Detail Pengajuan */}
      <Modal
        title={
          <Space>
            <FileProtectOutlined style={{ color: '#4F46E5' }} />
            <span>Detail Pengajuan Izin / Cuti #{selectedLeave?.id}</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalVisible(false)}>
            Tutup
          </Button>,
        ]}
        width={650}
        destroyOnClose
      >
        {selectedLeave && (
          <Space orientation="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Nama Karyawan">
                <Text strong>{selectedLeave.full_name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Departemen / Divisi">
                {selectedLeave.department_division || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Jenis Izin">
                <Tag color={LEAVE_TYPE_MAP[selectedLeave.leave_type]?.color || 'default'}>
                  {LEAVE_TYPE_MAP[selectedLeave.leave_type]?.label || selectedLeave.leave_type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Mulai">
                {selectedLeave.start_date ? dayjs(selectedLeave.start_date).format('DD MMMM YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Kembali / Masuk">
                {selectedLeave.return_date ? dayjs(selectedLeave.return_date).format('DD MMMM YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Diajukan">
                {selectedLeave.submission_date ? dayjs(selectedLeave.submission_date).format('DD MMMM YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Status Persetujuan">
                {(() => {
                  const s = (selectedLeave.status || 'pending').toLowerCase();
                  if (s === 'approved') return <Tag color="success">Approved</Tag>;
                  if (s === 'rejected') return <Tag color="error">Rejected</Tag>;
                  return <Tag color="gold">Pending</Tag>;
                })()}
              </Descriptions.Item>
              {selectedLeave.approved_at && (
                <Descriptions.Item label="Waktu Disetujui">
                  {dayjs(selectedLeave.approved_at).format('DD MMM YYYY HH:mm')} WIB
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Alasan / Keterangan">
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-line' }}>
                  {selectedLeave.reason || 'Tidak ada alasan yang disertakan.'}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>

            {/* Lampiran Bukti / Surat Dokter */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                <PaperClipOutlined style={{ marginRight: 6 }} />
                Lampiran Bukti Dokumen / Surat Dokter:
              </Text>
              {(() => {
                const docs = parseSupportingDocs(selectedLeave.supporting_doc);
                if (docs.length === 0) {
                  return <Text type="secondary" italic>Tidak ada lampiran dokumen pendukung.</Text>;
                }
                return (
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {docs.map((docPath, idx) => {
                      const fullUrl = getLeaveDocFullUrl(docPath);
                      const isPdf = typeof fullUrl === 'string' && fullUrl.toLowerCase().endsWith('.pdf');
                      return (
                        <Card
                          key={idx}
                          size="small"
                          hoverable
                          style={{
                            width: 160,
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          }}
                          bodyStyle={{ padding: 10, textAlign: 'center' }}
                        >
                          {isPdf ? (
                            <div
                              style={{
                                height: 100,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#fef2f2',
                                borderRadius: 8,
                                marginBottom: 8,
                                color: '#dc2626',
                              }}
                            >
                              <FileTextOutlined style={{ fontSize: 32, marginBottom: 4 }} />
                              <span style={{ fontSize: 11, fontWeight: 600 }}>Dokumen PDF</span>
                            </div>
                          ) : (
                            <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 8, background: '#f8fafc' }}>
                              <Image
                                src={fullUrl}
                                alt={`Lampiran #${idx + 1}`}
                                style={{ width: '100%', height: 100, objectFit: 'cover' }}
                                preview={{
                                  mask: (
                                    <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <EyeOutlined /> Lihat
                                    </div>
                                  ),
                                }}
                                fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='100' fill='%23e2e8f0'><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-size='11' font-family='sans-serif'>Gagal Muat</text></svg>"
                              />
                            </div>
                          )}
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                            Lampiran #{idx + 1}
                          </div>
                          <Button
                            type="primary"
                            size="small"
                            ghost
                            icon={<ExportOutlined />}
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ width: '100%', fontSize: 11, borderRadius: 6 }}
                          >
                            Buka Dokumen
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
