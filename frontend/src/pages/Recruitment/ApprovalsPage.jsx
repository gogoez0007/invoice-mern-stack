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
  message,
  Row,
  Col,
  Statistic,
  Descriptions,
  Badge,
  Tabs,
  Tooltip,
  Form,
  Select,
  Popconfirm,
  Divider,
  Alert,
  Steps,
  Timeline,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckOutlined,
  StopOutlined,
  AuditOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  MailOutlined,
  SendOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  PrinterOutlined,
  LockOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { jobService } from '@/request/jobService';
import OfficialApplicationModal from './OfficialApplicationModal';
import OfferingContractModal from './OfferingContractModal';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function RecruitmentApprovalsPage() {
  const currentAdmin = useSelector(selectCurrentAdmin);
  const actualRoleCode =
    currentAdmin?.role_group?.code ||
    (currentAdmin?.username === 'taufik3301' ? 'SUPER_ADMIN' : 'HR_OFFICER');
  const isSuperAdmin = actualRoleCode === 'SUPER_ADMIN' || currentAdmin?.username === 'taufik3301';

  const effectiveRole = actualRoleCode;
  const approverDisplayName = `${currentAdmin?.name || currentAdmin?.username || 'Approver'} (${effectiveRole})`;

  const [activeTab, setActiveTab] = useState('job_approvals');
  const [loading, setLoading] = useState(false);

  // Tab 1: Job Approvals
  const [pendingJobs, setPendingJobs] = useState([]);

  // Tab 2: Candidate Hire Approvals
  const [pendingHires, setPendingHires] = useState([]);

  // Modals
  const [officialModalVisible, setOfficialModalVisible] = useState(false);
  const [targetApplicant, setTargetApplicant] = useState(null);

  // Offering Letter & PKWT Generator Modal
  const [offeringModalVisible, setOfferingModalVisible] = useState(false);
  const [contractApplicant, setContractApplicant] = useState(null);

  // Approval Step History Modal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyTitle, setHistoryTitle] = useState('');
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Action Modal (Job or Hire Approval)
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionTarget, setActionTarget] = useState(null); // job or applicant
  const [actionEntityType, setActionEntityType] = useState('job'); // 'job' | 'hire'
  const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject'
  const [actionNotes, setActionNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingJobsRes, pendingHiresRes] = await Promise.all([
        jobService.getPendingApprovals(),
        jobService.getPendingHireApprovals(),
      ]);

      if (pendingJobsRes?.success) {
        setPendingJobs(pendingJobsRes.result || pendingJobsRes.data || []);
      }
      if (pendingHiresRes?.success) {
        setPendingHires(pendingHiresRes.result || pendingHiresRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching approvals data:', err);
      message.error('Gagal memuat data persetujuan: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check Role-Based Authorization for Job Approval Step
  const canApproveJobStep = (record) => {
    if (effectiveRole === 'SUPER_ADMIN') return { allowed: true };
    const step = Number(record.current_approval_step || 1);
    if (step === 1) {
      const ok = ['HR_OFFICER', 'HR_NUSEA'].includes(effectiveRole);
      return {
        allowed: ok,
        requiredLabel: 'HR Supervisor / HR Officer',
      };
    }
    const ok = ['HR_OFFICER', 'REVIEWER'].includes(effectiveRole);
    return {
      allowed: ok,
      requiredLabel: 'HR Manager / Direksi (REVIEWER)',
    };
  };

  // Check Role-Based Authorization for Candidate Hiring Step
  const canApproveHireStep = (record) => {
    if (effectiveRole === 'SUPER_ADMIN') return { allowed: true };
    const step = Number(record.current_step_order || record.current_hire_step || 1);
    if (step === 1) {
      const ok = ['ADMIN_OPERASIONAL', 'HR_OFFICER'].includes(effectiveRole);
      return {
        allowed: ok,
        requiredLabel: 'User / Kepala Divisi (ADMIN_OPERASIONAL)',
      };
    }
    if (step === 2) {
      const ok = ['HR_OFFICER', 'HR_NUSEA'].includes(effectiveRole);
      return {
        allowed: ok,
        requiredLabel: 'HR Manager (HR_OFFICER)',
      };
    }
    const ok = ['REVIEWER'].includes(effectiveRole);
    return {
      allowed: ok,
      requiredLabel: 'Direktur (REVIEWER)',
    };
  };

  // Open Approval History Modal
  const handleOpenApprovalLogs = async (type, record) => {
    setHistoryTitle(
      type === 'job'
        ? `Riwayat Approval Lowongan: ${record.title}`
        : `Riwayat Approval Hiring: ${record.full_name}`
    );
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    try {
      const res =
        type === 'job'
          ? await jobService.getJobApprovals(record.id)
          : await jobService.getApplicantApprovals(record.id);
      if (res?.success) {
        setHistoryLogs(res.data || res.logs || []);
      } else {
        setHistoryLogs([]);
      }
    } catch (err) {
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open Action Modal for Job
  const handleOpenJobAction = (job, type) => {
    setActionTarget(job);
    setActionEntityType('job');
    setActionType(type);
    setActionNotes(type === 'approve' ? 'Disetujui untuk dipublikasikan ke Website Career.' : '');
    setActionModalVisible(true);
  };

  // Open Action Modal for Hire
  const handleOpenHireAction = (hire, type) => {
    setActionTarget(hire);
    setActionEntityType('hire');
    setActionType(type);
    setActionNotes(
      type === 'approve'
        ? `Disetujui pengangkatan kandidat ${hire.full_name} untuk posisi ${hire.job_title}.`
        : ''
    );
    setActionModalVisible(true);
  };

  // Execute Action
  const handleExecuteAction = async () => {
    if (!actionTarget) return;
    if (actionType === 'reject' && !actionNotes.trim()) {
      message.warning('Mohon berikan catatan alasan penolakan/revisi.');
      return;
    }

    setActionSubmitting(true);
    try {
      const payload = {
        notes: actionNotes,
        approved_by: approverDisplayName,
      };
      if (actionEntityType === 'job') {
        if (actionType === 'approve') {
          const res = await jobService.approveJob(actionTarget.id, payload);
          if (res?.success) {
            message.success(res.message || 'Persetujuan lowongan kerja berhasil diproses!');
            setActionModalVisible(false);
            fetchData();
          }
        } else {
          const res = await jobService.rejectJob(actionTarget.id, payload);
          if (res?.success) {
            message.info(res.message || 'Lowongan telah ditolak / dikembalikan untuk revisi.');
            setActionModalVisible(false);
            fetchData();
          }
        }
      } else {
        // Applicant Hiring Action
        if (actionType === 'approve') {
          const res = await jobService.approveHireStep(actionTarget.id, payload);
          if (res?.success) {
            message.success(res.message || 'Persetujuan hiring berhasil diproses!');
            if (res.is_final) {
              Modal.success({
                title: 'Hiring Disetujui Secara Final & Otomatis Aktif!',
                content: (
                  <div>
                    <p>Selamat! Seluruh tahapan persetujuan telah lengkap disetujui.</p>
                    <p>Sistem telah otomatis melakukan:</p>
                    <ul>
                      <li>Mengonversi status pelamar menjadi <strong>Hired</strong>.</li>
                      <li>Membuat akun karyawan resmi di Backoffice.</li>
                      <li>Mengirimkan email surat resmi ke kandidat: <strong>{actionTarget.email}</strong></li>
                      <li>Mengirimkan email broadcast onboarding ke 5 departemen: <strong>HRD, IT, GA, Finance, dan User Head</strong>.</li>
                    </ul>
                  </div>
                ),
              });
            }
            setActionModalVisible(false);
            fetchData();
          }
        } else {
          const res = await jobService.rejectHireStep(actionTarget.id, payload);
          if (res?.success) {
            message.info(res.message || 'Pengajuan hiring ditolak.');
            setActionModalVisible(false);
            fetchData();
          }
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Gagal memproses persetujuan');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Columns: Job Approvals
  const jobColumns = [
    {
      title: 'Posisi Lowongan',
      key: 'title',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#1890ff' }}>{record.title}</Text>
          <div style={{ fontSize: 12, color: '#595959' }}>{record.department} &bull; {record.location}</div>
          <Tag color="cyan" style={{ marginTop: 4 }}>{record.job_type || 'Full-time'}</Tag>
        </div>
      ),
    },
    {
      title: 'Tahap Persetujuan',
      key: 'step',
      render: (_, record) => {
        const currStep = record.current_approval_step || 1;
        const total = record.total_approval_steps || 2;
        return (
          <div>
            <Tag color="orange" style={{ fontWeight: 700 }}>
              Step {currStep} of {total}
            </Tag>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {currStep === 1 ? 'HR Supervisor' : 'HR Manager'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Periode Tayang',
      key: 'dates',
      render: (_, record) => (
        <div style={{ fontSize: 12, color: '#595959' }}>
          <div>Mulai: {record.start_date ? dayjs(record.start_date).format('DD MMM YYYY') : '-'}</div>
          <div>Batas: {record.end_date ? dayjs(record.end_date).format('DD MMM YYYY') : '-'}</div>
        </div>
      ),
    },
    {
      title: 'Aksi Persetujuan',
      key: 'actions',
      render: (_, record) => {
        const auth = canApproveJobStep(record);
        return (
          <Space size={8} wrap>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: `Detail Lowongan: ${record.title}`,
                  width: 650,
                  content: (
                    <div style={{ marginTop: 12 }}>
                      <Descriptions bordered size="small" column={2}>
                        <Descriptions.Item label="Departemen">{record.department}</Descriptions.Item>
                        <Descriptions.Item label="Tipe">{record.job_type}</Descriptions.Item>
                        <Descriptions.Item label="Lokasi">{record.location}</Descriptions.Item>
                        <Descriptions.Item label="Step Approval">
                          Step {record.current_approval_step || 1} / {record.total_approval_steps || 2}
                        </Descriptions.Item>
                      </Descriptions>
                      <div style={{ marginTop: 12 }}>
                        <Text strong>Deskripsi Pekerjaan:</Text>
                        <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, marginTop: 4, whiteSpace: 'pre-line' }}>
                          {record.description}
                        </div>
                      </div>
                      {Array.isArray(record.requirements) && record.requirements.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <Text strong>Kualifikasi / Persyaratan:</Text>
                          <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                            {record.requirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ),
                });
              }}
            >
              Preview
            </Button>
            <Button
              size="small"
              icon={<AuditOutlined />}
              onClick={() => handleOpenApprovalLogs('job', record)}
            >
              Log Step
            </Button>
            <Tooltip
              title={
                auth.allowed
                  ? 'Setujui tahapan ini'
                  : `Terkunci: Step ini memerlukan otorisasi role ${auth.requiredLabel}`
              }
            >
              <Button
                type="primary"
                icon={auth.allowed ? <CheckOutlined /> : <LockOutlined />}
                size="small"
                disabled={!auth.allowed}
                style={auth.allowed ? { background: '#16a34a', borderColor: '#16a34a' } : {}}
                onClick={() => handleOpenJobAction(record, 'approve')}
              >
                Setujui Step Ini
              </Button>
            </Tooltip>
            <Tooltip
              title={
                auth.allowed
                  ? 'Tolak / Minta revisi'
                  : `Terkunci: Step ini memerlukan otorisasi role ${auth.requiredLabel}`
              }
            >
              <Button
                danger
                icon={<StopOutlined />}
                size="small"
                disabled={!auth.allowed}
                onClick={() => handleOpenJobAction(record, 'reject')}
              >
                Tolak / Revisi
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // Columns: Candidate Hire Approvals
  const hireColumns = [
    {
      title: 'Kandidat & Posisi',
      key: 'candidate',
      render: (_, record) => (
        <Space align="start" size={10}>
          <UserOutlined style={{ fontSize: 18, color: '#0284c7', marginTop: 2 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text strong style={{ fontSize: 14 }}>{record.full_name}</Text>
              {record.application_code && (
                <Tag color="purple" style={{ fontSize: 10 }}>{record.application_code}</Tag>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#595959' }}>
              Posisi: <strong>{record.job_title}</strong> ({record.department})
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              Email: {record.email} &bull; HP: {record.phone}
            </div>
            {record.stage_notes && (
              <div style={{ fontSize: 11.5, color: '#0369a1', background: '#f0f9ff', padding: '4px 8px', borderRadius: 4, marginTop: 4 }}>
                <strong>Ringkasan Pengajuan:</strong> {record.stage_notes}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Tahap Approval Hiring',
      key: 'hire_step',
      render: (_, record) => {
        const curr = record.current_step_order || record.current_hire_step || 1;
        const total = record.total_steps || record.total_hire_steps || 3;
        return (
          <div>
            <Tag color="volcano" style={{ fontWeight: 800 }}>
              Step {curr} of {total}
            </Tag>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0284c7', marginTop: 2 }}>
              {record.current_step_name || (curr === 1 ? 'User / Dept Head' : curr === 2 ? 'HR Manager' : 'Direktur')}
            </div>
            <Button
              type="link"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => handleOpenApprovalLogs('hire', record)}
              style={{ padding: 0, fontSize: 11, marginTop: 2 }}
            >
              Lihat Riwayat Step
            </Button>
          </div>
        );
      },
    },
    {
      title: 'Berkas & Kontrak',
      key: 'form_review',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined style={{ color: '#0284c7' }} />}
            onClick={() => {
              setTargetApplicant(record);
              setOfficialModalVisible(true);
            }}
            style={{ padding: 0, fontWeight: 700, fontSize: 12 }}
          >
            Form Pelamar
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PrinterOutlined style={{ color: '#7c3aed' }} />}
            onClick={() => {
              setContractApplicant(record);
              setOfferingModalVisible(true);
            }}
            style={{ padding: 0, fontWeight: 600, fontSize: 12, color: '#7c3aed' }}
          >
            Draft Offering / PKWT
          </Button>
        </Space>
      ),
    },
    {
      title: 'Aksi Persetujuan Hiring',
      key: 'hire_actions',
      render: (_, record) => {
        const auth = canApproveHireStep(record);
        return (
          <Space size={8} wrap>
            <Tooltip
              title={
                auth.allowed
                  ? 'Setujui tahapan hiring ini'
                  : `Terkunci: Step ini memerlukan otorisasi role ${auth.requiredLabel}`
              }
            >
              <Button
                type="primary"
                icon={auth.allowed ? <CheckOutlined /> : <LockOutlined />}
                size="small"
                disabled={!auth.allowed}
                style={auth.allowed ? { background: '#16a34a', borderColor: '#16a34a' } : {}}
                onClick={() => handleOpenHireAction(record, 'approve')}
              >
                Setujui (Approve)
              </Button>
            </Tooltip>
            <Tooltip
              title={
                auth.allowed
                  ? 'Tolak pengajuan hiring'
                  : `Terkunci: Step ini memerlukan otorisasi role ${auth.requiredLabel}`
              }
            >
              <Button
                danger
                icon={<StopOutlined />}
                size="small"
                disabled={!auth.allowed}
                onClick={() => handleOpenHireAction(record, 'reject')}
              >
                Tolak
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];  const tabItems = [
    {
      key: 'job_approvals',
      label: (
        <span>
          <ClockCircleOutlined />
          Approval Lowongan Kerja ({pendingJobs.length})
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          loading={loading}
          columns={jobColumns}
          dataSource={pendingJobs}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Tidak ada lowongan kerja yang membutuhkan persetujuan saat ini.' }}
        />
      ),
    },
    {
      key: 'hire_approvals',
      label: (
        <span>
          <SafetyCertificateOutlined />
          Approval Hiring Kandidat ({pendingHires.length})
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          loading={loading}
          columns={hireColumns}
          dataSource={pendingHires}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Tidak ada pengajuan hiring kandidat yang membutuhkan persetujuan saat ini.' }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AuditOutlined style={{ color: '#1890ff' }} />
              Pusat Persetujuan Multi-Level & Notifikasi Rekrutmen
            </Title>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              Segarkan Data
            </Button>
          </Col>
        </Row>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={12}>
          <Card size="small" bordered={false} style={{ background: '#fff7e6', borderRadius: 8 }}>
            <Statistic
              title="Menunggu Approval Lowongan"
              value={pendingJobs.length}
              valueStyle={{ color: '#d46b08' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12}>
          <Card size="small" bordered={false} style={{ background: '#f0f5ff', borderRadius: 8 }}>
            <Statistic
              title="Menunggu Approval Hiring"
              value={pendingHires.length}
              valueStyle={{ color: '#1d39c4' }}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs Layout */}
      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large" items={tabItems} />
      </Card>

      {/* Official Form Pelamar Modal */}
      <OfficialApplicationModal
        visible={officialModalVisible}
        onClose={() => setOfficialModalVisible(false)}
        applicantId={targetApplicant?.id}
        applicantName={targetApplicant?.full_name}
      />

      {/* Approve / Reject Modal */}
      <Modal
        title={
          <Space>
            {actionType === 'approve' ? (
              <CheckCircleOutlined style={{ color: '#16a34a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#dc2626' }} />
            )}
            <span>
              {actionType === 'approve' ? 'Konfirmasi Persetujuan (Approve)' : 'Tolak / Minta Revisi (Reject)'}
            </span>
          </Space>
        }
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        onOk={handleExecuteAction}
        okText={actionType === 'approve' ? 'Setujui Sekarang' : 'Tolak'}
        okButtonProps={{
          danger: actionType === 'reject',
          style: actionType === 'approve' ? { background: '#16a34a', borderColor: '#16a34a' } : {},
        }}
        confirmLoading={actionSubmitting}
      >
        <p style={{ fontSize: 13.5 }}>
          Anda akan memproses persetujuan untuk:{' '}
          <strong>
            {actionEntityType === 'job'
              ? actionTarget?.title
              : `${actionTarget?.full_name} (${actionTarget?.job_title})`}
          </strong>
        </p>

        <div style={{ marginTop: 14 }}>
          <Text strong>Catatan Persetujuan / Alasan:</Text>
          <TextArea
            rows={3}
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder={
              actionType === 'approve'
                ? 'Catatan persetujuan (opsional)...'
                : 'Alasan penolakan / revisi...'
            }
            style={{ marginTop: 6 }}
          />
        </div>
      </Modal>

      {/* Offering Letter & PKWT Contract Generator Modal */}
      <OfferingContractModal
        visible={offeringModalVisible}
        onClose={() => setOfferingModalVisible(false)}
        applicant={contractApplicant}
      />

      {/* Step-by-Step Approval History Modal */}
      <Modal
        title={
          <Space>
            <AuditOutlined style={{ color: '#0284c7' }} />
            <span>{historyTitle || 'Riwayat Log Persetujuan Multi-Level'}</span>
          </Space>
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Tutup
          </Button>,
        ]}
        width={620}
      >
        {historyLoading ? (
          <Card loading />
        ) : historyLogs.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message="Belum ada riwayat keputusan pada tahap ini."
            description="Persetujuan masih berada pada antrean tahap awal."
          />
        ) : (
          <Timeline
            style={{ marginTop: 16 }}
            items={historyLogs.map((log, idx) => ({
              key: log.id || idx,
              color: log.action === 'approved' || log.action === 'approve' ? 'green' : log.action === 'rejected' ? 'red' : 'blue',
              children: (
                <div>
                  <div>
                    <Tag color={log.action === 'approved' || log.action === 'approve' ? 'success' : log.action === 'rejected' ? 'error' : 'processing'}>
                      Step {log.step_order || 1}: {(log.action || 'processed').toUpperCase()}
                    </Tag>
                    <Text strong>{log.approver_name || log.acted_by || 'Approver'}</Text>
                    {log.role_name && <Text type="secondary"> ({log.role_name})</Text>}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {log.created_at ? dayjs(log.created_at).format('DD MMM YYYY HH:mm:ss') : '-'}
                  </div>
                  {log.notes && (
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: 6,
                        marginTop: 4,
                        fontSize: 12.5,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      Catatan: {log.notes}
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Modal>
    </div>
  );
}
