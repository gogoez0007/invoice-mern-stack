import { Result, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined, UserOutlined } from '@ant-design/icons';

export default function ForbiddenAccess({ roleName, path, homePath = '/' }) {
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
      <Result
        status="403"
        title="403 - Akses Ditolak"
        subTitle={
          <div style={{ maxWidth: 520, margin: '0 auto', color: '#64748b', fontSize: 14 }}>
            Role akun Anda {roleName ? <b>({roleName})</b> : ''} tidak memiliki izin untuk membuka halaman{' '}
            <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#0f172a' }}>
              {path}
            </code>
            .<br />
            Silakan hubungi Administrator jika Anda membutuhkan hak akses ke modul ini.
          </div>
        }
        extra={
          <Space size="middle">
            <Button
              type="primary"
              icon={<HomeOutlined />}
              size="large"
              style={{ borderRadius: 8 }}
              onClick={() => navigate(homePath)}
            >
              Halaman Utama
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
        }
      />
    </div>
  );
}
