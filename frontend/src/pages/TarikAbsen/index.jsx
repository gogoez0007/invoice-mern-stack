import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Typography,
  Divider,
  Tag,
  Alert,
  message,
  Tooltip,
  Tabs,
  Table,
  Select,
  Input,
  Radio,
  Space,
  Statistic,
  Badge,
} from 'antd';
import {
  FileExcelOutlined,
  DownloadOutlined,
  CalendarOutlined,
  CloudDownloadOutlined,
  CopyOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  TableOutlined,
  BarChartOutlined,
  CheckCircleTwoTone,
  TeamOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import * as XLSX from 'xlsx';
import useResponsive from '@/hooks/useResponsive';
import { leaveApprovalService } from '@/request/leaveApprovalService';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const BASE_TARIK_ABSEN_URL = 'https://attendance-report.delmargroup.co.id';

// Helper pemformat waktu tanpa potensi "Invalid Date"
const formatTimeOnly = (val) => {
  if (!val) return '-';
  if (typeof val === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(val.trim())) {
    return val.trim();
  }
  const d = dayjs(val);
  if (d.isValid()) {
    return d.format('HH:mm:ss');
  }
  return String(val);
};

export default function TarikAbsenPage() {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'employee' | 'monthly_recap'

  // ===================== TAB 1: ATTENDANCE STATE =====================
  const [attDateRange, setAttDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [attDept, setAttDept] = useState('all');
  const [attSearch, setAttSearch] = useState('');
  const [attLoading, setAttLoading] = useState(false);
  const [attData, setAttData] = useState([]);
  const [attPagination, setAttPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [attDownloading, setAttDownloading] = useState(false);

  // ===================== TAB 2: EMPLOYEE STATE =====================
  const [empStatus, setEmpStatus] = useState('all'); // 'all' | '1' (aktif) | '0' (non-aktif)
  const [empDept, setEmpDept] = useState('all');
  const [empSearch, setEmpSearch] = useState('');
  const [empLoading, setEmpLoading] = useState(false);
  const [empData, setEmpData] = useState([]);
  const [empStats, setEmpStats] = useState({ total_all: 0, total_active: 0, total_inactive: 0 });
  const [empPagination, setEmpPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [empDownloading, setEmpDownloading] = useState(false);

  // ===================== TAB 3: MONTHLY RECAP STATE =====================
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [monthDownloading, setMonthDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Department List Options
  const departmentOptions = [
    { label: 'Semua Departemen', value: 'all' },
    { label: 'Operasional', value: 'Operasional' },
    { label: 'HRD', value: 'HRD' },
    { label: 'FAT / Finance', value: 'Finance' },
    { label: 'Accounting', value: 'Accounting' },
    { label: 'IT Software & Hardware', value: 'IT' },
    { label: 'R&D', value: 'R&D' },
    { label: 'Produksi', value: 'Produksi' },
    { label: 'Laboratorium', value: 'SPV Laboratorium' },
  ];

  // ===================== FETCH ATTENDANCE DATA =====================
  const fetchAttendance = async (page = 1, pageSize = 20) => {
    setAttLoading(true);
    try {
      const params = {
        page,
        items: pageSize,
        start_date: attDateRange?.[0] ? attDateRange[0].format('YYYY-MM-DD') : undefined,
        end_date: attDateRange?.[1] ? attDateRange[1].format('YYYY-MM-DD') : undefined,
        department: attDept !== 'all' ? attDept : undefined,
        q: attSearch.trim() || undefined,
      };

      const res = await leaveApprovalService.exportAttendance(params);
      if (res.success) {
        setAttData(res.result || []);
        setAttPagination({
          current: page,
          pageSize,
          total: res.pagination?.count || 0,
        });
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal memuat data absensi: ' + err.message);
    } finally {
      setAttLoading(false);
    }
  };

  // ===================== FETCH EMPLOYEE DATA =====================
  const fetchEmployees = async (page = 1, pageSize = 20) => {
    setEmpLoading(true);
    try {
      const params = {
        page,
        items: pageSize,
        is_active: empStatus,
        department: empDept !== 'all' ? empDept : undefined,
        q: empSearch.trim() || undefined,
      };

      const res = await leaveApprovalService.exportEmployees(params);
      if (res.success) {
        setEmpData(res.result || []);
        setEmpStats(res.stats || { total_all: 0, total_active: 0, total_inactive: 0 });
        setEmpPagination({
          current: page,
          pageSize,
          total: res.pagination?.count || 0,
        });
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal memuat data karyawan: ' + err.message);
    } finally {
      setEmpLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance(1, attPagination.pageSize);
    } else if (activeTab === 'employee') {
      fetchEmployees(1, empPagination.pageSize);
    }
  }, [activeTab, attDateRange, attDept, attSearch, empStatus, empDept, empSearch]);

  // ===================== EXCEL DOWNLOAD HELPERS =====================
  const handleExportAttendanceExcel = async () => {
    setAttDownloading(true);
    message.loading({ content: 'Menyiapkan file Excel absensi periodik...', key: 'exp_att' });
    try {
      const params = {
        download: '1',
        start_date: attDateRange?.[0] ? attDateRange[0].format('YYYY-MM-DD') : undefined,
        end_date: attDateRange?.[1] ? attDateRange[1].format('YYYY-MM-DD') : undefined,
        department: attDept !== 'all' ? attDept : undefined,
        q: attSearch.trim() || undefined,
      };

      const res = await leaveApprovalService.exportAttendance(params);
      const rawRows = res.result || [];

      if (rawRows.length === 0) {
        message.warning({ content: 'Tidak ada data absensi yang sesuai filter.', key: 'exp_att' });
        return;
      }

      const formatted = rawRows.map((r, i) => ({
        No: i + 1,
        'Tanggal Absen': r.date ? dayjs(r.date).format('YYYY-MM-DD') : '',
        Entitas: r.entitas_name || 'General',
        'Nama Karyawan': r.employee_name,
        Departemen: r.department || '-',
        'Jabatan / Posisi': r.position || '-',
        'Status Karyawan': r.employee_is_active === 1 ? 'Aktif' : 'Non-Aktif',
        'Jam Masuk': formatTimeOnly(r.check_in_time),
        'Jam Pulang': formatTimeOnly(r.check_out_time),
        'Lokasi Absen': r.location_name || '-',
        'Keterangan Izin': r.leave_type || '-',
        'Alasan Izin': r.leave_reason || '-',
        'Status Approval Izin': r.leave_status || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Absensi');

      const fileName = `Laporan_Absensi_Periodik_${attDateRange?.[0]?.format('YYYYMMDD') || ''}_sd_${attDateRange?.[1]?.format('YYYYMMDD') || ''}.xlsx`;
      XLSX.writeFile(wb, fileName);

      message.success({ content: `File "${fileName}" berhasil diunduh (${formatted.length} baris)!`, key: 'exp_att' });
    } catch (err) {
      console.error(err);
      message.error({ content: 'Gagal mendownload Excel absensi: ' + err.message, key: 'exp_att' });
    } finally {
      setAttDownloading(false);
    }
  };

  const handleExportEmployeeExcel = async () => {
    setEmpDownloading(true);
    message.loading({ content: 'Menyiapkan file Excel data karyawan...', key: 'exp_emp' });
    try {
      const params = {
        download: '1',
        is_active: empStatus,
        department: empDept !== 'all' ? empDept : undefined,
        q: empSearch.trim() || undefined,
      };

      const res = await leaveApprovalService.exportEmployees(params);
      const rawRows = res.result || [];

      if (rawRows.length === 0) {
        message.warning({ content: 'Tidak ada data karyawan yang sesuai filter.', key: 'exp_emp' });
        return;
      }

      const formatted = rawRows.map((e, i) => ({
        No: i + 1,
        Entitas: e.entitas_name || 'General',
        'Nama Lengkap': e.name,
        Departemen: e.department || '-',
        'Jabatan / Posisi': e.position || '-',
        Email: e.email || '-',
        'Nomor Telepon': e.phone || '-',
        'Status Keaktifan': e.is_active === 1 ? 'AKTIF' : 'NON-AKTIF',
        'Tanggal Bergabung': e.created_at ? dayjs(e.created_at).format('YYYY-MM-DD') : '-',
      }));

      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan');

      const statusSuffix = empStatus === '1' ? 'Aktif' : empStatus === '0' ? 'NonAktif' : 'Semua';
      const fileName = `Data_Karyawan_${statusSuffix}_${dayjs().format('YYYYMMDD')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      message.success({ content: `File "${fileName}" berhasil diunduh (${formatted.length} baris)!`, key: 'exp_emp' });
    } catch (err) {
      console.error(err);
      message.error({ content: 'Gagal mendownload Excel karyawan: ' + err.message, key: 'exp_emp' });
    } finally {
      setEmpDownloading(false);
    }
  };

  // ===================== MONTHLY RECAP HELPER =====================
  const currentTargetUrl = `${BASE_TARIK_ABSEN_URL}/getsummaryabsen/${BULAN_INDONESIA[selectedMonth.month()]}-${selectedMonth.year()}`;
  const currentMonthYearLabel = `${BULAN_INDONESIA[selectedMonth.month()]} ${selectedMonth.year()}`;

  const handleDownloadMonthly = () => {
    setMonthDownloading(true);
    message.loading({ content: `Memproses download laporan ${currentMonthYearLabel}...`, key: 'download' });
    try {
      const win = window.open(currentTargetUrl, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = currentTargetUrl;
        a.target = '_blank';
        a.download = `Laporan_Absensi_Jam_Kerja_${BULAN_INDONESIA[selectedMonth.month()]}-${selectedMonth.year()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      message.success({ content: `Download laporan ${currentMonthYearLabel} dimulai!`, key: 'download' });
    } catch (err) {
      console.error('Download error:', err);
      message.error({ content: 'Gagal mendownload laporan: ' + err.message, key: 'download' });
    } finally {
      setTimeout(() => setMonthDownloading(false), 1200);
    }
  };

  // ===================== COLUMNS =====================
  const attColumns = [
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      width: 105,
      render: (v) => <Text strong>{v ? dayjs(v).format('DD/MM/YYYY') : '-'}</Text>,
    },
    {
      title: 'Entitas',
      dataIndex: 'entitas_name',
      key: 'entitas_name',
      width: 100,
      render: (v) => <Tag color="geekblue" style={{ fontWeight: 600 }}>{v || 'General'}</Tag>,
    },
    {
      title: 'Nama Karyawan',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (v) => <Text strong style={{ fontSize: 13.5 }}>{v}</Text>,
    },
    {
      title: 'Departemen & Jabatan',
      key: 'dept_pos',
      render: (_, r) => (
        <div>
          <Tag color="blue" style={{ fontSize: 11.5 }}>{r.department || '-'}</Tag>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.position || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Status Karyawan',
      dataIndex: 'employee_is_active',
      key: 'emp_status',
      width: 120,
      align: 'center',
      render: (v) =>
        v === 1 ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Aktif</Tag>
        ) : (
          <Tag color="default" icon={<CloseCircleOutlined />}>Non-Aktif</Tag>
        ),
    },
    {
      title: 'Jam Masuk',
      dataIndex: 'check_in_time',
      key: 'check_in_time',
      render: (v) => v ? <Tag color="green">{formatTimeOnly(v)}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Jam Pulang',
      dataIndex: 'check_out_time',
      key: 'check_out_time',
      render: (v) => v ? <Tag color="orange">{formatTimeOnly(v)}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Lokasi Absen',
      dataIndex: 'location_name',
      key: 'location_name',
      render: (v) => <Text style={{ fontSize: 12.5 }}>{v || '-'}</Text>,
    },
    {
      title: 'Keterangan Izin',
      key: 'leave_info',
      render: (_, r) =>
        r.leave_type ? (
          <div>
            <Tag color="purple" style={{ fontWeight: 600 }}>{r.leave_type}</Tag>
            {r.leave_reason && (
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{r.leave_reason}</div>
            )}
          </div>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  const empColumns = [
    {
      title: 'Entitas',
      dataIndex: 'entitas_name',
      key: 'entitas_name',
      width: 110,
      render: (v) => <Tag color="geekblue" style={{ fontWeight: 600 }}>{v || 'General'}</Tag>,
    },
    {
      title: 'Nama Lengkap',
      dataIndex: 'name',
      key: 'name',
      render: (v) => <Text strong style={{ fontSize: 14 }}>{v}</Text>,
    },
    {
      title: 'Departemen',
      dataIndex: 'department',
      key: 'department',
      render: (v) => <Tag color="cyan">{v || '-'}</Tag>,
    },
    {
      title: 'Jabatan / Posisi',
      dataIndex: 'position',
      key: 'position',
      render: (v) => <Text style={{ fontSize: 13 }}>{v || '-'}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (v) => v ? <Text style={{ fontSize: 12.5 }}>{v}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Status Keaktifan',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 130,
      align: 'center',
      render: (v) =>
        v === 1 ? (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ padding: '3px 10px', fontSize: 12 }}>
            Aktif
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />} style={{ padding: '3px 10px', fontSize: 12 }}>
            Non-Aktif
          </Tag>
        ),
    },
    {
      title: 'Bergabung',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '-',
    },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header Banner */}
      <Card
        className="shadow-sm"
        style={{
          marginBottom: 20,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #047857 0%, #0d9488 50%, #0284c7 100%)',
          color: '#ffffff',
          border: 'none',
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={18}>
            <Space align="center" size={14}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: 12,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FileExcelOutlined style={{ fontSize: 28, color: '#ffffff' }} />
              </div>
              <div>
                <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  Report HR
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: 13.5 }}>
                  Laporan absensi periodik, data karyawan per entitas & status keaktifan, serta rekapitulasi jam kerja ke format Excel.
                </Paragraph>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Tabs */}
      <Card style={{ borderRadius: 12 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          items={[
            {
              key: 'attendance',
              label: (
                <Space>
                  <CalendarOutlined />
                  <span>Tarik Absensi (Periodik)</span>
                </Space>
              ),
            },
            {
              key: 'employee',
              label: (
                <Space>
                  <TeamOutlined />
                  <span>Tarik Data Karyawan (Aktif / Non-Aktif)</span>
                  <Badge
                    count={empStats.total_all || undefined}
                    style={{ backgroundColor: '#047857' }}
                  />
                </Space>
              ),
            },
            {
              key: 'monthly_recap',
              label: (
                <Space>
                  <BarChartOutlined />
                  <span>Rekap Bulanan Server</span>
                </Space>
              ),
            },
          ]}
        />

        {/* ==================== TAB 1: ATTENDANCE PERIODIC ==================== */}
        {activeTab === 'attendance' && (
          <div>
            {/* Filter Toolbar */}
            <Card
              size="small"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                marginBottom: 16,
                marginTop: 8,
              }}
            >
              <Row gutter={[12, 12]} align="middle">
                <Col xs={24} md={8}>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#475569' }}>
                    Rentang Tanggal (Periodik):
                  </Text>
                  <RangePicker
                    value={attDateRange}
                    onChange={(val) => setAttDateRange(val)}
                    style={{ width: '100%', borderRadius: 6 }}
                    format="DD/MM/YYYY"
                    allowClear={false}
                  />
                </Col>
                <Col xs={24} sm={12} md={5}>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#475569' }}>
                    Departemen:
                  </Text>
                  <Select
                    value={attDept}
                    onChange={setAttDept}
                    options={departmentOptions}
                    style={{ width: '100%', borderRadius: 6 }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#475569' }}>
                    Pencarian Karyawan:
                  </Text>
                  <Input
                    placeholder="Nama / NIK / Lokasi..."
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    value={attSearch}
                    onChange={(e) => setAttSearch(e.target.value)}
                    allowClear
                    style={{ borderRadius: 6 }}
                  />
                </Col>
                <Col xs={24} md={5} style={{ textAlign: isMobile ? 'left' : 'right', marginTop: isMobile ? 8 : 18 }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportAttendanceExcel}
                    loading={attDownloading}
                    style={{
                      background: '#16a34a',
                      borderColor: '#16a34a',
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    Download Excel (.xlsx)
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Attendance Table */}
            <Table
              columns={attColumns}
              dataSource={attData}
              rowKey="id"
              loading={attLoading}
              pagination={{
                current: attPagination.current,
                pageSize: attPagination.pageSize,
                total: attPagination.total,
                showSizeChanger: true,
                pageSizeOptions: ['15', '20', '50', '100'],
                onChange: (page, pageSize) => fetchAttendance(page, pageSize),
                showTotal: (total) => `Total ${total} data absensi`,
              }}
              bordered
              size="middle"
              scroll={{ x: 1000 }}
            />
          </div>
        )}

        {/* ==================== TAB 2: EMPLOYEE DATA ==================== */}
        {activeTab === 'employee' && (
          <div>
            {/* Employee Stats Badges */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16, marginTop: 8 }}>
              <Col xs={12} sm={8}>
                <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #0284c7' }}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>Total Seluruh Karyawan</Text>}
                    value={empStats.total_all}
                    prefix={<TeamOutlined style={{ color: '#0284c7' }} />}
                    valueStyle={{ fontWeight: 700, fontSize: 20 }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #16a34a' }}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>Karyawan Aktif</Text>}
                    value={empStats.total_active}
                    prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
                    valueStyle={{ fontWeight: 700, fontSize: 20, color: '#16a34a' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #ef4444' }}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>Karyawan Non-Aktif</Text>}
                    value={empStats.total_inactive}
                    prefix={<CloseCircleOutlined style={{ color: '#ef4444' }} />}
                    valueStyle={{ fontWeight: 700, fontSize: 20, color: '#ef4444' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Filter Toolbar */}
            <Card
              size="small"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <Row gutter={[12, 12]} align="middle">
                <Col xs={24} md={9}>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#475569' }}>
                    Status Keaktifan Karyawan:
                  </Text>
                  <Radio.Group
                    value={empStatus}
                    onChange={(e) => setEmpStatus(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="all">Semua ({empStats.total_all})</Radio.Button>
                    <Radio.Button value="1">Aktif ({empStats.total_active})</Radio.Button>
                    <Radio.Button value="0">Non-Aktif ({empStats.total_inactive})</Radio.Button>
                  </Radio.Group>
                </Col>
                <Col xs={24} sm={12} md={5}>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#475569' }}>
                    Departemen:
                  </Text>
                  <Select
                    value={empDept}
                    onChange={setEmpDept}
                    options={departmentOptions}
                    style={{ width: '100%', borderRadius: 6 }}
                  />
                </Col>
                <Col xs={24} sm={12} md={5}>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4, color: '#475569' }}>
                    Pencarian Karyawan:
                  </Text>
                  <Input
                    placeholder="Nama / NIK / Posisi..."
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    allowClear
                    style={{ borderRadius: 6 }}
                  />
                </Col>
                <Col xs={24} md={5} style={{ textAlign: isMobile ? 'left' : 'right', marginTop: isMobile ? 8 : 18 }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportEmployeeExcel}
                    loading={empDownloading}
                    style={{
                      background: '#047857',
                      borderColor: '#047857',
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    Download Excel Karyawan
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Employee Table */}
            <Table
              columns={empColumns}
              dataSource={empData}
              rowKey="id"
              loading={empLoading}
              pagination={{
                current: empPagination.current,
                pageSize: empPagination.pageSize,
                total: empPagination.total,
                showSizeChanger: true,
                pageSizeOptions: ['15', '20', '50', '100'],
                onChange: (page, pageSize) => fetchEmployees(page, pageSize),
                showTotal: (total) => `Total ${total} karyawan`,
              }}
              bordered
              size="middle"
              scroll={{ x: 900 }}
            />
          </div>
        )}

        {/* ==================== TAB 3: MONTHLY RECAP ==================== */}
        {activeTab === 'monthly_recap' && (
          <div style={{ padding: '16px 0' }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={14}>
                <Card
                  title={
                    <Space>
                      <BarChartOutlined style={{ color: '#0d9488' }} />
                      <span>Rekap Bulanan Attendance Server</span>
                    </Space>
                  }
                  style={{ borderRadius: 10 }}
                >
                  <Paragraph style={{ color: '#64748b', fontSize: 13.5 }}>
                    Download file rekap kalkulasi kehadiran, keterlambatan, lembur, dan total jam kerja bulanan langsung
                    dari server pelaporan Delmar Group.
                  </Paragraph>

                  <div style={{ margin: '20px 0' }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      Pilih Bulan & Tahun Rekap:
                    </Text>
                    <DatePicker
                      picker="month"
                      value={selectedMonth}
                      onChange={(date) => setSelectedMonth(date || dayjs())}
                      format="MMMM YYYY"
                      style={{ width: '100%', maxWidth: 320, borderRadius: 6 }}
                      allowClear={false}
                    />
                  </div>

                  <div style={{ margin: '24px 0' }}>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      size="large"
                      onClick={handleDownloadMonthly}
                      loading={monthDownloading}
                      style={{
                        borderRadius: 8,
                        background: '#0d9488',
                        borderColor: '#0d9488',
                        fontWeight: 600,
                      }}
                    >
                      Download Rekap ({currentMonthYearLabel})
                    </Button>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={10}>
                <Card
                  title={<Text strong style={{ fontSize: 14 }}>Target Endpoint Server</Text>}
                  size="small"
                  style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}
                >
                  <Paragraph style={{ fontSize: 12.5, color: '#64748b' }}>
                    URL publik endpoint rekap bulanan:
                  </Paragraph>
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', wordBreak: 'break-all', fontSize: 12, fontFamily: 'monospace' }}>
                    {currentTargetUrl}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    </div>
  );
}
