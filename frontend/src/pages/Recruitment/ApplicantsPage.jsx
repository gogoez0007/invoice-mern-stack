import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Input,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Descriptions,
  Avatar,
  Tooltip,
  Popconfirm,
  Badge,
} from 'antd';
import {
  TeamOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilePdfOutlined,
  UserOutlined,
  UserAddOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CopyOutlined,
  EditOutlined,
  PrinterOutlined,
  DownloadOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { jobService, getAssetUrl } from '@/request/jobService';
import OfficialApplicationModal from './OfficialApplicationModal';
import HiringRequestModal from './HiringRequestModal';
import OfferingContractModal from './OfferingContractModal';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const APPLICANT_STATUS_OPTIONS = [
  { value: 'applied', label: 'Baru Melamar (Applied)', color: 'blue' },
  { value: 'portal_invited', label: 'Undangan Portal Terkirim', color: 'orange' },
  { value: 'biodata_completed', label: 'Formulir Lengkap (Verified)', color: 'green' },
  { value: 'assessment', label: 'Tahap Tes & Psikotes', color: 'cyan' },
  { value: 'interview_hr', label: 'Wawancara HRD', color: 'purple' },
  { value: 'interview_user', label: 'Wawancara User / Dept Head', color: 'geekblue' },
  { value: 'offering', label: 'Offering & MCU', color: 'gold' },
  { value: 'pending_hire_approval', label: 'Menunggu Approval Hiring', color: 'volcano' },
  { value: 'hired', label: 'Diterima (Hired)', color: 'success' },
  { value: 'rejected', label: 'Ditolak (Rejected)', color: 'red' },
];

export default function RecruitmentApplicantsPage() {
  const [loading, setLoading] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');

  // Detail Modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Official Form Pelamar Modal
  const [officialModalVisible, setOfficialModalVisible] = useState(false);
  const [formApplicant, setFormApplicant] = useState(null);

  // Hiring Approval Request Modal
  const [hiringModalVisible, setHiringModalVisible] = useState(false);
  const [hireApplicant, setHireApplicant] = useState(null);

  // Offering Letter & PKWT Contract Generator Modal
  const [offeringModalVisible, setOfferingModalVisible] = useState(false);
  const [contractApplicant, setContractApplicant] = useState(null);

  // Stage Notes Modal (Catatan Jadwal Tes/Interview ke Portal Kandidat)
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const [stageTargetApplicant, setStageTargetApplicant] = useState(null);
  const [pendingStageValue, setPendingStageValue] = useState('');
  const [stageNotesText, setStageNotesText] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);

  const fetchJobsList = async () => {
    try {
      const res = await jobService.getJobs({ limit: 100 });
      if (res?.success) {
        setJobs(res.result || res.data || []);
      }
    } catch (err) {
      console.warn('Failed loading jobs dropdown:', err);
    }
  };

  const fetchApplicants = async (
    page = 1,
    pageSize = 15,
    q = search,
    status = statusFilter,
    jobId = jobFilter
  ) => {
    setLoading(true);
    try {
      const res = await jobService.getAllApplicants({
        page,
        limit: pageSize,
        q: q ? q.trim() : undefined,
        status: status !== 'all' ? status : undefined,
        job_id: jobId !== 'all' ? jobId : undefined,
      });

      if (res?.success) {
        setApplicants(res.result || res.data || []);
        setPagination({
          current: res.pagination?.page || page,
          pageSize: res.pagination?.limit || pageSize,
          total: res.pagination?.total || 0,
        });
      } else {
        setApplicants([]);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
      message.error('Gagal memuat data pelamar: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsList();
    fetchApplicants(1, pagination.pageSize, search, statusFilter, jobFilter);
  }, []);

  const handleUpdateStatus = async (applicantId, newStatus, customNotes = undefined) => {
    try {
      const payload = { status: newStatus };
      if (customNotes !== undefined) {
        payload.stage_notes = customNotes;
      }
      const res = await jobService.updateApplicantStatus(applicantId, payload);
      if (res?.success) {
        message.success(res.message || 'Status & catatan tahapan pelamar berhasil diperbarui');
        fetchApplicants(pagination.current, pagination.pageSize, search, statusFilter, jobFilter);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Gagal mengubah status pelamar');
    }
  };

  const handleOpenStageModal = (applicant, targetStatus) => {
    setStageTargetApplicant(applicant);
    setPendingStageValue(targetStatus || applicant.status || 'applied');
    setStageNotesText(applicant.stage_notes || '');
    setStageModalVisible(true);
  };

  const handleConfirmStageUpdate = async () => {
    if (!stageTargetApplicant) return;
    setUpdatingStage(true);
    try {
      await handleUpdateStatus(stageTargetApplicant.id, pendingStageValue, stageNotesText);
      setStageModalVisible(false);
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleCopyPortalLink = (token) => {
    const portalUrl = `http://localhost/delmargroup/career/?action=candidate-portal&token=${token}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(portalUrl);
      message.success('Link Portal Kandidat berhasil disalin ke Clipboard!');
    } else {
      Modal.info({
        title: 'Link Portal Kandidat',
        content: <Input.TextArea value={portalUrl} readOnly rows={2} />,
      });
    }
  };

  const handleOpenWhatsApp = (record) => {
    let phone = (record.phone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    } else if (!phone.startsWith('62')) {
      phone = '62' + phone;
    }
    const portalUrl = `http://localhost/delmargroup/career/?action=candidate-portal&token=${record.portal_token || ''}`;
    const messageText = `Halo Bapak/Ibu ${record.full_name}, kami dari Tim HRD Delta Marine Group menginfokan terkait lamaran Anda untuk posisi *${record.job_title}*.\n\nSilakan akses portal rekrutmen Anda untuk memantau status atau melengkapi formulir data:\n${portalUrl}\n\nTerima kasih.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const handleExportExcel = () => {
    if (!applicants || applicants.length === 0) {
      message.warning('Tidak ada data pelamar untuk diekspor.');
      return;
    }

    const headers = [
      'Kode Registrasi',
      'Nama Lengkap',
      'NIK KTP',
      'Email',
      'No. Telepon / WhatsApp',
      'Posisi Dilamar',
      'Departemen',
      'Pendidikan Terakhir',
      'Jurusan',
      'Pengalaman Kerja (Tahun)',
      'Ekspektasi Gaji (Rp)',
      'Domisili',
      'Status Tahapan',
      'Catatan HR',
      'Status Form Pelamar',
      'Status Approval Hiring',
      'Tanggal Melamar',
    ];

    const rows = applicants.map((a) => {
      const stageLabel = APPLICANT_STATUS_OPTIONS.find((s) => s.value === a.status)?.label || a.status;
      const formStatus = a.biodata_completed_at ? 'Selesai 100%' : 'Belum Selesai';
      const hireStatus =
        a.hire_approval_status === 'approved'
          ? 'Disetujui Direksi'
          : a.hire_approval_status === 'pending'
          ? 'Menunggu Approval'
          : a.hire_approval_status || '-';
      const formattedSalary = a.expected_salary ? Number(a.expected_salary).toLocaleString('id-ID') : '-';

      return [
        `"${a.application_code || '-'}"`,
        `"${(a.full_name || '').replace(/"/g, '""')}"`,
        `="'${a.nik || ''}'"`,
        `"${(a.email || '').replace(/"/g, '""')}"`,
        `="'${a.phone || ''}'"`,
        `"${(a.job_title || '').replace(/"/g, '""')}"`,
        `"${(a.job_department || '').replace(/"/g, '""')}"`,
        `"${a.education || '-'}"`,
        `"${(a.major || '-').replace(/"/g, '""')}"`,
        `"${a.experience_years || 0}"`,
        `"${formattedSalary}"`,
        `"${(a.city || '-').replace(/"/g, '""')}"`,
        `"${stageLabel}"`,
        `"${(a.stage_notes || '-').replace(/"/g, '""')}"`,
        `"${formStatus}"`,
        `"${hireStatus}"`,
        `"${a.created_at ? dayjs(a.created_at).format('YYYY-MM-DD HH:mm') : '-'}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Data_Pelamar_DelmarGroup_${dayjs().format('YYYYMMDD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Data pelamar berhasil diekspor ke file CSV/Excel!');
  };

  const handleResendPortalEmail = async (applicantId) => {
    try {
      const res = await jobService.resendPortalEmail(applicantId);
      if (res?.success) {
        message.success('Email undangan portal berhasil dikirim ulang ke kandidat!');
      } else {
        message.error(res?.message || 'Gagal mengirim email portal');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Gagal mengirim email');
    }
  };

  const handleConvertToEmployee = async (applicant) => {
    try {
      const res = await jobService.convertToEmployee(applicant.id);
      if (res?.success) {
        message.success(res.message || 'Pelamar berhasil dijadikan Karyawan aktif!');
        fetchApplicants(pagination.current, pagination.pageSize, search, statusFilter, jobFilter);
        if (selectedApplicant?.id === applicant.id) {
          setDetailModalVisible(false);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Gagal mengonversi ke karyawan');
    }
  };

  const columns = [
    {
      title: 'Pelamar',
      key: 'candidate',
      render: (_, record) => {
        const photoUrl = record.photo_path ? getAssetUrl(record.photo_path) : null;
        return (
          <Space align="start" size={12}>
            <Avatar
              size={46}
              src={photoUrl}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Text strong style={{ fontSize: 14 }}>
                  {record.full_name}
                </Text>
                {record.application_code && (
                  <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', lineHeight: '18px' }}>
                    {record.application_code}
                  </Tag>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>
                <MailOutlined style={{ marginRight: 4 }} />
                {record.email}
              </div>
              <div style={{ fontSize: 12, color: '#595959' }}>
                <PhoneOutlined style={{ marginRight: 4 }} />
                {record.phone}
              </div>
              {record.nik && (
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                  NIK: <strong>{record.nik}</strong>
                </div>
              )}
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Posisi Dilamar',
      key: 'job',
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>{record.job_title}</Text>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.job_department}</div>
          <Tag color="cyan" style={{ marginTop: 4 }}>{record.job_type || 'Full-time'}</Tag>
        </div>
      ),
    },
    {
      title: 'Status Seleksi & Approval',
      key: 'status_col',
      render: (_, record) => {
        const hireStatus = record.hire_approval_status;
        return (
          <div>
            <Space size={4} style={{ marginBottom: 6 }}>
              <Select
                size="small"
                value={record.status || 'applied'}
                style={{ width: 170 }}
                onChange={(newVal) => handleOpenStageModal(record, newVal)}
              >
                {APPLICANT_STATUS_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    <Tag color={opt.color} style={{ marginRight: 0, fontSize: 11 }}>
                      {opt.label}
                    </Tag>
                  </Option>
                ))}
              </Select>
              <Tooltip title="Edit Catatan / Jadwal Tahapan (Tampil di Portal Kandidat)">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenStageModal(record, record.status)}
                />
              </Tooltip>
            </Space>

            {record.stage_notes && (
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, maxWidth: 200 }}>
                <Text type="secondary" ellipsis={{ tooltip: record.stage_notes }} style={{ fontSize: 11 }}>
                  Catatan HR: {record.stage_notes}
                </Text>
              </div>
            )}

            {hireStatus === 'pending' && (
              <div>
                <Tag color="volcano" style={{ fontSize: 11 }}>
                  Approval Hiring: Step {record.current_hire_step || 1} / {record.total_hire_steps || 3}
                </Tag>
              </div>
            )}
            {hireStatus === 'approved' && (
              <div>
                <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 11 }}>
                  Hiring Disetujui Direksi
                </Tag>
              </div>
            )}
            {hireStatus === 'rejected' && (
              <div>
                <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 11 }}>
                  Hiring Ditolak
                </Tag>
              </div>
            )}
            {record.biodata_completed_at && (
              <div>
                <Tag color="green" icon={<SafetyCertificateOutlined />} style={{ fontSize: 10, marginTop: 4 }}>
                  Form Pelamar Selesai
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Dokumen & Portal',
      key: 'portal_docs',
      render: (_, record) => {
        const cvUrl = record.cv_path ? getAssetUrl(record.cv_path) : null;
        return (
          <Space direction="vertical" size={4}>
            {cvUrl && (
              <Button
                type="link"
                size="small"
                icon={<FilePdfOutlined style={{ color: '#ff4d4f' }} />}
                href={cvUrl}
                target="_blank"
                rel="noreferrer"
                style={{ padding: 0, fontSize: 12 }}
              >
                Unduh CV / Resume
              </Button>
            )}

            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined style={{ color: '#0284c7' }} />}
              onClick={() => {
                setFormApplicant(record);
                setOfficialModalVisible(true);
              }}
              style={{ padding: 0, fontSize: 12, fontWeight: 600 }}
            >
              Lihat Form Pelamar
            </Button>

            <Button
              type="link"
              size="small"
              icon={<PrinterOutlined style={{ color: '#7c3aed' }} />}
              onClick={() => {
                setContractApplicant(record);
                setOfferingModalVisible(true);
              }}
              style={{ padding: 0, fontSize: 12, fontWeight: 600, color: '#7c3aed' }}
            >
              Cetak Offering / PKWT
            </Button>

            {record.portal_token ? (
              <Space size={8} wrap>
                <Button
                  type="link"
                  size="small"
                  icon={<SendOutlined style={{ color: '#d97706' }} />}
                  onClick={() => handleResendPortalEmail(record.id)}
                  style={{ padding: 0, fontSize: 11, color: '#d97706' }}
                >
                  Kirim Email
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<CopyOutlined style={{ color: '#16a34a' }} />}
                  onClick={() => handleCopyPortalLink(record.portal_token)}
                  style={{ padding: 0, fontSize: 11, color: '#16a34a' }}
                >
                  Salin Link
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<MessageOutlined style={{ color: '#25D366' }} />}
                  onClick={() => handleOpenWhatsApp(record)}
                  style={{ padding: 0, fontSize: 11, color: '#25D366' }}
                >
                  WhatsApp
                </Button>
              </Space>
            ) : (
              <Space size={8} wrap>
                <Button
                  type="link"
                  size="small"
                  icon={<SendOutlined style={{ color: '#0284c7' }} />}
                  onClick={() => handleOpenStageModal(record, 'portal_invited')}
                  style={{ padding: 0, fontSize: 11 }}
                >
                  Undang ke Portal
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<MessageOutlined style={{ color: '#25D366' }} />}
                  onClick={() => handleOpenWhatsApp(record)}
                  style={{ padding: 0, fontSize: 11, color: '#25D366' }}
                >
                  WhatsApp
                </Button>
              </Space>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Aksi HR',
      key: 'action',
      render: (_, record) => {
        const isHired = record.status === 'hired' || record.hired_user_id;
        const canRequestHire = !isHired && record.hire_approval_status !== 'pending' && record.hire_approval_status !== 'approved';

        return (
          <Space direction="vertical" size={4}>
            <Space size={4}>
              <Tooltip title="Lihat detail pelamar">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setSelectedApplicant(record);
                    setDetailModalVisible(true);
                  }}
                />
              </Tooltip>

              {canRequestHire && (
                <Tooltip title="Ajukan Persetujuan Hiring ke User/Manager/Direktur">
                  <Button
                    size="small"
                    type="primary"
                    icon={<SafetyCertificateOutlined />}
                    style={{ background: '#0284c7', borderColor: '#0284c7' }}
                    onClick={() => {
                      setHireApplicant(record);
                      setHiringModalVisible(true);
                    }}
                  >
                    Ajukan Hiring
                  </Button>
                </Tooltip>
              )}
            </Space>

            {isHired ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Karyawan #{record.hired_user_id || 'Aktif'}
              </Tag>
            ) : (
              <Popconfirm
                title="Konversi Pelamar ke Karyawan"
                description={`Jadikan ${record.full_name} sebagai karyawan resmi di sistem backoffice? NIP dan akun dibuat otomatis.`}
                onConfirm={() => handleConvertToEmployee(record)}
                okText="Ya, Jadikan Karyawan"
                cancelText="Batal"
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<UserAddOutlined />}
                  style={{ background: '#16a34a', borderColor: '#16a34a', width: '100%', fontSize: 11 }}
                >
                  Jadikan Karyawan
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const totalCount = pagination.total || applicants.length;
  const hiredCount = applicants.filter((a) => a.status === 'hired' || a.hired_user_id).length;
  const pendingHireCount = applicants.filter((a) => a.hire_approval_status === 'pending').length;
  const completedFormsCount = applicants.filter((a) => a.biodata_completed_at).length;

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TeamOutlined style={{ color: '#1890ff' }} />
              Data Pelamar Kerja & Manajemen Rekrutmen
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportExcel}
                style={{ borderColor: '#52c41a', color: '#52c41a' }}
              >
                Export Excel / CSV
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchApplicants(pagination.current, pagination.pageSize, search, statusFilter, jobFilter)}
              >
                Segarkan
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} style={{ background: '#f0f5ff', borderRadius: 8 }}>
            <Statistic title="Total Pelamar Masuk" value={totalCount} valueStyle={{ color: '#1d39c4' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
            <Statistic title="Form Pelamar Selesai" value={completedFormsCount} valueStyle={{ color: '#389e0d' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} style={{ background: '#fff7e6', borderRadius: 8 }}>
            <Statistic title="Menunggu Approval Hiring" value={pendingHireCount} valueStyle={{ color: '#d46b08' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} style={{ background: '#e6fffb', borderRadius: 8 }}>
            <Statistic title="Diterima (Hired)" value={hiredCount} valueStyle={{ color: '#08979c' }} />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Filter Bar */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle">
          <Col xs={24} sm={10} md={9}>
            <Input
              placeholder="Cari pelamar..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => fetchApplicants(1, pagination.pageSize, search, statusFilter, jobFilter)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={8} md={8}>
            <Select
              style={{ width: '100%' }}
              value={jobFilter}
              onChange={(val) => {
                setJobFilter(val);
                fetchApplicants(1, pagination.pageSize, search, statusFilter, val);
              }}
            >
              <Option value="all">Semua Posisi Lowongan</Option>
              {jobs.map((j) => (
                <Option key={j.id} value={j.id}>
                  {j.title}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                fetchApplicants(1, pagination.pageSize, search, val, jobFilter);
              }}
            >
              <Option value="all">Semua Status</Option>
              {APPLICANT_STATUS_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={2} md={2}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchApplicants(1, pagination.pageSize, search, statusFilter, jobFilter)}
              style={{ width: '100%' }}
            >
              Filter
            </Button>
          </Col>
        </Row>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={applicants}
          scroll={{ x: 1050 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} pelamar`,
            onChange: (page, pageSize) => fetchApplicants(page, pageSize, search, statusFilter, jobFilter),
          }}
        />
      </Card>

      {/* Modal Detail Pelamar */}
      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>Detail Pelamar: {selectedApplicant?.full_name}</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Tutup
          </Button>,
          selectedApplicant && (
            <Button
              key="view_form"
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => {
                setFormApplicant(selectedApplicant);
                setOfficialModalVisible(true);
              }}
            >
              Buka Form Pelamar
            </Button>
          ),
        ]}
        width={720}
      >
        {selectedApplicant && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <Avatar
                size={64}
                src={selectedApplicant.photo_path ? getAssetUrl(selectedApplicant.photo_path) : null}
                icon={<UserOutlined />}
              />
              <div>
                <Title level={5} style={{ margin: 0 }}>{selectedApplicant.full_name}</Title>
                <Text type="secondary">Melamar untuk posisi: <strong>{selectedApplicant.job_title}</strong></Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="blue">{selectedApplicant.job_department}</Tag>
                  <Tag color="cyan">{selectedApplicant.job_type || 'Full-time'}</Tag>
                  {selectedApplicant.application_code && (
                    <Tag color="purple">{selectedApplicant.application_code}</Tag>
                  )}
                </div>
              </div>
            </div>

            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="NIK / No. KTP"><strong>{selectedApplicant.nik || '-'}</strong></Descriptions.Item>
              <Descriptions.Item label="Email">{selectedApplicant.email}</Descriptions.Item>
              <Descriptions.Item label="Nomor Telepon/WA">{selectedApplicant.phone}</Descriptions.Item>
              <Descriptions.Item label="Kota Domisili">{selectedApplicant.city || '-'}</Descriptions.Item>
              <Descriptions.Item label="Tanggal Lahir">
                {selectedApplicant.birth_date ? dayjs(selectedApplicant.birth_date).format('DD MMMM YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Pendidikan Terakhir">{selectedApplicant.education || '-'}</Descriptions.Item>
              <Descriptions.Item label="Pengalaman Kerja">{selectedApplicant.experience_years || 0} Tahun</Descriptions.Item>
              <Descriptions.Item label="Ekspektasi Gaji">
                {selectedApplicant.expected_salary
                  ? `Rp ${Number(selectedApplicant.expected_salary).toLocaleString('id-ID')}`
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedApplicant.cover_letter && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Surat Lamaran / Cover Letter:</Text>
                <Paragraph
                  style={{
                    background: '#f9f9f9',
                    padding: 12,
                    borderRadius: 6,
                    marginTop: 6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedApplicant.cover_letter}
                </Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Official Form Pelamar Modal */}
      <OfficialApplicationModal
        visible={officialModalVisible}
        onClose={() => setOfficialModalVisible(false)}
        applicantId={formApplicant?.id}
        applicantName={formApplicant?.full_name}
      />

      {/* Hiring Approval Request Modal */}
      <HiringRequestModal
        visible={hiringModalVisible}
        onClose={() => setHiringModalVisible(false)}
        applicant={hireApplicant}
        onSuccess={() => fetchApplicants(pagination.current, pagination.pageSize, search, statusFilter, jobFilter)}
      />

      {/* Offering Letter & PKWT Contract Generator Modal */}
      <OfferingContractModal
        visible={offeringModalVisible}
        onClose={() => setOfferingModalVisible(false)}
        applicant={contractApplicant}
      />

      {/* Stage & HR Notes Modal (Live Sync to Candidate Portal) */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#0284c7' }} />
            <span>Update Tahap Seleksi & Catatan Portal Kandidat</span>
          </Space>
        }
        open={stageModalVisible}
        onCancel={() => setStageModalVisible(false)}
        onOk={handleConfirmStageUpdate}
        okText="Simpan & Kirim Update"
        cancelText="Batal"
        confirmLoading={updatingStage}
      >
        {stageTargetApplicant && (
          <div>
            <p style={{ marginBottom: 12, fontSize: 13 }}>
              Kandidat: <strong>{stageTargetApplicant.full_name}</strong> ({stageTargetApplicant.job_title})
            </p>
            <div style={{ marginBottom: 14 }}>
              <Text strong>Pilih Tahap Seleksi (Lifecycle State):</Text>
              <Select
                value={pendingStageValue}
                onChange={setPendingStageValue}
                style={{ width: '100%', marginTop: 6 }}
              >
                {APPLICANT_STATUS_OPTIONS.map((opt) => {
                  const isBlocked = opt.value === 'hired' || opt.value === 'pending_hire_approval';
                  return (
                    <Option key={opt.value} value={opt.value} disabled={isBlocked}>
                      <Tag color={opt.color}>{opt.label} {isBlocked ? '(Wajib via Alur Approval)' : ''}</Tag>
                    </Option>
                  );
                })}
              </Select>
            </div>
            <div>
              <Text strong>Pesan / Instruksi HR untuk Kandidat (Tampil Live di Portal):</Text>
              <TextArea
                rows={4}
                value={stageNotesText}
                onChange={(e) => setStageNotesText(e.target.value)}
                placeholder="Tuliskan catatan tahapan / jadwal wawancara..."
                style={{ marginTop: 6 }}
              />
              </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
