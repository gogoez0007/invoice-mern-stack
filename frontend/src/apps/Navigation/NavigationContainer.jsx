import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Layout, Menu } from 'antd';
import {
  MenuOutlined,
  BuildTwoTone,
  CarTwoTone,
  ContainerTwoTone,
  AppstoreTwoTone,
  DashboardTwoTone,
  AccountBookTwoTone,
  BoxPlotTwoTone,
} from '@ant-design/icons';

import { useAppContext } from '@/context/appContext';
import useLanguage from '@/locale/useLanguage';
import logoIcon from '@/style/images/logo-icon.svg';
import useResponsive from '@/hooks/useResponsive';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { useSelector } from 'react-redux';

const { Sider } = Layout;

export default function Navigation() {
  const { isMobile } = useResponsive();
  return isMobile ? <MobileSidebar /> : <Sidebar />;
}

function Sidebar() {
  const location = useLocation();
  const { state: stateApp, appContextAction } = useAppContext();
  const { isNavMenuClose } = stateApp;
  const { navMenu } = appContextAction;

  const currentAdmin = useSelector(selectCurrentAdmin);

  const isReviewer = ['cynthia', 'welli'];
  const isAdmin = ['hindri3578', 'dini3515', 'herry3515'];
  const isHR = ['silvya3515', 'jogi9104']; // tambahkan isHR
  const isAdminCban = ['dewi3515'];
  const [collapsed, setCollapsed] = useState(isNavMenuClose);
  const [currentPath, setCurrentPath] = useState(
    location.pathname === '/' ? 'dashboard' : location.pathname.slice(1)
  );
  const translate = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Efek untuk mendeteksi perubahan rute
    setCurrentPath(location.pathname === '/' ? 'dashboard' : location.pathname.slice(1));
  }, [location]);

  const onCollapse = (value) => {
    setCollapsed(value);
    navMenu.collapse();
  };

  let items = [
    {
      key: 'dashboard',
      icon: <DashboardTwoTone />,
      label: translate('dashboard'),
      style: {
        fontSize: 15,
        fontWeight: 600, // menu utama
      },
      children: [
        {
          key: 'dashboard_panen',
          label: <Link to="/dashboard_panen">Panen</Link>,
        },
        {
          key: 'dashboard_absen',
          label: <Link to="/">Absen</Link>,
        },
        {
          key: 'dashboard_bongkar',
          label: <Link to="/dashboard_bongkar">Bongkar</Link>,
        },
        {
          key: 'summary_percentage',
          label: <Link to="/review/summary_percentage">Analisa randeman (%)</Link>,
        },
        {
          key: 'productivity',
          label: <Link to="/dashboard_productivity">Produktivias Truck</Link>,
        },
        {
          key: 'summary_ponds',
          label: <Link to="/dashboard_ponds">Analisa Kolam</Link>,
        },
        {
          key: 'dashboard_sales',
          label: <Link to="/dashboard_sales">Sales</Link>,
        },
      ],
    },
    {
      key: 'panen',
      icon: <AccountBookTwoTone />,
      label: <Link to="/panen">{translate('Data panen')}</Link>,
    },
    {
      key: 'bongkar',
      icon: <BoxPlotTwoTone />,
      label: translate('Data Penjualan'),
      children: [
        {
          key: 'bongkar/list',
          label: <Link to="/bongkar">List Penjualan</Link>,
        },
        {
          key: 'review',
          label: <Link to="/review">Review</Link>,
        },
        {
          key: 'review_process',
          label: <Link to="/review/process">Proses Review</Link>,
        },
      ],
    },
    {
      key: 'SPB',
      icon: <BoxPlotTwoTone />,
      label: translate('Permintaan Barang'),
      children: [
        {
          key: 'spb/list',
          label: <Link to="/spb">List SPB</Link>,
        },
      ],
    },
    {
      key: 'tambak',
      icon: <AppstoreTwoTone />,
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
      icon: <ContainerTwoTone />,
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
      icon: <CarTwoTone />,
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
          key: 'kpi',
          label: <Link to="/kpi">Daftar KPI</Link>,
        },
        {
          key: 'lokasi',
          label: <Link to="/lokasi">Lokasi Office</Link>,
        },
        {
          key: 'shift',
          label: <Link to="/shift">Shift</Link>,
        },
        {
          key: 'shift_schedule',
          label: <Link to="/shift/shift_schedule">Schedule Shift</Link>,
        },
        {
          key: 'manage_attendance',
          label: <Link to="/attendance/manage">Manage Attendance</Link>,
        },
        {
          key: 'manage_employee',
          label: <Link to="/employee/manage">Manage Karyawan</Link>,
        },
        {
          key: 'off_schedules',
          label: <Link to="/off_schedules">Libur Karyawan</Link>,
        },
        {
          key: 'holidays',
          label: <Link to="/holidays">Manage Hari Libur</Link>,
        },
        {
          key: 'agreements',
          label: <Link to="/agreements">Daftar Agreements</Link>,
        },
        {
          key: 'driver_loans',
          label: <Link to="/driver-loans">Daftar Pinjaman Driver</Link>,
        },
      ],
    },
  ];

  const filterMenuByRole = (items, username) => {
    if (isReviewer.includes(username)) {
      return items
        .filter(item => allowedReviewerKeys.includes(item.key))
        .map(item => {
          if (item.key === 'dashboard') {
            item.children = item.children?.filter(child =>
              ['dashboard_panen', 'dashboard_bongkar', 'summary_percentage', 'productivity'].includes(child.key)
            );
          }

          if (item.key === 'bongkar') {
            item.children = item.children?.filter(child => child.key === 'review');
          }

          return item;
        });
    }

    if (isAdmin.includes(username)) {
      const allowedAdminKeys = ['panen', 'bongkar', 'tambak', 'kualitas', 'listDriver', 'SPB'];

      return items.filter(item => allowedAdminKeys.includes(item.key));
    }

    if (isHR.includes(username)) {
      return items.filter(item => item.key === 'dashboard' || item.key === 'manageHR').map(item => {
        if (item.key === 'dashboard') {
          item.children = item.children?.filter(child => child.key === 'dashboard_absen');
        }
        return item;
      });
    }
    if (isAdminCban.includes(username)) {
      return items.filter(item => item.key === 'manageHR').map(item => {
        if (item.key === 'manageHR') {
          item.children = item.children?.filter(child => child.key === 'agreements' || child.key === 'driver_loans');
        }
        return item;
      });
    }

    return items;
  };

  const applyMenuStyles = (items) => {
    return items.map(item => {
      const styledItem = {
        ...item,
        style: {
          fontSize: 15,
          fontWeight: 600,
          ...(item.style || {}),
        },
      };

      if (item.children) {
        styledItem.children = item.children.map(child => ({
          ...child,
          style: {
            fontSize: 14,
            fontWeight: 400,
            color: '#555555',
            ...(child.style || {}),
          },
        }));
      }

      return styledItem;
    });
  };

  // Filter menu sesuai role
  let filteredItems = filterMenuByRole(items, currentAdmin?.username);

  // Apply default style
  const styledItems = applyMenuStyles(filteredItems);
  const defaultOpenMenu = items
    .filter(item => item.children) // Ambil hanya menu yang memiliki anak
    .map(item => item.key);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        top: 6,
        left: 6,
        zIndex: 100,
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      }}
      theme="light"
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
            height: collapsed ? '20px' : '50px',
            width: 'auto',
            objectFit: 'contain',
            transition: 'all 0.2s',
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Menu
          items={styledItems}
          mode="inline"
          theme="light"
          defaultOpenKeys={defaultOpenMenu}
          selectedKeys={[currentPath]}
          style={{
            width: '100%',
            borderInlineEnd: 'none',
            paddingInline: '10px',
            borderRadius: '10px',
          }}
        />
      </div>
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
          top: 20,
          zIndex: 1000, // Higher z-index
          position: 'fixed',
        }}
      >
        <MenuOutlined style={{ fontSize: 18 }} />
      </Button>
      <Drawer
        title="Menu"
        placement="left"
        closable={true}
        onClose={onClose}
        open={visible}
        width="65%"
      >
        <Sidebar />
      </Drawer>
    </>
  );
}