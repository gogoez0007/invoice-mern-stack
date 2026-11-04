import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Switch,
  Typography,
  message,
  Alert,
  Space,
  Row,
  Col,
  Divider,
  Tag,
  Tooltip,
} from 'antd';
import {
  MailOutlined,
  SaveOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { leaveApprovalService } from '@/request/leaveApprovalService';
import useResponsive from '@/hooks/useResponsive';

const { Title, Text, Paragraph } = Typography;

export default function LeaveEmailConfigPage() {
  const { isMobile } = useResponsive();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Test Email State
  const [testing, setTesting] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState('');
  const [testResult, setTestResult] = useState(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await leaveApprovalService.getEmailConfig();
      if (res.success && res.data) {
        form.setFieldsValue({
          smtp_host: res.data.smtp_host || 'mailinbox.delmargroup.co.id',
          smtp_port: parseInt(res.data.smtp_port || '1081', 10),
          smtp_secure: res.data.smtp_secure || 'ssl',
          smtp_user: res.data.smtp_user || '',
          smtp_pass: res.data.smtp_has_pass ? '••••••••' : '',
          from_name: res.data.from_name || 'HRD Hermes360 - Izin Karyawan',
          from_email: res.data.from_email || 'recruitment@delmargroup.id',
        });
        if (!testEmailInput) {
          setTestEmailInput(res.data.from_email || 'recruitment@delmargroup.id');
        }
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal mengambil konfigurasi email dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const res = await leaveApprovalService.updateEmailConfig(values);
      if (res.success) {
        message.success('Konfigurasi server email berhasil disimpan!');
        fetchConfig();
      } else {
        message.error(res.message || 'Gagal menyimpan konfigurasi.');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || err.message || 'Gagal menyimpan konfigurasi.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testEmailInput || !testEmailInput.includes('@')) {
      message.warning('Masukkan alamat email tujuan pengujian yang valid.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const values = form.getFieldsValue();
      const payload = {
        ...values,
        target_email: testEmailInput.trim(),
      };

      const res = await leaveApprovalService.testEmailConfig(payload);
      if (res.success) {
        setTestResult({
          status: 'success',
          message: res.message || 'Koneksi TCP socket dan pengiriman email berhasil!',
          details: res.result,
        });
        message.success('Uji coba koneksi SMTP sukses!');
      } else {
        setTestResult({
          status: 'error',
          message: res.message || 'Gagal terhubung ke server SMTP.',
        });
        message.error(res.message || 'Pengujian gagal.');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat pengujian SMTP.';
      setTestResult({
        status: 'error',
        message: errMsg,
      });
      message.error(errMsg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ padding: isMobile ? 12 : 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header Banner */}
      <Card
        className="shadow-sm"
        style={{
          marginBottom: 20,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #38bdf8 100%)',
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
                <MailOutlined style={{ fontSize: 28, color: '#ffffff' }} />
              </div>
              <div>
                <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  Setup Server Email Approval Izin
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: 13.5 }}>
                  Konfigurasi server SMTP untuk pengiriman otomatis notifikasi persetujuan izin kepada approver eksternal.
                  Mendukung <strong>port kustom</strong> (misalnya port 1081, 587, 465, 25, 2525) dan handshake diagnostik real-time.
                </Paragraph>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: isMobile ? 'left' : 'right' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchConfig}
              loading={loading}
              style={{ borderRadius: 8 }}
            >
              Muat Ulang
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Form Configuration Column */}
        <Col xs={24} lg={15}>
          <Card
            title={
              <Space>
                <ApiOutlined style={{ color: '#2563eb' }} />
                <span>Parameter Server SMTP</span>
                <Tag color="cyan">Dukungan Port Kustom Aktif</Tag>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={{
                smtp_port: 1081,
                smtp_secure: 'ssl',
              }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={16}>
                  <Form.Item
                    name="smtp_host"
                    label="SMTP Host / Server"
                    rules={[{ required: true, message: 'SMTP Host wajib diisi' }]}
                    extra="Nama domain atau IP server surat keluar (contoh: mailinbox.delmargroup.co.id, smtp.gmail.com)"
                  >
                    <Input placeholder="mailinbox.delmargroup.co.id" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="smtp_port"
                    label={
                      <Space>
                        <span>Port SMTP</span>
                        <Tag color="geekblue" style={{ fontSize: 11 }}>
                          Bisa Custom Port!
                        </Tag>
                      </Space>
                    }
                    rules={[{ required: true, message: 'Port wajib diisi' }]}
                    extra="Port bebas: 1081, 465, 587, 25, 2525"
                  >
                    <InputNumber
                      min={1}
                      max={65535}
                      style={{ width: '100%', borderRadius: 6 }}
                      placeholder="1081"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="smtp_secure"
                    label="Protokol Keamanan / Enkripsi"
                    rules={[{ required: true }]}
                  >
                    <Select style={{ borderRadius: 6 }}>
                      <Select.Option value="ssl">SSL / TLS (Direct TLS, port 465 / 1081)</Select.Option>
                      <Select.Option value="starttls">STARTTLS (Opportunistic TLS, port 587)</Select.Option>
                      <Select.Option value="tls">TLS Standard</Select.Option>
                      <Select.Option value="none">Tanpa Enkripsi (Plain Text, port 25)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="smtp_user"
                    label="Username SMTP / Akun"
                    rules={[{ required: true, message: 'Username SMTP wajib diisi' }]}
                  >
                    <Input placeholder="info@nuseafood.com" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={24}>
                  <Form.Item
                    name="smtp_pass"
                    label="Password SMTP"
                    extra="Biarkan berisi bulatan sandi jika tidak ingin mengubah password yang tersimpan."
                  >
                    <Input.Password
                      placeholder="Masukkan password akun SMTP"
                      prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                      style={{ borderRadius: 6 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }} />

              <Title level={5} style={{ margin: '0 0 12px', color: '#1e293b' }}>
                Identitas Pengirim (From Header)
              </Title>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="from_name"
                    label="Nama Pengirim (Sender Name)"
                    rules={[{ required: true, message: 'Nama pengirim wajib diisi' }]}
                  >
                    <Input placeholder="HRD Hermes360 - Izin Karyawan" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="from_email"
                    label="Alamat Email Pengirim (From Email)"
                    rules={[{ required: true, type: 'email', message: 'Email pengirim tidak valid' }]}
                  >
                    <Input placeholder="recruitment@delmargroup.id" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  size="large"
                  style={{
                    borderRadius: 8,
                    background: '#2563eb',
                    borderColor: '#2563eb',
                    fontWeight: 600,
                  }}
                >
                  Simpan Konfigurasi Email
                </Button>
              </div>
            </Form>
          </Card>
        </Col>

        {/* Diagnostics & Testing Column */}
        <Col xs={24} lg={9}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#ea580c' }} />
                <span>Uji Koneksi & Handshake</span>
              </Space>
            }
            style={{ borderRadius: 12, marginBottom: 20 }}
          >
            <Paragraph style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Lakukan pengujian langsung ke port kustom server SMTP Anda. Sistem akan melakukan tes socket TCP
              dan mengirimkan email diagnostik ke alamat yang Anda tentukan.
            </Paragraph>

            <Form.Item label="Email Tujuan Pengujian" style={{ marginBottom: 12 }}>
              <Input
                placeholder="nama@delmargroup.id"
                value={testEmailInput}
                onChange={(e) => setTestEmailInput(e.target.value)}
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleTestConnection}
              loading={testing}
              block
              style={{
                borderRadius: 8,
                background: '#ea580c',
                borderColor: '#ea580c',
                fontWeight: 600,
                height: 40,
              }}
            >
              Uji Koneksi & Kirim Email Test
            </Button>

            {testResult && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  type={testResult.status === 'success' ? 'success' : 'error'}
                  message={
                    <Text strong style={{ fontSize: 13.5 }}>
                      {testResult.status === 'success' ? 'Pengujian Sukses!' : 'Pengujian Gagal'}
                    </Text>
                  }
                  description={
                    <div style={{ fontSize: 12.5, marginTop: 4 }}>
                      <p style={{ margin: '0 0 6px' }}>{testResult.message}</p>
                      {testResult.details && (
                        <div style={{ background: 'rgba(0,0,0,0.03)', padding: 8, borderRadius: 6 }}>
                          <div><strong>Host:</strong> {testResult.details.host}:{testResult.details.port}</div>
                          <div><strong>Penerima:</strong> {testResult.details.recipient}</div>
                        </div>
                      )}
                    </div>
                  }
                  showIcon
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}
          </Card>

          <Card
            size="small"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
            }}
          >
            <Space align="start">
              <InfoCircleOutlined style={{ color: '#0284c7', fontSize: 18, marginTop: 2 }} />
              <div>
                <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                  Panduan Port Kustom
                </Text>
                <Paragraph style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Server email Delta Marine Group menggunakan port internal <strong>1081</strong> dengan protokol SSL/TLS.
                  Jika menggunakan penyedia lain (seperti Gmail atau Mailgun), gunakan port 587 (STARTTLS) atau 465 (SSL).
                </Paragraph>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

