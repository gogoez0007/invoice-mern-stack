import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  message,
  Row,
  Col,
  Tabs,
  Form,
  Select,
  Switch,
  Divider,
  Modal,
  InputNumber,
  Tooltip,
  Popconfirm,
  Badge,
} from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  AuditOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserSwitchOutlined,
  InfoCircleOutlined,
  MailOutlined,
  UserOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { jobService } from '@/request/jobService';

const { Title, Text, Paragraph } = Typography;

export default function ApprovalSettingsPage() {
  const [toggleForm] = Form.useForm();
  const [stepModalForm] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Workflow Steps State
  const [jobSteps, setJobSteps] = useState([]);
  const [hireSteps, setHireSteps] = useState([]);

  // Modal State for Step Editing/Adding
  const [modalVisible, setModalVisible] = useState(false);
  const [modalWorkflow, setModalWorkflow] = useState('job_posting'); // 'job_posting' | 'applicant_hiring'
  const [editingIndex, setEditingIndex] = useState(null); // null = new, number = edit index

  // Fetch Settings and Steps from Server
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Toggles & General Settings
      const notifRes = await jobService.getNotificationSettings();
      if (notifRes.success && notifRes.data) {
        toggleForm.setFieldsValue({
          job_approval_multistep: notifRes.data.job_approval_multistep !== 'false',
          job_emergency_override: notifRes.data.job_emergency_override === 'true',
          job_notify_approvers: notifRes.data.job_notify_approvers !== 'false',
          hire_require_offering: notifRes.data.hire_require_offering !== 'false',
          hire_require_nik_valid: notifRes.data.hire_require_nik_valid !== 'false',
          hire_notify_onboarding: notifRes.data.hire_notify_onboarding !== 'false',
        });
      }

      // 2. Fetch Workflow Steps (Job Posting & Hiring)
      const stepsRes = await jobService.getApprovalWorkflowSteps();
      if (stepsRes.success && stepsRes.data) {
        setJobSteps(stepsRes.data.job_posting || []);
        setHireSteps(stepsRes.data.applicant_hiring || []);
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal memuat data alur approval: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save All Changes (Steps + Toggles)
  const handleSaveAll = async () => {
    if (jobSteps.length === 0) {
      message.error('Alur lowongan kerja wajib memiliki minimal 1 tahapan approval.');
      return;
    }
    if (hireSteps.length === 0) {
      message.error('Alur hiring pelamar wajib memiliki minimal 1 tahapan approval.');
      return;
    }

    setSaving(true);
    try {
      // 1. Save Steps
      const stepsPayload = {
        job_posting: jobSteps.map((s, idx) => ({
          step_order: idx + 1,
          step_label: s.step_label,
          role_name: s.role_name,
          approver_name: s.approver_name,
          approver_email: s.approver_email,
          is_external: s.is_external ? 1 : 0,
          sla_hours: s.sla_hours || 48,
        })),
        applicant_hiring: hireSteps.map((s, idx) => ({
          step_order: idx + 1,
          step_label: s.step_label,
          role_name: s.role_name,
          approver_name: s.approver_name,
          approver_email: s.approver_email,
          is_external: s.is_external ? 1 : 0,
          sla_hours: s.sla_hours || 48,
        })),
      };

      const stepsRes = await jobService.updateApprovalWorkflowSteps(stepsPayload);
      if (!stepsRes.success) {
        throw new Error(stepsRes.message || 'Gagal menyimpan tahapan alur.');
      }

      // 2. Save Toggles
      const toggleValues = toggleForm.getFieldsValue();
      const settingsPayload = {
        settings: {
          job_approval_multistep: String(toggleValues.job_approval_multistep !== false),
          job_emergency_override: String(toggleValues.job_emergency_override === true),
          job_notify_approvers: String(toggleValues.job_notify_approvers !== false),
          hire_require_offering: String(toggleValues.hire_require_offering !== false),
          hire_require_nik_valid: String(toggleValues.hire_require_nik_valid !== false),
          hire_notify_onboarding: String(toggleValues.hire_notify_onboarding !== false),
        },
      };
      await jobService.updateNotificationSettings(settingsPayload);

      message.success('Konfigurasi tahapan approver & aturan alur berhasil disimpan!');
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Terjadi kesalahan: ' + (err.message || 'Gagal menyimpan'));
    } finally {
      setSaving(false);
    }
  };

  // Open Step Modal for Add
  const handleAddStep = (workflowCode) => {
    setModalWorkflow(workflowCode);
    setEditingIndex(null);
    stepModalForm.resetFields();
    stepModalForm.setFieldsValue({
      step_label: '',
      role_name: '',
      approver_name: '',
      approver_email: '',
      is_external: false,
      sla_hours: 48,
    });
    setModalVisible(true);
  };

  // Open Step Modal for Edit
  const handleEditStep = (workflowCode, index) => {
    setModalWorkflow(workflowCode);
    setEditingIndex(index);
    const list = workflowCode === 'job_posting' ? jobSteps : hireSteps;
    const item = list[index];
    stepModalForm.setFieldsValue({
      step_label: item.step_label,
      role_name: item.role_name,
      approver_name: item.approver_name,
      approver_email: item.approver_email,
      is_external: Boolean(item.is_external),
      sla_hours: item.sla_hours || 48,
    });
    setModalVisible(true);
  };

  // Delete Step
  const handleDeleteStep = (workflowCode, index) => {
    if (workflowCode === 'job_posting') {
      const updated = jobSteps.filter((_, idx) => idx !== index);
      setJobSteps(updated);
    } else {
      const updated = hireSteps.filter((_, idx) => idx !== index);
      setHireSteps(updated);
    }
    message.info('Tahap dihapus (klik Simpan Alur Approval untuk menerapkan permanen).');
  };

  // Save Step from Modal
  const handleModalSubmit = async () => {
    try {
      const values = await stepModalForm.validateFields();
      const newStep = {
        step_label: values.step_label,
        role_name: values.role_name,
        approver_name: values.approver_name,
        approver_email: values.approver_email,
        is_external: values.is_external ? 1 : 0,
        sla_hours: values.sla_hours || 48,
      };

      if (modalWorkflow === 'job_posting') {
        const list = [...jobSteps];
        if (editingIndex !== null) {
          list[editingIndex] = { ...list[editingIndex], ...newStep };
        } else {
          list.push(newStep);
        }
        setJobSteps(list);
      } else {
        const list = [...hireSteps];
        if (editingIndex !== null) {
          list[editingIndex] = { ...list[editingIndex], ...newStep };
        } else {
          list.push(newStep);
        }
        setHireSteps(list);
      }

      setModalVisible(false);
      message.success(
        editingIndex !== null
          ? 'Tahapan approval berhasil diubah.'
          : 'Tahapan approval baru berhasil ditambahkan.'
      );
    } catch (err) {
      // Form validation error
    }
  };

  // Move step up/down
  const handleMoveStep = (workflowCode, index, direction) => {
    const list = workflowCode === 'job_posting' ? [...jobSteps] : [...hireSteps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    if (workflowCode === 'job_posting') {
      setJobSteps(list);
    } else {
      setHireSteps(list);
    }
  };

  // Columns for Steps Table
  const getTableColumns = (workflowCode) => [
    {
      title: 'Urutan',
      dataIndex: 'step_order',
      key: 'step_order',
      width: 80,
      align: 'center',
      render: (_, __, index) => (
        <Badge
          count={index + 1}
          style={{
            backgroundColor: '#0e3a64',
            fontWeight: 700,
            fontSize: 13,
            boxShadow: 'none',
          }}
        />
      ),
    },
    {
      title: 'Nama Tahap (Tahapan Approval)',
      dataIndex: 'step_label',
      key: 'step_label',
      render: (val, record, index) => {
        const isFinal =
          index ===
          (workflowCode === 'job_posting' ? jobSteps.length - 1 : hireSteps.length - 1);
        return (
          <div>
            <Text strong style={{ fontSize: 13.5, color: '#0f172a' }}>
              {val || `Tahap ${index + 1}`}
            </Text>
            {isFinal && (
              <Tag color="cyan" style={{ marginLeft: 8, fontSize: 11, fontWeight: 600 }}>
                Tahap Final
              </Tag>
            )}
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Peran: {record.role_name || '-'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Nama Approver (Manual)',
      dataIndex: 'approver_name',
      key: 'approver_name',
      render: (val) => (
        <Space direction="horizontal" size={6}>
          <UserOutlined style={{ color: '#0284c7' }} />
          <Text strong style={{ color: '#1e293b' }}>
            {val || <Text type="secondary">(Belum diisi)</Text>}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Email Notifikasi Approver',
      dataIndex: 'approver_email',
      key: 'approver_email',
      render: (val) =>
        val ? (
          <Space direction="horizontal" size={6}>
            <MailOutlined style={{ color: '#16a34a' }} />
            <Text copyable style={{ fontSize: 13, color: '#334155' }}>
              {val}
            </Text>
          </Space>
        ) : (
          <Tag color="warning">Tanpa Email</Tag>
        ),
    },
    {
      title: 'Tipe Pengguna',
      dataIndex: 'is_external',
      key: 'is_external',
      width: 170,
      render: (val) =>
        val ? (
          <Tag color="purple" style={{ padding: '3px 8px', fontWeight: 600 }}>
            <GlobalOutlined style={{ marginRight: 4 }} />
            Bukan User Sistem
          </Tag>
        ) : (
          <Tag color="blue" style={{ padding: '3px 8px', fontWeight: 600 }}>
            <UserSwitchOutlined style={{ marginRight: 4 }} />
            User Sistem
          </Tag>
        ),
    },
    {
      title: 'SLA Respon',
      dataIndex: 'sla_hours',
      key: 'sla_hours',
      width: 110,
      render: (val) => (
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
          <ClockCircleOutlined style={{ marginRight: 4, color: '#64748b' }} />
          {val || 48} Jam
        </span>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 160,
      align: 'center',
      render: (_, record, index) => {
        const total = workflowCode === 'job_posting' ? jobSteps.length : hireSteps.length;
        return (
          <Space direction="horizontal" size={4}>
            <Tooltip title="Pindah ke Atas">
              <Button
                size="small"
                disabled={index === 0}
                onClick={() => handleMoveStep(workflowCode, index, 'up')}
              >
                ▲
              </Button>
            </Tooltip>
            <Tooltip title="Pindah ke Bawah">
              <Button
                size="small"
                disabled={index === total - 1}
                onClick={() => handleMoveStep(workflowCode, index, 'down')}
              >
                ▼
              </Button>
            </Tooltip>
            <Tooltip title="Edit Approver & Detail">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditStep(workflowCode, index)}
              />
            </Tooltip>
            <Popconfirm
              title="Hapus tahapan ini?"
              okText="Hapus"
              cancelText="Batal"
              onConfirm={() => handleDeleteStep(workflowCode, index)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // Tab Items definition for Ant Design v5
  const tabItems = [
    {
      key: 'jobs_workflow',
      label: (
        <span>
          <AuditOutlined /> Alur Lowongan Kerja (Job Posting)
        </span>
      ),
      children: (
        <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0, color: '#0e3a64' }}>
                Daftar Approver Pembukaan Lowongan Kerja
              </Title>
            </div>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => handleAddStep('job_posting')}
              style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 600 }}
            >
              Tambah Tahap Approver
            </Button>
          </div>

          <Table
            dataSource={jobSteps.map((s, i) => ({ ...s, key: `job_${i}` }))}
            columns={getTableColumns('job_posting')}
            pagination={false}
            loading={loading}
            bordered
          />

          <Divider style={{ margin: '24px 0 16px' }} />

          <Title level={5} style={{ fontSize: 14, color: '#334155', marginBottom: 12 }}>
            Kebijakan Eksekusi Alur Lowongan:
          </Title>
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Aktifkan Persetujuan Bertingkat (Multi-Step)"
                name="job_approval_multistep"
                valuePropName="checked"
                >
                <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Kirim Notifikasi Email Otomatis ke Approver"
                name="job_notify_approvers"
                valuePropName="checked"
                >
                <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'hire_workflow',
      label: (
        <span>
          <CheckCircleOutlined /> Alur Hiring Pelamar (Penerimaan Karyawan)
        </span>
      ),
      children: (
        <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0, color: '#0e3a64' }}>
                Daftar Approver Pengangkatan Karyawan (Hiring)
              </Title>
            </div>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => handleAddStep('applicant_hiring')}
              style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 600 }}
            >
              Tambah Tahap Approver
            </Button>
          </div>

          <Table
            dataSource={hireSteps.map((s, i) => ({ ...s, key: `hire_${i}` }))}
            columns={getTableColumns('applicant_hiring')}
            pagination={false}
            loading={loading}
            bordered
          />

          <Divider style={{ margin: '24px 0 16px' }} />

          <Title level={5} style={{ fontSize: 14, color: '#334155', marginBottom: 12 }}>
            Kebijakan Eksekusi Alur Hiring:
          </Title>
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Wajib Ada Dokumen Offering Letter Sebelum Final Approval"
                name="hire_require_offering"
                valuePropName="checked"
                >
                <Switch checkedChildren="Wajib" unCheckedChildren="Opsional" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Wajib NIK Terverifikasi Valid Sebelum Approval"
                name="hire_require_nik_valid"
                valuePropName="checked"
                >
                <Switch checkedChildren="Wajib" unCheckedChildren="Opsional" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 8px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0, color: '#0e3a64' }}>
              Alur Approval
            </Title>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                Segarkan
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveAll}
                loading={saving}
                style={{ background: '#0e3a64', borderColor: '#0e3a64' }}
              >
                Simpan Alur Approval
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Satu Form Induk Membungkus Seluruh Tabs (Mencegah Nilai Toggle Hilang Antar Tab) */}
      <Form form={toggleForm} layout="vertical" preserve={true}>
        <Tabs defaultActiveKey="jobs_workflow" type="card" items={tabItems} destroyInactiveTabPane={false} />
      </Form>

      {/* Modal Tambah / Edit Tahap Approver */}
      <Modal
        title={
          <Space>
            <UserSwitchOutlined style={{ color: '#0284c7' }} />
            <span>
              {editingIndex !== null ? 'Ubah Tahap Approver' : 'Tambah Tahap Approver Baru'} (
              {modalWorkflow === 'job_posting' ? 'Lowongan Kerja' : 'Hiring Pelamar'})
            </span>
          </Space>
        }
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        okText="Simpan Tahap"
        cancelText="Batal"
        width={580}
        okButtonProps={{ style: { background: '#0e3a64', borderColor: '#0e3a64' } }}
      >
        <Form form={stepModalForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            label="Nama Tahapan Approval (Label Tahap)"
            name="step_label"
            rules={[{ required: true, message: 'Nama tahapan approval wajib diisi' }]}
            >
            <Input placeholder="Nama tahapan" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Nama Approver"
                name="approver_name"
                rules={[{ required: true, message: 'Nama approver wajib diisi' }]}
                >
                <Input placeholder="Nama approver" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Peran / Jabatan"
                name="role_name"
                rules={[{ required: true, message: 'Peran / jabatan wajib diisi' }]}
                >
                <Input placeholder="Peran / jabatan" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Alamat Email Approver"
            name="approver_email"
            rules={[
              { required: true, message: 'Email approver wajib diisi' },
              { type: 'email', message: 'Format email tidak valid' },
            ]}
            >
            <Input placeholder="Email approver" prefix={<MailOutlined />} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tipe Pengguna Approver"
                name="is_external"
                valuePropName="checked"
                >
                <Switch
                  checkedChildren="Bukan User Sistem (Eksternal)"
                  unCheckedChildren="User Sistem Backoffice"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="SLA Waktu Respon (Jam)"
                name="sla_hours"
                rules={[{ required: true, message: 'SLA wajib diisi' }]}
                >
                <InputNumber min={1} max={720} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
