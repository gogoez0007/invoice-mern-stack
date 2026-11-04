import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  Popconfirm,
  Typography,
  Tag,
  Badge,
  Row,
  Col,
  Statistic,
  Drawer,
  Avatar,
  Tooltip,
  Divider,
  Empty,
  message,
} from 'antd';
import {
  SolutionOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  FilePdfOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  EyeOutlined,
  GlobalOutlined,
  UserAddOutlined,
  IdcardOutlined,
  LinkOutlined,
  SendOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useResponsive from '@/hooks/useResponsive';
import { jobService, getAssetUrl } from '@/request/jobService';
import OfficialApplicationModal from './OfficialApplicationModal';
import HiringRequestModal from './HiringRequestModal';
import OfferingContractModal from './OfferingContractModal';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'pending_approval', label: 'Menunggu Approval', color: 'orange' },
  { value: 'published', label: 'Published (Tayang)', color: 'success' },
  { value: 'rejected', label: 'Ditolak / Revisi', color: 'error' },
  { value: 'archived', label: 'Archived (Arsip)', color: 'warning' },
];

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

export default function RecruitmentJobsPage() {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');

  // Create / Edit Job Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form] = Form.useForm();

  // Applicants Drawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Official Form Pelamar Modal & Hiring Modal inside Drawer
  const [officialModalVisible, setOfficialModalVisible] = useState(false);
  const [formApplicant, setFormApplicant] = useState(null);
  const [hiringModalVisible, setHiringModalVisible] = useState(false);
  const [hireApplicant, setHireApplicant] = useState(null);
  const [offeringModalVisible, setOfferingModalVisible] = useState(false);
  const [contractApplicant, setContractApplicant] = useState(null);

  const isJobExpired = (endDateStr) => {
    if (!endDateStr) return false;
    return dayjs().startOf('day').isAfter(dayjs(endDateStr).endOf('day'));
  };

  const fetchJobs = async (
    page = 1,
    pageSize = 10,
    q = search,
    status = statusFilter,
    job_type = jobTypeFilter
  ) => {
    setLoading(true);
    try {
      const res = await jobService.getJobs({
        page,
        limit: pageSize,
        q: q ? q.trim() : undefined,
        status: status !== 'all' ? status : undefined,
        job_type: job_type !== 'all' ? job_type : undefined,
      });

      if (res?.success) {
        const jobList = res.result || res.data || [];
        setJobs(jobList);
        setPagination({
          current: res.pagination?.page || page,
          pageSize: res.pagination?.limit || pageSize,
          total: res.pagination?.total || 0,
        });
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      message.error('Gagal memuat daftar lowongan: ' + (err.response?.data?.message || err.message));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1, pagination.pageSize, search, statusFilter, jobTypeFilter);
  }, []);

  const handleOpenCreate = () => {
    setEditingJob(null);
    form.resetFields();
    form.setFieldsValue({
      job_type: 'Full-time',
      status: 'pending_approval',
      location: 'Jakarta Utara',
      start_date: dayjs(),
      end_date: dayjs().add(30, 'day'),
    });
    setModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    setEditingJob(record);
    const reqText = Array.isArray(record.requirements)
      ? record.requirements.join('\n')
      : record.requirements || '';

    form.setFieldsValue({
      title: record.title,
      department: record.department,
      job_type: record.job_type || 'Full-time',
      location: record.location,
      description: record.description,
      requirements_text: reqText,
      start_date: record.start_date ? dayjs(record.start_date) : dayjs(),
      end_date: record.end_date ? dayjs(record.end_date) : dayjs().add(30, 'day'),
      status: record.status || 'draft',
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await jobService.deleteJob(id);
      if (res?.success) {
        message.success('Lowongan kerja berhasil dihapus');
        fetchJobs(pagination.current, pagination.pageSize);
      }
    } catch (err) {
      message.error('Gagal menghapus lowongan: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmitForApproval = async (id) => {
    try {
      const res = await jobService.submitForApproval(id);
      if (res?.success) {
        message.success(res.message || 'Lowongan kerja berhasil diajukan untuk persetujuan multi-level');
        fetchJobs(pagination.current, pagination.pageSize);
      }
    } catch (err) {
      message.error('Gagal mengajukan approval: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const requirementsArray = (values.requirements_text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const payload = {
        title: values.title,
        department: values.department,
        job_type: values.job_type,
        location: values.location,
        description: values.description,
        requirements: requirementsArray,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        status: values.status,
      };

      if (editingJob) {
        const res = await jobService.updateJob(editingJob.id, payload);
        if (res?.success) {
          message.success('Lowongan kerja berhasil diperbarui');
          setModalVisible(false);
          fetchJobs(pagination.current, pagination.pageSize);
        }
      } else {
        const res = await jobService.createJob(payload);
        if (res?.success) {
          message.success('Lowongan kerja baru berhasil ditambahkan');
          setModalVisible(false);
          fetchJobs(1, pagination.pageSize);
        }
      }
    } catch (err) {
      if (err?.errorFields) return;
      message.error('Gagal menyimpan lowongan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenApplicants = async (jobRecord) => {
    setSelectedJobForApplicants(jobRecord);
    setDrawerVisible(true);
    setLoadingApplicants(true);
    try {
      const res = await jobService.getJobApplicants(jobRecord.id);
      if (res?.success) {
        setApplicants(res.data || []);
      } else {
        setApplicants([]);
      }
    } catch (err) {
      message.error('Gagal memuat daftar pelamar: ' + (err.response?.data?.message || err.message));
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateApplicantStatus = async (applicantId, newStatus) => {
    try {
      const res = await jobService.updateApplicantStatus(applicantId, { status: newStatus });
      if (res?.success) {
        message.success('Status pelamar diperbarui');
        if (selectedJobForApplicants) {
          const refreshed = await jobService.getJobApplicants(selectedJobForApplicants.id);
          if (refreshed?.success) setApplicants(refreshed.data || []);
        }
      }
    } catch (err) {
      message.error('Gagal mengubah status pelamar');
    }
  };

  const handleConvertToEmployee = async (applicant) => {
    try {
      const res = await jobService.convertToEmployee(applicant.id);
      if (res?.success) {
        message.success(res.message || 'Pelamar berhasil dijadikan Karyawan!');
        if (selectedJobForApplicants) {
          const refreshed = await jobService.getJobApplicants(selectedJobForApplicants.id);
          if (refreshed?.success) setApplicants(refreshed.data || []);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Gagal mengonversi ke karyawan');
    }
  };

  // Summary metrics
  const totalJobs = pagination.total || jobs.length;
  const activePublishedCount = jobs.filter(
    (j) => j.status === 'published' && !isJobExpired(j.end_date)
  ).length;
  const expiredCount = jobs.filter((j) => isJobExpired(j.end_date)).length;
  const totalApplicantsCount = jobs.reduce((acc, j) => acc + Number(j.applicant_count || 0), 0);

  const columns = [
    {
      title: 'Judul Pekerjaan',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 15, display: 'block' }}>
            {text}
          </Text>
          <Space size={6} wrap style={{ marginTop: 4 }}>
            <Tag color="blue">{record.job_type || 'Full-time'}</Tag>
            {record.location && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {record.location}
              </Text>
            )}
          </Space>
        </div>
      ),
    },
    {
      title: 'Divisi',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => dept || <Text type="secondary">-</Text>,
    },
    {
      title: 'Tanggal Mulai',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <span>{date ? dayjs(date).format('DD MMM YYYY') : '-'}</span>
        </Space>
      ),
    },
    {
      title: 'Tanggal Berakhir',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date, record) => {
        const expired = isJobExpired(date);
        return (
          <Space direction="vertical" size={2}>
            <Space size={4}>
              <CalendarOutlined style={{ color: expired ? '#ff4d4f' : '#8c8c8c' }} />
              <Text type={expired ? 'danger' : undefined} strong={expired}>
                {date ? dayjs(date).format('DD MMM YYYY') : '-'}
              </Text>
            </Space>
            {expired && (
              <Tag color="error" icon={<StopOutlined />} style={{ margin: 0 }}>
                Expired
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Status & Approval',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const expired = isJobExpired(record.end_date);
        const statusObj = STATUS_OPTIONS.find((s) => s.value === status) || {
          label: status,
          color: 'default',
        };
        const approvalStatus = record.approval_status;
        return (
          <Space direction="vertical" size={4}>
            <Tag
              color={statusObj.color}
              icon={
                status === 'published' ? (
                  <CheckCircleOutlined />
                ) : (
                  <ClockCircleOutlined />
                )
              }
            >
              {statusObj.label.toUpperCase()}
            </Tag>
            {approvalStatus === 'pending' && (
              <Tag color="volcano" style={{ fontSize: 11, margin: 0 }}>
                Approval Step {record.current_approval_step || 1}/{record.total_approval_steps || 2}
              </Tag>
            )}
            {approvalStatus === 'approved' && record.approved_by && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Approved by: <strong>{record.approved_by}</strong>
              </Text>
            )}
            {approvalStatus === 'rejected' && (
              <Tooltip title={record.approval_notes || 'Ditolak oleh Approver'}>
                <Tag color="error" style={{ fontSize: 11, margin: 0 }}>
                  Ditolak: {record.approval_notes ? record.approval_notes.slice(0, 24) + '...' : 'Perlu Revisi'}
                </Tag>
              </Tooltip>
            )}
            {expired ? (
              <Badge status="error" text={<Text type="danger" style={{ fontSize: 12 }}>Nonaktif di WP (Expired)</Text>} />
            ) : status === 'published' ? (
              <Badge status="processing" text={<Text type="success" style={{ fontSize: 12 }}>Tayang di WP Career</Text>} />
            ) : null}
          </Space>
        );
      },
    },
    {
      title: 'Pelamar',
      key: 'applicants',
      align: 'center',
      render: (_, record) => (
        <Button
          type="dashed"
          size="small"
          icon={<TeamOutlined />}
          onClick={() => handleOpenApplicants(record)}
        >
          {record.applicant_count || 0} Pelamar
        </Button>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      align: 'right',
      render: (_, record) => {
        const canSubmitApproval =
          record.status === 'draft' ||
          record.status === 'rejected' ||
          record.approval_status === 'draft' ||
          record.approval_status === 'rejected';
        return (
          <Space size="small" wrap>
            {canSubmitApproval && (
              <Popconfirm
                title="Ajukan Persetujuan Lowongan?"
                description="Lowongan akan dikirim ke antrean Multi-Level Approval sebelum tayang di website."
                onConfirm={() => handleSubmitForApproval(record.id)}
                okText="Ya, Ajukan"
                cancelText="Batal"
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<SendOutlined />}
                  style={{ background: '#d97706', borderColor: '#d97706' }}
                >
                  Ajukan Approval
                </Button>
              </Popconfirm>
            )}
            <Tooltip title="Edit Lowongan">
              <Button
                type="primary"
                ghost
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(record)}
              >
                Edit
              </Button>
            </Tooltip>
            <Popconfirm
              title="Hapus Lowongan Kerja?"
              description="Data lowongan dan pelamar terkait akan ikut terhapus."
              onConfirm={() => handleDelete(record.id)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                Hapus
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col>
          <Space align="center" size={12}>
            <SolutionOutlined style={{ fontSize: 28, color: '#1677ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              Manajemen Lowongan Kerja
            </Title>
          </Space>
        </Col>
        <Col>
          <Space wrap>
            <Button
              icon={<GlobalOutlined />}
              href={
                window.location.hostname.includes('delmargroup.co.id')
                  ? 'https://staging-wp.delmargroup.co.id/career/?refresh_jobs=1'
                  : 'http://localhost/delmargroup/career/?refresh_jobs=1'
              }
              target="_blank"
            >
              Lihat Halaman Career WP
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchJobs(pagination.current, pagination.pageSize)}
            >
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              Buat Lowongan Baru
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Lowongan" value={totalJobs} prefix={<SolutionOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Tayang Aktif (Published)"
              value={activePublishedCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Melewati Batas (Expired)"
              value={expiredCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Lamaran Masuk"
              value={totalApplicantsCount}
              valueStyle={{ color: '#1677ff' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter & Table Card */}
      <Card>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Cari posisi, divisi, lokasi..."
              prefix={<SearchOutlined />}
              value={search}
              allowClear
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => fetchJobs(1, pagination.pageSize, search, statusFilter, jobTypeFilter)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                fetchJobs(1, pagination.pageSize, search, val, jobTypeFilter);
              }}
            >
              <Option value="all">Semua Status</Option>
              <Option value="published">Published (Tayang)</Option>
              <Option value="pending_approval">Menunggu Approval</Option>
              <Option value="draft">Draft</Option>
              <Option value="rejected">Ditolak / Revisi</Option>
              <Option value="archived">Archived</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={jobTypeFilter}
              onChange={(val) => {
                setJobTypeFilter(val);
                fetchJobs(1, pagination.pageSize, search, statusFilter, val);
              }}
            >
              <Option value="all">Semua Tipe</Option>
              {JOB_TYPES.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={2} md={4}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchJobs(1, pagination.pageSize, search, statusFilter, jobTypeFilter)}
            >
              Filter
            </Button>
          </Col>
        </Row>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={jobs}
          scroll={{ x: 850 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} lowongan`,
            onChange: (page, pageSize) => fetchJobs(page, pageSize),
          }}
        />
      </Card>

      {/* Modal Buat / Edit Lowongan */}
      <Modal
        title={editingJob ? `Edit Lowongan: ${editingJob.title}` : 'Buat Lowongan Kerja Baru'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingJob ? 'Simpan Perubahan' : 'Terbitkan / Simpan'}
        cancelText="Batal"
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={14}>
              <Form.Item
                name="title"
                label="Judul Pekerjaan (Title)"
                rules={[{ required: true, message: 'Judul pekerjaan wajib diisi' }]}
              >
                <Input placeholder="Judul posisi lowongan" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item
                name="department"
                label="Departemen / Divisi"
                rules={[{ required: true, message: 'Departemen wajib diisi' }]}
              >
                <Input placeholder="Departemen / divisi" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="job_type"
                label="Jenis Pekerjaan"
                rules={[{ required: true, message: 'Pilih jenis pekerjaan' }]}
              >
                <Select>
                  {JOB_TYPES.map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="location"
                label="Lokasi Penempatan"
                rules={[{ required: true, message: 'Lokasi penempatan wajib diisi' }]}
              >
                <Input placeholder="Lokasi penempatan" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="status"
                label="Status Publikasi"
                rules={[{ required: true, message: 'Pilih status lowongan' }]}
              >
                <Select>
                  {STATUS_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="start_date"
                label="Tanggal Mulai Tayang (Start Date)"
                rules={[{ required: true, message: 'Tanggal mulai wajib diisi' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="end_date"
                label="Tanggal Berakhir (End Date / Expired)"
                dependencies={['start_date']}
                rules={[
                  { required: true, message: 'Tanggal berakhir (end_date) wajib diisi' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('start_date');
                      if (!value || !startDate) {
                        return Promise.resolve();
                      }
                      if (value.isBefore(startDate, 'day')) {
                        return Promise.reject(
                          new Error('Tanggal berakhir (end_date) tidak boleh lebih awal dari tanggal mulai (start_date)')
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Deskripsi Pekerjaan (Job Description)"
            rules={[{ required: true, message: 'Deskripsi pekerjaan wajib diisi' }]}
          >
            <TextArea
              rows={4}
              placeholder="Deskripsi pekerjaan..."
            />
          </Form.Item>

          <Form.Item
            name="requirements_text"
            label="Persyaratan / Kualifikasi (Satu persyaratan per baris)"
            rules={[{ required: true, message: 'Minimal satu persyaratan wajib diisi' }]}
          >
            <TextArea
              rows={5}
              placeholder="Persyaratan kualifikasi (satu per baris)..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer Daftar Pelamar */}
      <Drawer
        title={
          selectedJobForApplicants
            ? `Daftar Pelamar: ${selectedJobForApplicants.title}`
            : 'Daftar Pelamar'
        }
        width={isMobile ? '100%' : 760}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {loadingApplicants ? (
          <Card loading />
        ) : applicants.length === 0 ? (
          <Empty description="Belum ada pelamar untuk lowongan ini" />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {applicants.map((app) => (
              <Card key={app.id} size="small" hoverable>
                <Row gutter={[16, 12]} align="middle">
                  <Col xs={24} sm={14}>
                    <Space align="start" size={12}>
                      <Avatar
                        size={56}
                        src={app.photo_url || app.photo_path ? getAssetUrl(app.photo_url || app.photo_path) : undefined}
                        icon={<UserOutlined />}
                      />
                      <div>
                        <Space align="center" size={8}>
                          <Text strong style={{ fontSize: 16 }}>
                            {app.full_name}
                          </Text>
                          {app.hired_user_id ? (
                            <Tag color="green" icon={<CheckCircleOutlined />}>
                              Karyawan (ID #{app.hired_user_id})
                            </Tag>
                          ) : null}
                        </Space>
                        <div style={{ fontSize: 13, color: '#595959' }}>{app.email}</div>
                        <div style={{ fontSize: 13, color: '#595959' }}>
                          Telp/WA: {app.phone || '-'} {app.city ? `• Domisili: ${app.city}` : ''}
                        </div>
                        <div style={{ fontSize: 13, color: '#595959' }}>
                          Pendidikan: {app.education || '-'} {app.major ? `(${app.major})` : ''} • {app.experience_years || 0} thn pengalaman
                        </div>
                        {app.expected_salary && (
                          <div style={{ fontSize: 12, color: '#1677ff' }}>
                            Ekspektasi Gaji: Rp {Number(app.expected_salary).toLocaleString('id-ID')}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                          Melamar pada: {dayjs(app.created_at).format('DD MMM YYYY HH:mm')}
                        </div>
                      </div>
                    </Space>
                  </Col>
                  <Col xs={24} sm={10} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Select
                        size="small"
                        value={app.status || 'applied'}
                        style={{ width: '100%' }}
                        onChange={(val) => handleUpdateApplicantStatus(app.id, val)}
                      >
                        {APPLICANT_STATUS_OPTIONS.map((opt) => {
                          const isBlocked = opt.value === 'hired' || opt.value === 'pending_hire_approval';
                          return (
                            <Option key={opt.value} value={opt.value} disabled={isBlocked}>
                              {opt.label} {isBlocked ? '(Alur Approval)' : ''}
                            </Option>
                          );
                        })}
                      </Select>
                      <Space wrap>
                        {(app.cv_url || app.cv_path) && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<FilePdfOutlined />}
                            href={getAssetUrl(app.cv_url || app.cv_path)}
                            target="_blank"
                          >
                            Lihat / Unduh CV
                          </Button>
                        )}
                        <Button
                          size="small"
                          icon={<FileTextOutlined style={{ color: '#0284c7' }} />}
                          onClick={() => {
                            setFormApplicant(app);
                            setOfficialModalVisible(true);
                          }}
                        >
                          Form Pelamar
                        </Button>
                        <Button
                          size="small"
                          icon={<PrinterOutlined style={{ color: '#7c3aed' }} />}
                          onClick={() => {
                            setContractApplicant(app);
                            setOfferingModalVisible(true);
                          }}
                        >
                          Offering / PKWT
                        </Button>
                        {(app.photo_url || app.photo_path) && (
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            href={getAssetUrl(app.photo_url || app.photo_path)}
                            target="_blank"
                          >
                            Foto
                          </Button>
                        )}
                        {app.portfolio_url && (
                          <Button
                            size="small"
                            icon={<LinkOutlined />}
                            href={app.portfolio_url.startsWith('http') ? app.portfolio_url : `https://${app.portfolio_url}`}
                            target="_blank"
                          >
                            Portofolio
                          </Button>
                        )}
                        {!app.hired_user_id && app.hire_approval_status !== 'pending' && (
                          <Button
                            type="primary"
                            size="small"
                            style={{ background: '#0284c7', borderColor: '#0284c7' }}
                            icon={<SafetyCertificateOutlined />}
                            onClick={() => {
                              setHireApplicant(app);
                              setHiringModalVisible(true);
                            }}
                          >
                            Ajukan Hiring
                          </Button>
                        )}
                        {!app.hired_user_id && (
                          <Popconfirm
                            title="Konversi Menjadi Karyawan?"
                            description="Data pelamar ini akan otomatis ditambahkan ke master users, profil pribadi, dan kepegawaian (PKWT)."
                            onConfirm={() => handleConvertToEmployee(app)}
                            okText="Ya, Jadikan Karyawan"
                            cancelText="Batal"
                          >
                            <Button
                              type="primary"
                              size="small"
                              style={{ background: '#52c41a', borderColor: '#52c41a' }}
                              icon={<UserAddOutlined />}
                            >
                              Jadikan Karyawan
                            </Button>
                          </Popconfirm>
                        )}
                      </Space>
                    </Space>
                  </Col>
                </Row>
                {app.cover_letter && (
                  <>
                    <Divider style={{ margin: '10px 0' }} />
                    <Paragraph
                      type="secondary"
                      style={{ marginBottom: 0, fontSize: 13, whiteSpace: 'pre-line' }}
                    >
                      <Text strong>Ringkasan / Cover Letter: </Text>
                      {app.cover_letter}
                    </Paragraph>
                  </>
                )}
              </Card>
            ))}
          </Space>
        )}
      </Drawer>

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
        onSuccess={() => {
          if (selectedJobForApplicants) {
            handleOpenApplicants(selectedJobForApplicants);
          }
        }}
      />

      {/* Offering Letter & PKWT Contract Generator Modal */}
      <OfferingContractModal
        visible={offeringModalVisible}
        onClose={() => setOfferingModalVisible(false)}
        applicant={contractApplicant}
      />
    </div>
  );
}

