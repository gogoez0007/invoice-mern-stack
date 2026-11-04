import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  message,
  Row,
  Col,
  Form,
  Select,
  Switch,
  Divider,
  Alert,
  Tooltip,
  Tag,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  SendOutlined,
  LockOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { jobService } from '@/request/jobService';

const { Title, Text, Paragraph } = Typography;

export default function EmailConfigPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Test Handshake State
  const [handshakeLoading, setHandshakeLoading] = useState(false);
  const [handshakeResult, setHandshakeResult] = useState(null);

  // Test Send Email State
  const [testEmailInput, setTestEmailInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Load Settings
  const [hasStoredPassword, setHasStoredPassword] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await jobService.getNotificationSettings();
      if (res.success && res.data) {
        setHasStoredPassword(Boolean(res.data.smtp_has_pass));
        form.setFieldsValue({
          smtp_host: res.data.smtp_host || 'smtp.gmail.com',
          smtp_port: res.data.smtp_port || '587',
          smtp_secure: res.data.smtp_secure === '1' || res.data.smtp_secure === true,
          smtp_user: res.data.smtp_user || '',
          smtp_pass: res.data.smtp_has_pass ? '••••••••' : (res.data.smtp_pass || ''),
          smtp_from_name: res.data.smtp_from_name || 'Delta Marine Group HRD & Recruitment',
          smtp_from_email: res.data.smtp_from_email || 'recruitment@delmargroup.id',
          recruitment_team_email: res.data.recruitment_team_email || 'recruitment@delmargroup.id',
          portal_base_url: res.data.portal_base_url || 'http://localhost/delmargroup/career/',
        });
        if (!testEmailInput) {
          setTestEmailInput(res.data.recruitment_team_email || 'recruitment@delmargroup.id');
        }
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal memuat konfigurasi email.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = {
        settings: {
          smtp_host: values.smtp_host,
          smtp_port: values.smtp_port,
          smtp_secure: values.smtp_secure ? '1' : '0',
          smtp_user: values.smtp_user,
          smtp_pass: values.smtp_pass,
          smtp_from_name: values.smtp_from_name,
          smtp_from_email: values.smtp_from_email,
          recruitment_team_email: values.recruitment_team_email,
          portal_base_url: values.portal_base_url,
        },
      };
      const res = await jobService.updateNotificationSettings(payload);
      if (res.success) {
        message.success('Konfigurasi email & SMTP berhasil disimpan.');
      } else {
        message.error(res.message || 'Gagal menyimpan konfigurasi.');
      }
    } catch (err) {
      console.error(err);
      message.error('Terjadi kesalahan saat menyimpan konfigurasi.');
    } finally {
      setSaving(false);
    }
  };

  // Uji Handshake Socket Nyata Langsung ke Server SMTP
  const handleTestHandshake = async () => {
    const values = form.getFieldsValue();
    if (!values.smtp_host) {
      message.warning('Masukkan Host SMTP terlebih dahulu.');
      return;
    }
    if (!values.smtp_user || !values.smtp_pass) {
      message.warning('Username dan Password SMTP wajib diisi untuk menguji koneksi nyata.');
      return;
    }

    setHandshakeLoading(true);
    setHandshakeResult(null);

    try {
      const payload = {
        smtp_host: values.smtp_host,
        smtp_port: values.smtp_port || '587',
        smtp_secure: values.smtp_secure ? '1' : '0',
        smtp_user: values.smtp_user,
        smtp_pass: values.smtp_pass,
        smtp_from_name: values.smtp_from_name,
        smtp_from_email: values.smtp_from_email,
      };

      const res = await jobService.testSmtpHandshake(payload);
      if (res.success) {
        setHandshakeResult({
          type: 'success',
          message: res.message || 'Handshake socket dan autentikasi SMTP berhasil 100%!',
          data: res.data,
        });
        message.success('Koneksi SMTP Berhasil Terhubung!');
      } else {
        setHandshakeResult({
          type: 'error',
          message: res.message || 'Koneksi socket SMTP gagal.',
          code: res.code,
          hint: res.hint,
        });
        message.error('Koneksi SMTP Gagal.');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.message || err.message || 'Gagal menghubungi server backend.';
      const errCode = err?.response?.data?.code || 'SOCKET_ERROR';
      const errHint = err?.response?.data?.hint || null;
      setHandshakeResult({
        type: 'error',
        message: errMsg,
        code: errCode,
        hint: errHint,
      });
      message.error(errMsg);
    } finally {
      setHandshakeLoading(false);
    }
  };

  // Kirim Email Uji Coba Nyata
  const handleSendTestEmail = async () => {
    if (!testEmailInput || !testEmailInput.trim()) {
      message.warning('Masukkan alamat email tujuan pengujian.');
      return;
    }

    const formValues = form.getFieldsValue();
    if (!formValues.smtp_user || !formValues.smtp_pass) {
      message.warning('Kredensial Username & Password SMTP wajib diisi sebelum mengirim email nyata.');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const payload = {
        target_email: testEmailInput.trim(),
        smtp_host: formValues.smtp_host,
        smtp_port: formValues.smtp_port,
        smtp_secure: formValues.smtp_secure ? '1' : '0',
        smtp_user: formValues.smtp_user,
        smtp_pass: formValues.smtp_pass,
        smtp_from_name: formValues.smtp_from_name,
        smtp_from_email: formValues.smtp_from_email,
      };

      const res = await jobService.testEmail(payload);
      if (res.success) {
        setTestResult({
          type: 'success',
          message: res.message || 'Email uji coba nyata berhasil dikirim!',
          data: res.data,
        });
        message.success('Email uji coba nyata berhasil dikirim.');
      } else {
        setTestResult({
          type: 'error',
          message: res.message || 'Pengiriman email gagal.',
          code: res.code,
          hint: res.hint,
        });
        message.error(res.message || 'Gagal mengirim email uji coba.');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.message || err.message || 'Gagal mengirim email uji coba.';
      const errCode = err?.response?.data?.code;
      const errHint = err?.response?.data?.hint;
      setTestResult({
        type: 'error',
        message: errMsg,
        code: errCode,
        hint: errHint,
      });
      message.error(errMsg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ padding: '0 8px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0, color: '#0e3a64' }}>
              Konfigurasi Email
            </Title>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchSettings} loading={loading}>
                Segarkan
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => form.submit()}
                loading={saving}
                style={{ background: '#0e3a64', borderColor: '#0e3a64' }}
              >
                Simpan Konfigurasi
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Row gutter={[20, 20]}>
          {/* Kolom Kiri: Server SMTP & Autentikasi */}
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <SettingOutlined style={{ color: '#0284c7' }} />
                  <span>Pengaturan Server SMTP & Pengirim</span>
                </Space>
              }
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={16}>
                  <Form.Item
                    label="SMTP Host"
                    name="smtp_host"
                    rules={[{ required: true, message: 'Host SMTP wajib diisi' }]}
                    >
                    <Input placeholder="smtp.gmail.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="SMTP Port"
                    name="smtp_port"
                    rules={[{ required: true, message: 'Port SMTP wajib diisi' }]}
                    >
                    <Input placeholder="587" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Enkripsi SSL / Secure Connection"
                name="smtp_secure"
                valuePropName="checked"
                >
                <Switch checkedChildren="SSL (465)" unCheckedChildren="STARTTLS (587)" />
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Username / Email Akun SMTP"
                    name="smtp_user"
                    rules={[{ required: true, message: 'Username SMTP wajib diisi' }]}
                    >
                    <Input placeholder="recruitment@delmargroup.id" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Password / App Password"
                    name="smtp_pass"
                    rules={hasStoredPassword ? [] : [{ required: true, message: 'Password SMTP wajib diisi' }]}
                    >
                    <Input.Password placeholder="Password SMTP" prefix={<LockOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }} />

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nama Pengirim Resmi (From Name)"
                    name="smtp_from_name"
                    rules={[{ required: true, message: 'Nama pengirim wajib diisi' }]}
                  >
                    <Input placeholder="Nama pengirim" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Alamat Email Pengirim (From Address)"
                    name="smtp_from_email"
                    rules={[
                      { required: true, message: 'Email pengirim wajib diisi' },
                      { type: 'email', message: 'Format email tidak valid' },
                    ]}
                  >
                    <Input placeholder="recruitment@delmargroup.id" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Inbox Tim Rekrutmen (Reply-To / CC)"
                    name="recruitment_team_email"
                    rules={[{ required: true, message: 'Email tim rekrutmen wajib diisi' }]}
                  >
                    <Input placeholder="recruitment@delmargroup.id" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Base URL Portal Karir"
                    name="portal_base_url"
                    rules={[{ required: true, message: 'Base URL portal karir wajib diisi' }]}
                    >
                    <Input placeholder="URL portal karir" prefix={<GlobalOutlined />} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Kolom Kanan: Uji Koneksi Nyata (Handshake Socket & Test Send) */}
          <Col xs={24} lg={10}>
            {/* Card 1: Handshake Socket Test */}
            <Card
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#eab308' }} />
                  <span>1. Tes Handshake Koneksi Server SMTP</span>
                </Space>
              }
              bordered={false}
              style={{ borderRadius: 10, marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
            >
              <Paragraph style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                Melakukan pengujian soket TCP dan pertukaran kredensial langsung ke server SMTP untuk memastikan koneksi tidak diblokir firewall atau salah password.
              </Paragraph>

              <Button
                type="primary"
                icon={<ApiOutlined />}
                block
                size="large"
                loading={handshakeLoading}
                onClick={handleTestHandshake}
                style={{ background: '#0e3a64', borderColor: '#0e3a64', fontWeight: 600 }}
              >
                Uji Handshake Koneksi Socket SMTP
              </Button>

              {handshakeResult && (
                <div style={{ marginTop: 14 }}>
                  <Alert
                    message={
                      <span style={{ fontWeight: 700 }}>
                        {handshakeResult.type === 'success' ? '✓ Handshake SMTP Berhasil' : '✕ Koneksi SMTP Gagal'}
                      </span>
                    }
                    description={
                      <div>
                        <p style={{ margin: '4px 0 6px', fontSize: 13 }}>{handshakeResult.message}</p>
                        {handshakeResult.code && (
                          <Tag color="red" style={{ fontWeight: 600, marginBottom: 6 }}>
                            Kode Error: {handshakeResult.code}
                          </Tag>
                        )}
                        {handshakeResult.hint && (
                          <div
                            style={{
                              marginTop: 6,
                              padding: '8px 10px',
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              borderRadius: 6,
                              fontSize: 12.5,
                              color: '#9f1239',
                            }}
                          >
                            <InfoCircleOutlined style={{ marginRight: 6 }} />
                            <strong>Petunjuk Solusi:</strong> {handshakeResult.hint}
                          </div>
                        )}
                      </div>
                    }
                    type={handshakeResult.type}
                    showIcon
                  />
                </div>
              )}
            </Card>

            {/* Card 2: Send Real Test Email */}
            <Card
              title={
                <Space>
                  <SendOutlined style={{ color: '#16a34a' }} />
                  <span>2. Kirim Email Uji Coba Nyata</span>
                </Space>
              }
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
            >
              <Form.Item label="Alamat Email Tujuan Pengujian" style={{ marginBottom: 12 }}>
                <Input
                  placeholder="Email tujuan pengujian"
                  value={testEmailInput}
                  onChange={(e) => setTestEmailInput(e.target.value)}
                />
              </Form.Item>

              <Button
                type="dashed"
                icon={<SendOutlined />}
                block
                size="large"
                loading={testing}
                onClick={handleSendTestEmail}
                style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 600 }}
              >
                Kirim Email Uji Coba Sekarang
              </Button>

              {testResult && (
                <div style={{ marginTop: 14 }}>
                  <Alert
                    message={
                      <span style={{ fontWeight: 700 }}>
                        {testResult.type === 'success' ? '✓ Email Nyata Terkirim' : '✕ Pengiriman Email Gagal'}
                      </span>
                    }
                    description={
                      <div>
                        <p style={{ margin: '4px 0 6px', fontSize: 13 }}>{testResult.message}</p>
                        {testResult.data?.messageId && (
                          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                            Message ID: {testResult.data.messageId}
                          </span>
                        )}
                        {testResult.hint && (
                          <div
                            style={{
                              marginTop: 6,
                              padding: '8px 10px',
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              borderRadius: 6,
                              fontSize: 12.5,
                              color: '#9f1239',
                            }}
                          >
                            <InfoCircleOutlined style={{ marginRight: 6 }} />
                            {testResult.hint}
                          </div>
                        )}
                      </div>
                    }
                    type={testResult.type}
                    showIcon
                  />
                </div>
              )}

              <Divider style={{ margin: '18px 0 14px' }} />

              <div style={{ background: '#f8fafc', padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
                <Text strong style={{ display: 'block', marginBottom: 4, color: '#334155' }}>
                  Panduan Autentikasi SMTP:
                </Text>
                <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                  <li><strong>Gmail / Google Workspace:</strong> Wajib aktifkan 2-Step Verification, lalu buat 16-digit <em>App Password</em> (Keamanan Akun Google &gt; Sandi Aplikasi).</li>
                  <li><strong>Port & Enkripsi:</strong> Port 587 menggunakan STARTTLS (SSL switch nonaktif). Port 465 menggunakan SSL langsung (SSL switch aktif).</li>
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
