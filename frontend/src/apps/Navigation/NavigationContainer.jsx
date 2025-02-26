import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  HeatMapOutlined,
  CarOutlined,
  MenuOutlined,
  SettingOutlined,
  BuildTwoTone,
} from '@ant-design/icons';

import { useAppContext } from '@/context/appContext';
import useLanguage from '@/locale/useLanguage';
import logoIcon from '@/style/images/logo-icon.svg';
import useResponsive from '@/hooks/useResponsive';

const { Sider } = Layout;

export default function Navigation() {
  const { isMobile } = useResponsive();
  return isMobile ? <MobileSidebar /> : <Sidebar collapsible={true} />;
}

function Sidebar({ collapsible, isMobile = false }) {
  const location = useLocation();
  const { state: stateApp, appContextAction } = useAppContext();
  const { isNavMenuClose } = stateApp;
  const { navMenu } = appContextAction;

  const [collapsed, setCollapsed] = useState(isNavMenuClose);
  const [currentPath, setCurrentPath] = useState(location.pathname.slice(1));
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const translate = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (location) {
      if (currentPath !== location.pathname) {
        setCurrentPath(location.pathname === '/' ? 'dashboard' : location.pathname.slice(1));
      }
    }
  }, [location, currentPath]);

  const onCollapse = (value) => {
    setCollapsed(value);
    navMenu.collapse();
  };

  const items = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/">{translate('dashboard')}</Link>,
    },
    {
      key: 'tambak',
      icon: <AppstoreOutlined />,
      label: translate('Data Tambak'),
      children: [
        {
          key: 'tambak/list',
          label: <Link to="/tambak">Daftar Tambak</Link>,
        },
      ],
    },
    {
      key: 'kualitas',
      icon: <HeatMapOutlined />,
      label: translate('Data Kualitas'),
      children: [
        {
          key: 'kualitas/list',
          label: <Link to="/kualitas">List Kualitas</Link>,
        },
      ],
    },
    {
      key: 'listDriver',
      icon: <CarOutlined />,
      label: translate('Data Driver'),
      children: [
        {
          key: 'driver',
          label: <Link to="/driver">List Driver</Link>,
        },
      ],
    },
    {
      key: 'manageHR',
      icon: <BuildTwoTone />,
      label: translate('Manajemen Karyawan'),
      children: [
        {
          key: 'karyawan',
          label: <Link to="/karyawan">Karyawan</Link>,
        },
        {
          key: 'lokasi',
          label: <Link to="/lokasi">Lokasi Office</Link>,
        },
        {
          key: 'shift',
          label: <Link to="/shift">Shift</Link>,
        },
      ],
    },
  ];

  return (
    <Sider
      collapsible={collapsible}
      collapsed={collapsed}
      onCollapse={onCollapse}
      collapsedWidth={isMobile ? 0 : 80}
      width={windowWidth > 1900 ? 230 : 80}
      style={{
        overflow: 'hidden',
        height: '92vh',
        position: 'fixed',
        top: 10,
        left: 10,
        transition: 'all 0.3s',
        zIndex: 100,
        borderRadius: '16px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff',
      }}
      theme="light"
      breakpoint="lg"
      onBreakpoint={(broken) => setCollapsed(broken)}
    >
      <div
        style={{
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
          flexShrink: 0,
        }}
      >
        <img
          src={logoIcon}
          alt="Logo"
          style={{
            height: collapsed ? '40px' : '80px',
            width: 'auto',
            objectFit: 'contain',
            transition: 'all 0.2s',
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Menu
          items={items}
          mode="inline"
          theme="light"
          selectedKeys={[currentPath]}
          defaultOpenKeys={!collapsed ? ['tambak', 'kualitas', 'driver'] : []}
          style={{
            width: '100%',
            borderInlineEnd: 'none',
            paddingInline: '10px',
            borderRadius: '10px',
          }}
        />
      </div>
      <style>{`
        @media (max-width: 768px) {
          .ant-layout-sider {
            width: 100% !important;
            position: absolute !important;
            height: 100vh !important;
            top: 0 !important;
            left: 0 !important;
            z-index: 1000 !important;
          }
        }
      `}</style>
    </Sider>
  );
}

function MobileSidebar() {
  const [visible, setVisible] = useState(false);
  const showDrawer = () => setVisible(true);
  const onClose = () => setVisible(false);

  return (
    <>
      <Button
        type="text"
        size="large"
        onClick={showDrawer}
        style={{
          marginLeft: 25,
          position: 'fixed',
          top: 20,
          zIndex: 103,
        }}
      >
        <MenuOutlined style={{ fontSize: 18 }} />
      </Button>
      <Drawer
        width={window.innerWidth * 0.8}
        placement="left"
        closable={false}
        onClose={onClose}
        open={visible}
      >
        <Sidebar collapsible={false} isMobile={true} />
      </Drawer>
    </>
  );
}
