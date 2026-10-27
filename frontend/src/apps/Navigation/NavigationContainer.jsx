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
  SafetyCertificateTwoTone,
} from '@ant-design/icons';

import { useAppContext } from '@/context/appContext';
import useLanguage from '@/locale/useLanguage';
import logoIcon from '@/style/images/logo-icon.svg';
import useResponsive from '@/hooks/useResponsive';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '@/config/serverApiConfig';

const { Sider } = Layout;

const isReviewer = ['cynthia', 'welli'];
const isAdmin = ['hindri3578', 'dini3515', 'herry3515'];
const isHR = ['silvya3515', 'jogi9104'];
const isAdminCban = ['dewi3515'];
const allowedReviewerKeys = ['dashboard', 'bongkar'];

const getMenuItems = (translate) => [
  {
    key: 'dashboard',
    icon: <DashboardTwoTone />,
    label: translate('dashboard'),
    style: {
      fontSize: 15,
      fontWeight: 600,
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
  {
    key: 'role_access',
    icon: <SafetyCertificateTwoTone />,
    label: <Link to="/role-access">Hak Akses Role</Link>,
  },
];

const filterMenuByRole = (items, currentAdmin, dynamicAllowedCodes) => {
  if (!currentAdmin) return [];

  // 1. Super Admin Role Group mendapatkan akses ke seluruh menu
  if (currentAdmin?.role_group?.code === 'SUPER_ADMIN' || currentAdmin?.username === 'taufik3301') {
    return items;
  }

  // 2. Ambil allowed menu codes dari hasil query database
  const allowedCodes = dynamicAllowedCodes || currentAdmin?.allowed_menu_codes;

  if (Array.isArray(allowedCodes) && allowedCodes.length > 0) {
    return items
      .map((parent) => {
        // Menu bercabang (punya children)
        if (parent.children && parent.children.length > 0) {
          const filteredChildren = parent.children.filter((child) =>
            allowedCodes.includes(child.key)
          );
          if (filteredChildren.length > 0 || allowedCodes.includes(parent.key)) {
            return {
              ...parent,
              children: filteredChildren,
            };
          }
          return null;
        }

        // Single Menu
        if (allowedCodes.includes(parent.key)) {
          return parent;
        }

        return null;
      })
      .filter(Boolean);
  }

  // 3. User yang belum memiliki role group TIDAK boleh mendapatkan akses ke menu apapun (Security Default: Deny)
  return [];
};

const applyMenuStyles = (items) => {
  return items.map((item) => {
    const styledItem = {
      ...item,
      style: {
        fontSize: 15,
        fontWeight: 600,
        ...(item.style || {}),
      },
    };

    if (item.children) {
      styledItem.children = item.children.map((child) => ({
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
  const [dynamicCodes, setDynamicCodes] = useState(currentAdmin?.allowed_menu_codes || null);
  const [collapsed, setCollapsed] = useState(isNavMenuClose);

  useEffect(() => {
    setCollapsed(isNavMenuClose);
  }, [isNavMenuClose]);

  const [currentPath, setCurrentPath] = useState(
    location.pathname === '/' ? 'dashboard' : location.pathname.slice(1)
  );
  const translate = useLanguage();

  useEffect(() => {
    if (currentAdmin?.username && !currentAdmin?.allowed_menu_codes) {
      fetch(`${API_BASE_URL}employees/permissions?username=${currentAdmin.username}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.result?.allowed_menu_codes) {
            setDynamicCodes(data.result.allowed_menu_codes);
            try {
              const authStr = window.localStorage.getItem('auth');
              if (authStr) {
                const parsed = JSON.parse(authStr);
                parsed.current.allowed_menu_codes = data.result.allowed_menu_codes;
                parsed.current.role_group = data.result.role_group;
                parsed.current.entity_scope = data.result.entity_scope;
                window.localStorage.setItem('auth', JSON.stringify(parsed));
              }
            } catch (_) {}
          }
        })
        .catch((err) => console.error('Failed to fetch user permissions:', err));
    }
  }, [currentAdmin?.username]);

  useEffect(() => {
    setCurrentPath(location.pathname === '/' ? 'dashboard' : location.pathname.slice(1));
  }, [location]);

  const onCollapse = (value) => {
    setCollapsed(value);
    navMenu.collapse();
  };

  const rawItems = getMenuItems(translate);
  const filteredItems = filterMenuByRole(rawItems, currentAdmin, dynamicCodes);
  const styledItems = applyMenuStyles(filteredItems);
  const defaultOpenMenu = rawItems
    .filter((item) => item.children)
    .map((item) => item.key);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      collapsedWidth={80}
      width={250}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        height: 'calc(100vh - 12px)',
        position: 'fixed',
        top: 6,
        left: 6,
        zIndex: 1000,
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
      }}
      theme="light"
    >
      <div
        style={{
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0,
          padding: '0 12px',
        }}
      >
        <img
          src={logoIcon}
          alt="Delta Marine Backoffice"
          style={{
            height: collapsed ? '26px' : '44px',
            maxWidth: '100%',
            objectFit: 'contain',
            transition: 'all 0.2s',
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: '28px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>🔒</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#262626', marginBottom: 4 }}>
              Akses Belum Diberikan
            </div>
            <div style={{ fontSize: 11, color: '#8c8c8c', lineHeight: 1.5 }}>
              Akun Anda belum memiliki Role Group. Silakan hubungi Administrator untuk mengatur hak akses menu.
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </Sider>
  );
}

function MobileSidebar() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const currentAdmin = useSelector(selectCurrentAdmin);
  const [dynamicCodes, setDynamicCodes] = useState(currentAdmin?.allowed_menu_codes || null);
  const translate = useLanguage();

  useEffect(() => {
    if (currentAdmin?.username && !currentAdmin?.allowed_menu_codes) {
      fetch(`${API_BASE_URL}employees/permissions?username=${currentAdmin.username}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.result?.allowed_menu_codes) {
            setDynamicCodes(data.result.allowed_menu_codes);
          }
        })
        .catch((err) => console.error('Failed to fetch user permissions:', err));
    }
  }, [currentAdmin?.username]);

  const [currentPath, setCurrentPath] = useState(
    location.pathname === '/' ? 'dashboard' : location.pathname.slice(1)
  );

  useEffect(() => {
    setCurrentPath(location.pathname === '/' ? 'dashboard' : location.pathname.slice(1));
    setVisible(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleToggle = () => setVisible((prev) => !prev);
    const handleOpen = () => setVisible(true);
    const handleClose = () => setVisible(false);

    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    window.addEventListener('open-mobile-sidebar', handleOpen);
    window.addEventListener('close-mobile-sidebar', handleClose);

    return () => {
      window.removeEventListener('toggle-mobile-sidebar', handleToggle);
      window.removeEventListener('open-mobile-sidebar', handleOpen);
      window.removeEventListener('close-mobile-sidebar', handleClose);
    };
  }, []);

  const onClose = () => setVisible(false);

  const rawItems = getMenuItems(translate);
  const filteredItems = filterMenuByRole(rawItems, currentAdmin, dynamicCodes);
  const styledItems = applyMenuStyles(filteredItems);
  const defaultOpenMenu = rawItems
    .filter((item) => item.children)
    .map((item) => item.key);

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={logoIcon}
            alt="Logo"
            style={{ height: 28, width: 'auto', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#262626' }}>Backoffice</span>
        </div>
      }
      placement="left"
      closable={true}
      onClose={onClose}
      open={visible}
      width={280}
      bodyStyle={{ padding: '8px 4px 24px', overflowY: 'auto' }}
      headerStyle={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}
    >
      {filteredItems.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#262626', marginBottom: 6 }}>
            Akses Belum Diberikan
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.5 }}>
            Akun Anda belum memiliki Role Group. Silakan hubungi Administrator untuk mengatur hak akses menu.
          </div>
        </div>
      ) : (
        <Menu
          items={styledItems}
          mode="inline"
          theme="light"
          defaultOpenKeys={defaultOpenMenu}
          selectedKeys={[currentPath]}
          onClick={onClose}
          style={{
            width: '100%',
            borderInlineEnd: 'none',
          }}
        />
      )}
    </Drawer>
  );
}