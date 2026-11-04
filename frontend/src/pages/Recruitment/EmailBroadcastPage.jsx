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
  Tabs,
  Form,
  Select,
  Popconfirm,
  Alert,
  Switch,
  Divider,
} from 'antd';
import {
  MailOutlined,
  SendOutlined,
  HistoryOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { jobService } from '@/request/jobService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

export default function EmailBroadcastPage() {
  const [activeTab, setActiveTab] = useState('recipients');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({});
  const [recipientsList, setRecipientsList] = useState([]);
  const [autoSendHired, setAutoSendHired] = useState(true);

  // Form Tambah Penerima
  const [addRecipientForm] = Form.useForm();

  // Form Kirim Manual
  const [broadcastForm] = Form.useForm();
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewMessage, setPreviewMessage] = useState('');

  // Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilterStatus, setLogFilterStatus] = useState('');
  const [logFilterEvent, setLogFilterEvent] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  // Load Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await jobService.getNotificationSettings();
      if (res.success && res.data) {
        setSettings(res.data);
        const list = Array.isArray(res.data.hired_broadcast_recipients)
          ? res.data.hired_broadcast_recipients
          : [];
        setRecipientsList(list);
        setAutoSendHired(res.data.auto_broadcast_hired !== 'false');
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal memuat pengaturan broadcast email.');
    } finally {
      setLoading(false);
    }
  };

  // Load Audit Logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await jobService.getNotificationLogs({ limit: 100 });
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal memuat riwayat pengiriman email.');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  // Simpan Daftar Penerima
  const handleSaveRecipients = async () => {
    setSaving(true);
    try {
      const payload = {
        settings: {
          hired_broadcast_recipients: recipientsList,
          auto_broadcast_hired: String(autoSendHired),
        },
      };
      const res = await jobService.updateNotificationSettings(payload);
      if (res.success) {
        message.success('Daftar penerima broadcast berhasil diperbarui.');
      } else {
        message.error(res.message || 'Gagal menyimpan pengaturan.');
      }
    } catch (err) {
      console.error(err);
      message.error('Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  // Tambah Penerima ke List
  const handleAddRecipient = (values) => {
    const email = values.email.trim().toLowerCase();
    if (recipientsList.some((r) => (typeof r === 'string' ? r : r.email).toLowerCase() === email)) {
      message.warning('Email tersebut sudah ada dalam daftar penerima.');
      return;
    }
    const newEntry = {
      name: values.name.trim(),
      email: email,
      role: values.role || 'HR Team',
      added_at: new Date().toISOString(),
    };
    setRecipientsList([...recipientsList, newEntry]);
    addRecipientForm.resetFields();
    message.success('Penerima ditambahkan ke daftar. Jangan lupa klik Simpan Pengaturan.');
  };

  // Hapus Penerima
  const handleRemoveRecipient = (index) => {
    const updated = recipientsList.filter((_, idx) => idx !== index);
    setRecipientsList(updated);
    message.info('Penerima dihapus dari daftar lokal.');
  };

  // Terapkan Template Cepat ke Form Manual
  const handleApplyTemplate = (type) => {
    if (type === 'hired') {
      const subj = 'Pengumuman Karyawan Baru: Kandidat Telah Lolos Seleksi';
      const body = `Dengan hormat,\n\nKami informasikan bahwa proses seleksi rekrutmen telah selesai dan kandidat berikut telah dinyatakan Lolos (Hired):\n\nNama: [Nama Kandidat]\nPosisi: [Judul Lowongan]\nDepartemen: [Nama Departemen]\nTanggal Efektif Masuk: [Tanggal Masuk]\n\nMohon tim terkait (Operasional / IT / HR) dapat mempersiapkan fasilitas dan onboarding karyawan yang bersangkutan.\n\nSalam,\nTim HRD Delta Marine Group`;
      broadcastForm.setFieldsValue({ subject: subj, message: body });
      setPreviewSubject(subj);
      setPreviewMessage(body);
    } else if (type === 'interview') {
      const subj = 'Pemberitahuan Jadwal Wawancara Direksi Rekrutmen';
      const body = `Selamat pagi / siang Rekan-rekan User & Manajemen,\n\nBerikut kami lampirkan jadwal wawancara tahap akhir untuk posisi [Judul Lowongan]:\n\nNama Kandidat: [Nama Kandidat]\nJadwal: [Hari, Tanggal & Jam]\nLokasi / Media: On-site / Zoom Meeting\n\nTerlampir resume dan lembar evaluasi kandidat untuk dipelajari sebelum sesi wawancara berlangsung.\n\nTerima kasih.`;
      broadcastForm.setFieldsValue({ subject: subj, message: body });
      setPreviewSubject(subj);
      setPreviewMessage(body);
    } else if (type === 'general') {
      const subj = 'Pemberitahuan Internal Tim Rekrutmen Delta Marine Group';
      const body = `Rekan-rekan tim Delta Marine Group yang terhormat,\n\nKami menginformasikan update terkini terkait proses rekrutmen dan kebutuhan talenta baru di lingkungan perusahaan.\n\n[Tuliskan poin pengumuman atau instruksi internal di sini]\n\nAtas perhatian dan kerja samanya, kami ucapkan terima kasih.`;
      broadcastForm.setFieldsValue({ subject: subj, message: body });
      setPreviewSubject(subj);
      setPreviewMessage(body);
    }
  };

  // Kirim Broadcast Manual
  const handleSendManualBroadcast = async (values) => {
    setSendingBroadcast(true);
    try {
      let targets = [];
      if (values.target_type === 'all_registered') {
        targets = recipientsList;
      } else if (values.target_type === 'custom') {
        const customEmails = (values.custom_emails || '')
          .split(/[\n,;]+/)
          .map((e) => e.trim())
          .filter(Boolean);
        targets = customEmails.map((e) => ({ email: e, name: '', role: 'Custom Recipient' }));
      }

      if (targets.length === 0) {
        message.warning('Tidak ada penerima email valid untuk dikirim.');
        setSendingBroadcast(false);
        return;
      }

      const payload = {
        recipients: targets,
        subject: values.subject,
        message: values.message,
        event_type: 'manual_broadcast',
      };

      const res = await jobService.sendBroadcast(payload);
      if (res.success) {
        message.success(res.message || 'Broadcast email berhasil disiarkan!');
        broadcastForm.resetFields();
        setPreviewSubject('');
        setPreviewMessage('');
        fetchLogs();
      } else {
        message.error(res.message || 'Gagal mengirim broadcast email.');
      }
    } catch (err) {
      console.error(err);
      message.error('Terjadi kesalahan saat memproses pengiriman broadcast.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Filter Data Log
  const filteredLogs = logs.filter((item) => {
    const matchStatus = !logFilterStatus || item.status === logFilterStatus;
    const matchEvent = !logFilterEvent || item.event_type === logFilterEvent;
    const q = logSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      (item.recipient_email || '').toLowerCase().includes(q) ||
      (item.recipient_name || '').toLowerCase().includes(q) ||
      (item.subject || '').toLowerCase().includes(q);
    return matchStatus && matchEvent && matchSearch;
  });

  // Statistik Log
  const totalSent = logs.filter((l) => l.status === 'sent').length;
  const totalSimulated = logs.filter((l) => l.status === 'simulated').length;
  const totalFailed = logs.filter((l) => l.status === 'failed').length;

  return (
    <div style={{ padding: '0 8px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0, color: '#0e3a64' }}>
              Broadcast Email
            </Title>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchSettings();
                fetchLogs();
              }}
              loading={loading || logsLoading}
            >
              Segarkan Data
            </Button>
          </Col>
        </Row>
      </div>

      {/* Tabs Menu */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        {/* Tab 1: Penerima Broadcast Otomatis */}
        <TabPane
          tab={
            <span>
              <TeamOutlined /> Penerima Broadcast Otomatis
            </span>
          }
          key="recipients"
        >
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={15}>
              <Card
                title={
                  <Space>
                    <MailOutlined style={{ color: '#0284c7' }} />
                    <span>Daftar Email Penerima Notifikasi Internal</span>
                  </Space>
                }
                extra={
                  <Button
                    type="primary"
                    onClick={handleSaveRecipients}
                    loading={saving}
                    style={{ background: '#0e3a64', borderColor: '#0e3a64' }}
                  >
                    Simpan Pengaturan
                  </Button>
                }
                bordered={false}
                style={{ borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
              >
                <Alert
                  message="Otomatisasi Broadcast Saat Rekrutmen Selesai"
                  description="Seluruh email di bawah ini akan secara otomatis menerima salinan pemberitahuan saat kandidat berhasil lolos semua tahap (Status: Hired) atau membutuhkan atensi khusus dari manajemen."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space direction="vertical" size={2}>
                    <Text strong>Kirim Otomatis saat Kandidat Hired:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Menyiarkan profil dan departemen penempatan kandidat baru.
                    </Text>
                  </Space>
                  <Switch
                    checked={autoSendHired}
                    onChange={setAutoSendHired}
                    checkedChildren="Aktif"
                    unCheckedChildren="Mati"
                  />
                </div>

                <Divider style={{ margin: '14px 0' }} />

                <Table
                  dataSource={recipientsList.map((r, idx) => {
                    if (typeof r === 'string') {
                      return { key: idx, name: '-', email: r, role: 'Stakeholder', index: idx };
                    }
                    return { key: idx, name: r.name || '-', email: r.email, role: r.role || 'HR Team', index: idx };
                  })}
                  pagination={{ pageSize: 6 }}
                  size="small"
                  columns={[
                    {
                      title: 'Nama / Posisi',
                      dataIndex: 'name',
                      key: 'name',
                      render: (text) => <strong>{text}</strong>,
                    },
                    {
                      title: 'Alamat Email',
                      dataIndex: 'email',
                      key: 'email',
                      render: (email) => <Text copyable>{email}</Text>,
                    },
                    {
                      title: 'Kategori / Peran',
                      dataIndex: 'role',
                      key: 'role',
                      render: (role) => <Tag color="blue">{role}</Tag>,
                    },
                    {
                      title: 'Aksi',
                      key: 'action',
                      width: 80,
                      align: 'center',
                      render: (_, record) => (
                        <Popconfirm
                          title="Hapus penerima ini dari daftar?"
                          onConfirm={() => handleRemoveRecipient(record.index)}
                          okText="Hapus"
                          cancelText="Batal"
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                      ),
                    },
                  ]}
                  locale={{ emptyText: 'Belum ada penerima broadcast terdaftar. Tambahkan di formulir samping.' }}
                />
              </Card>
            </Col>

            {/* Kolom Kanan: Form Tambah Penerima */}
            <Col xs={24} lg={9}>
              <Card
                title={
                  <Space>
                    <PlusOutlined style={{ color: '#16a34a' }} />
                    <span>Tambah Penerima Baru</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
              >
                <Form form={addRecipientForm} layout="vertical" onFinish={handleAddRecipient}>
                  <Form.Item
                    label="Nama Lengkap / Jabatan"
                    name="name"
                    rules={[{ required: true, message: 'Nama lengkap atau jabatan wajib diisi' }]}
                  >
                    <Input placeholder="Nama / jabatan penerima" />
                  </Form.Item>

                  <Form.Item
                    label="Alamat Email Internal"
                    name="email"
                    rules={[
                      { required: true, message: 'Alamat email wajib diisi' },
                      { type: 'email', message: 'Format email tidak valid' },
                    ]}
                  >
                    <Input placeholder="Alamat email penerima" />
                  </Form.Item>

                  <Form.Item label="Kategori / Peran" name="role" initialValue="User / Divisi Pemohon">
                    <Select
                      options={[
                        { value: 'User / Divisi Pemohon', label: 'User / Divisi Pemohon' },
                        { value: 'HR & GA Team', label: 'HR & GA Team' },
                        { value: 'Direksi / Board', label: 'Direksi / Board' },
                        { value: 'Finance & Payroll', label: 'Finance & Payroll' },
                        { value: 'IT & Facilities', label: 'IT & Facilities' },
                      ]}
                    />
                  </Form.Item>

                  <Button type="dashed" htmlType="submit" icon={<PlusOutlined />} block style={{ marginTop: 8 }}>
                    Tambahkan ke Daftar Penerima
                  </Button>
                </Form>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Tab 2: Kirim Broadcast Manual */}
        <TabPane
          tab={
            <span>
              <SendOutlined /> Kirim Broadcast Manual
            </span>
          }
          key="manual_send"
        >
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={14}>
              <Card
                title={
                  <Space>
                    <SendOutlined style={{ color: '#0284c7' }} />
                    <span>Form Penyiaran Email Manual</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 6 }}>
                    Template Cepat:
                  </Text>
                  <Space wrap>
                    <Button size="small" icon={<ThunderboltOutlined />} onClick={() => handleApplyTemplate('hired')}>
                      Pengumuman Kandidat Lolos (Hired)
                    </Button>
                    <Button size="small" icon={<ThunderboltOutlined />} onClick={() => handleApplyTemplate('interview')}>
                      Undangan Wawancara Direksi
                    </Button>
                    <Button size="small" icon={<ThunderboltOutlined />} onClick={() => handleApplyTemplate('general')}>
                      Pemberitahuan Umum HRD
                    </Button>
                  </Space>
                </div>

                <Divider style={{ margin: '14px 0' }} />

                <Form
                  form={broadcastForm}
                  layout="vertical"
                  onFinish={handleSendManualBroadcast}
                  initialValues={{ target_type: 'all_registered' }}
                >
                  <Form.Item label="Target Penerima" name="target_type" rules={[{ required: true }]}>
                    <Select
                      options={[
                        {
                          value: 'all_registered',
                          label: `Kirim ke Seluruh Penerima Terdaftar (${recipientsList.length} Alamat Email)`,
                        },
                        { value: 'custom', label: 'Input Email Tujuan Kustom Secara Manual' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.target_type !== curr.target_type}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue('target_type') === 'custom' ? (
                        <Form.Item
                          label="Daftar Email Kustom"
                          name="custom_emails"
                          rules={[{ required: true, message: 'Masukkan minimal 1 alamat email' }]}
                          >
                          <TextArea rows={3} placeholder="email1@delmargroup.id, email2@delmargroup.id" />
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>

                  <Form.Item
                    label="Subjek Email"
                    name="subject"
                    rules={[{ required: true, message: 'Subjek email wajib diisi' }]}
                  >
                    <Input
                      placeholder="Subjek email"
                      onChange={(e) => setPreviewSubject(e.target.value)}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Isi Pesan Broadcast"
                    name="message"
                    rules={[{ required: true, message: 'Isi pesan broadcast wajib diisi' }]}
                  >
                    <TextArea
                      rows={8}
                      placeholder="Isi pesan broadcast"
                      onChange={(e) => setPreviewMessage(e.target.value)}
                    />
                  </Form.Item>

                  <Popconfirm
                    title="Konfirmasi Pengiriman Broadcast"
                    description="Apakah Anda yakin ingin menyiarkan email ini sekarang ke seluruh target penerima?"
                    onConfirm={() => broadcastForm.submit()}
                    okText="Ya, Kirim Sekarang"
                    cancelText="Batal"
                  >
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      size="large"
                      loading={sendingBroadcast}
                      style={{ background: '#0e3a64', borderColor: '#0e3a64', width: '100%' }}
                    >
                      Kirim Broadcast Email Sekarang
                    </Button>
                  </Popconfirm>
                </Form>
              </Card>
            </Col>

            {/* Kolom Kanan: Pratinjau Tampilan Email */}
            <Col xs={24} lg={10}>
              <Card
                title={
                  <Space>
                    <EyeOutlined style={{ color: '#0e3a64' }} />
                    <span>Pratinjau Pesan Email</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
              >
                <div
                  style={{
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 8,
                    padding: 18,
                    background: '#ffffff',
                    minHeight: 280,
                  }}
                >
                  <div style={{ borderLeft: '4px solid #0e3a64', paddingLeft: 10, marginBottom: 14 }}>
                    <Title level={5} style={{ margin: 0, color: '#0e3a64' }}>
                      {previewSubject || '(Subjek email akan ditampilkan di sini)'}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 11.5 }}>
                      Pengirim: Delta Marine Group HRD &lt;{settings.smtp_from_email || 'recruitment@delmargroup.id'}&gt;
                    </Text>
                  </div>

                  <div
                    style={{
                      fontSize: 13.5,
                      color: '#334155',
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                      minHeight: 120,
                      background: '#f8fafc',
                      padding: 12,
                      borderRadius: 6,
                    }}
                  >
                    {previewMessage || '(Isi pesan email akan dipratinjau di sini saat Anda mengetik)'}
                  </div>

                  <Divider style={{ margin: '14px 0 10px' }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Pemberitahuan resmi internal Delta Marine Group.
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Tab 3: Log Riwayat Pengiriman Email */}
        <TabPane
          tab={
            <span>
              <HistoryOutlined /> Riwayat Log Pengiriman
            </span>
          }
          key="logs"
        >
          {/* Summary Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
            <Col xs={12} sm={6}>
              <Card size="small" bordered={false} style={{ background: '#f0fdf4', borderRadius: 8 }}>
                <Statistic
                  title="Berhasil Terkirim (Sent)"
                  value={totalSent}
                  valueStyle={{ color: '#16a34a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" bordered={false} style={{ background: '#eff6ff', borderRadius: 8 }}>
                <Statistic
                  title="Simulasi / Dev Mode"
                  value={totalSimulated}
                  valueStyle={{ color: '#2563eb' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" bordered={false} style={{ background: '#fef2f2', borderRadius: 8 }}>
                <Statistic
                  title="Gagal Terkirim"
                  value={totalFailed}
                  valueStyle={{ color: '#dc2626' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" bordered={false} style={{ background: '#f8fafc', borderRadius: 8 }}>
                <Statistic
                  title="Total Catatan Log"
                  value={logs.length}
                  valueStyle={{ color: '#475569' }}
                  prefix={<HistoryOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
          >
            {/* Filter Toolbar Log */}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle">
              <Col xs={24} sm={8}>
                <Input.Search
                  placeholder="Cari penerima / subjek..."
                  allowClear
                  onSearch={setLogSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
              </Col>
              <Col xs={12} sm={5}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Semua Status"
                  allowClear
                  value={logFilterStatus || undefined}
                  onChange={setLogFilterStatus}
                  options={[
                    { value: '', label: 'Semua Status' },
                    { value: 'sent', label: 'Sent (Berhasil)' },
                    { value: 'simulated', label: 'Simulated (Dev)' },
                    { value: 'failed', label: 'Failed (Gagal)' },
                  ]}
                />
              </Col>
              <Col xs={12} sm={5}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Semua Tipe Event"
                  allowClear
                  value={logFilterEvent || undefined}
                  onChange={setLogFilterEvent}
                  options={[
                    { value: '', label: 'Semua Event' },
                    { value: 'portal_invitation', label: 'Portal Invitation' },
                    { value: 'hired_broadcast', label: 'Hired Broadcast' },
                    { value: 'manual_broadcast', label: 'Manual Broadcast' },
                    { value: 'smtp_diagnostic_test', label: 'Diagnostic Test' },
                    { value: 'stage_update', label: 'Tahapan Seleksi' },
                  ]}
                />
              </Col>
              <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
                <Button icon={<ReloadOutlined />} onClick={fetchLogs} loading={logsLoading}>
                  Muat Ulang Log
                </Button>
              </Col>
            </Row>

            <Table
              dataSource={filteredLogs.map((l) => ({ ...l, key: l.id }))}
              loading={logsLoading}
              pagination={{ pageSize: 12, showTotal: (total) => `Total ${total} riwayat log` }}
              columns={[
                {
                  title: 'Waktu Pengiriman',
                  dataIndex: 'sent_at',
                  key: 'sent_at',
                  width: 170,
                  render: (val) => (val ? dayjs(val).format('DD MMM YYYY, HH:mm') : '-'),
                },
                {
                  title: 'Penerima',
                  key: 'recipient',
                  render: (_, r) => (
                    <div>
                      <strong>{r.recipient_name || 'Internal Team'}</strong>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{r.recipient_email}</div>
                      {r.recipient_role && <Tag color="default" style={{ fontSize: 10 }}>{r.recipient_role}</Tag>}
                    </div>
                  ),
                },
                {
                  title: 'Subjek Email',
                  dataIndex: 'subject',
                  key: 'subject',
                  ellipsis: true,
                },
                {
                  title: 'Tipe Event',
                  dataIndex: 'event_type',
                  key: 'event_type',
                  width: 150,
                  render: (evt) => {
                    const colorMap = {
                      hired_broadcast: 'green',
                      portal_invitation: 'blue',
                      manual_broadcast: 'purple',
                      smtp_diagnostic_test: 'cyan',
                      stage_update: 'orange',
                    };
                    return <Tag color={colorMap[evt] || 'default'}>{evt || 'general'}</Tag>;
                  },
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  width: 110,
                  render: (st) => {
                    if (st === 'sent') return <Tag color="success">SENT</Tag>;
                    if (st === 'simulated') return <Tag color="processing">SIMULATED</Tag>;
                    return <Tag color="error">FAILED</Tag>;
                  },
                },
                {
                  title: 'Aksi',
                  key: 'action',
                  width: 70,
                  align: 'center',
                  render: (_, r) => (
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      size="small"
                      onClick={() => setSelectedLog(r)}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Modal Detail Log */}
      <Modal
        title="Detail Audit Log Email"
        open={Boolean(selectedLog)}
        onCancel={() => setSelectedLog(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedLog(null)}>
            Tutup
          </Button>,
        ]}
        width={680}
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Penerima">{selectedLog.recipient_name} ({selectedLog.recipient_email})</Descriptions.Item>
              <Descriptions.Item label="Subjek">{selectedLog.subject}</Descriptions.Item>
              <Descriptions.Item label="Waktu">{dayjs(selectedLog.sent_at).format('DD MMMM YYYY, HH:mm:ss')} WIB</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedLog.status === 'sent' ? 'success' : selectedLog.status === 'simulated' ? 'processing' : 'error'}>
                  {selectedLog.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tipe Event">{selectedLog.event_type}</Descriptions.Item>
              {selectedLog.error_message && (
                <Descriptions.Item label="Pesan Error">
                  <Text type="danger">{selectedLog.error_message}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}

