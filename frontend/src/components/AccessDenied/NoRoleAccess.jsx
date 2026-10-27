import { Result, Button, Card, Typography, Space } from 'antd';
import { LockOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text, Title, Paragraph } = Typography;

export default function NoRoleAccess({ username }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '75vh',
        padding: '24px',
      }}
    >
      <Card
        style={{
          maxWidth: 580,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          border: '1px solid #fed7aa',
          background: '#fff',
          textAlign: 'center',
          padding: '20px 10px',
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: '2px solid #fdba74',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.15)',
          }}
        >
          <LockOutlined style={{ fontSize: 36, color: '#ea580c' }} />
        </div>

        <Title level={3} style={{ marginBottom: 8, color: '#1e293b' }}>
          Akses Menu Belum Diberikan
        </Title>

        <Paragraph style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
          Akun Anda <Text strong style={{ color: '#0f172a' }}>{username ? `@${username}` : ''}</Text> saat ini belum terhubung dengan <b>Role Group</b> backoffice aktif.
          <br />
          Sesuai standar keamanan sistem, akses ke seluruh menu dan data operasional dinonaktifkan secara default.
        </Paragraph>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 24,
            textAlign: 'left',
          }}
        >
          <Text style={{ fontSize: 13, color: '#475569', display: 'block' }}>
            💡 <b>Langkah Selanjutnya:</b>
          </Text>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 13, color: '#64748b' }}>
            <li>Hubungi Administrator atau HR untuk mengalokasikan Role Group ke akun Anda.</li>
            <li>Setelah hak akses diberikan, silakan muat ulang (refresh) halaman ini.</li>
          </ul>
        </div>

        <Space size="middle" wrap style={{ justifyContent: 'center' }}>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            size="large"
            style={{ borderRadius: 8 }}
            onClick={() => navigate('/logout')}
          >
            Keluar (Logout)
          </Button>
          <Button
            icon={<UserOutlined />}
            size="large"
            style={{ borderRadius: 8 }}
            onClick={() => navigate('/profile')}
          >
            Profil Saya
          </Button>
        </Space>
      </Card>
    </div>
  );
}
