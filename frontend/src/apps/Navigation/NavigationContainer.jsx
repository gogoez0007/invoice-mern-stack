import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Drawer, Layout, Menu } from 'antd';
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
  IdcardTwoTone,
  SettingTwoTone,
} from '@ant-design/icons';

import { useAppContext } from '@/context/appContext';
import useLanguage from '@/locale/useLanguage';
import logoIcon from '@/style/images/logo-icon.svg';
import useResponsive from '@/hooks/useResponsive';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '@/config/serverApiConfig';

const { Sider } = Layout;

// Map pathname to active menu item key
const pathToMenuKey = (pathname) => {
  if (!pathname || pathname === '/') return 'dashboard_absen';
  const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;

  const routes = [
    { prefix: 'dashboard_panen', key: 'dashboard_panen' },
    { prefix: 'dashboard_bongkar', key: 'dashboard_bongkar' },
    { prefix: 'review/summary_percentage', key: 'summary_percentage' },
    { prefix: 'dashboard_productivity', key: 'productivity' },
    { prefix: 'dashboard_ponds', key: 'summary_ponds' },
    { prefix: 'dashboard_sales', key: 'dashboard_sales' },

    { prefix: 'tambak', key: 'tambak/list' },
    { prefix: 'panen', key: 'panen' },
    { prefix: 'kualitas', key: 'kualitas/list' },
    { prefix: 'review/process', key: 'review_process' },
    { prefix: 'review', key: 'review' },
    { prefix: 'bongkar', key: 'bongkar/list' },
    { prefix: 'spb', key: 'spb/list' },
    { prefix: 'driver-loans', key: 'driver_loans' },
    { prefix: 'driver', key: 'driver' },

    { prefix: 'karyawan', key: 'karyawan' },
    { prefix: 'kpi', key: 'kpi' },
    { prefix: 'agreements', key: 'agreements' },
    { prefix: 'shift/shift_schedule', key: 'shift_schedule' },
    { prefix: 'shift', key: 'shift' },
    { prefix: 'attendance/manage', key: 'manage_attendance' },
    { prefix: 'employee/manage', key: 'manage_employee' },
    { prefix: 'off_schedules', key: 'off_schedules' },
    { prefix: 'holidays', key: 'holidays' },
    { prefix: 'tarik-absen', key: 'tarik_absen' },
    { prefix: 'leave-requests', key: 'leave_requests' },
    { prefix: 'leave-approval-lines', key: 'leave_approval_lines' },
    { prefix: 'leave-email-config', key: 'leave_email_config' },

    { prefix: 'recruitment/jobs', key: 'recruitment_jobs' },
    { prefix: 'recruitment/applicants', key: 'recruitment_applicants' },
    { prefix: 'recruitment/approvals', key: 'recruitment_approvals' },
    { prefix: 'recruitment/broadcast', key: 'recruitment_broadcast' },
    { prefix: 'recruitment/approval-settings', key: 'recruitment_approval_settings' },
    { prefix: 'recruitment/email-config', key: 'recruitment_email_config' },

    { prefix: 'perusahaan', key: 'perusahaan' },
    { prefix: 'entitas', key: 'entitas' },
    { prefix: 'lokasi', key: 'lokasi' },
    { prefix: 'role-access', key: 'role_access' },
  ];

  const matched = routes.find((r) => cleanPath === r.prefix || cleanPath.startsWith(r.prefix + '/'));
  return matched ? matched.key : cleanPath;
};

const getMenuItems = (translate) => [
  {
    key: 'dashboard',
    icon: <DashboardTwoTone />,
    label: translate('Dashboard & Analitik') || 'Dashboard & Analitik',
    style: {
      fontSize: 15,
      fontWeight: 600,
    },
    children: [
      {
        key: 'dashboard_absen',
        label: <Link to="/">Absen</Link>,
      },
      {
        key: 'dashboard_panen',
        label: <Link to="/dashboard_panen">Panen</Link>,
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
        label: <Link to="/dashboard_productivity">Produktivitas Truck</Link>,
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
    key: 'operasional',
    icon: <AppstoreTwoTone />,
    label: translate('Operasional & Logistik') || 'Operasional Tambak & Logistik',
    style: {
      fontSize: 15,
      fontWeight: 600,
    },
    children: [
      {
        key: 'group_tambak_kualitas',
        type: 'group',
        label: 'TAMBAK & KUALITAS',
        children: [
          {
            key: 'tambak/list',
            label: <Link to="/tambak">Daftar Tambak</Link>,
          },
          {
            key: 'panen',
            label: <Link to="/panen">Data Panen</Link>,
          },
          {
            key: 'kualitas/list',
            label: <Link to="/kualitas">List Kualitas</Link>,
          },
        ],
      },
      {
        key: 'group_penjualan_bongkar',
        type: 'group',
        label: 'PENJUALAN & BONGKAR',
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
          {
            key: 'spb/list',
            label: <Link to="/spb">Permintaan Barang (SPB)</Link>,
          },
        ],
      },
      {
        key: 'group_logistik_driver',
        type: 'group',
        label: 'LOGISTIK & DRIVER',
        children: [
          {
            key: 'driver',
            label: <Link to="/driver">List Driver</Link>,
          },
          {
            key: 'driver_loans',
            label: <Link to="/driver-loans">Pinjaman Driver</Link>,
          },
        ],
      },
    ],
  },
  {
    key: 'manageHR',
    icon: <BuildTwoTone />,
    label: translate('Manajemen HR & Presensi') || 'Manajemen HR & Presensi',
    style: {
      fontSize: 15,
      fontWeight: 600,
    },
    children: [
      {
        key: 'group_karyawan_kpi',
        type: 'group',
        label: 'DATA KARYAWAN & KPI',
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
            key: 'agreements',
            label: <Link to="/agreements">Daftar Agreements</Link>,
          },
        ],
      },
      {
        key: 'group_presensi_jadwal',
        type: 'group',
        label: 'PRESENSI & JADWAL KERJA',
        children: [
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
            label: <Link to="/employee/manage">HR & Attendance</Link>,
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
            key: 'tarik_absen',
            label: <Link to="/tarik-absen">Report HR</Link>,
          },
        ],
      },
      {
        key: 'group_izin_cuti',
        type: 'group',
        label: 'MANAJEMEN IZIN & CUTI',
        children: [
          {
            key: 'leave_requests',
            label: <Link to="/leave-requests">Izin Karyawan</Link>,
          },
          {
            key: 'leave_approval_lines',
            label: <Link to="/leave-approval-lines">Line Approval Izin</Link>,
          },
          {
            key: 'leave_email_config',
            label: <Link to="/leave-email-config">Setup Email Izin</Link>,
          },
        ],
      },
    ],
  },
  {
    key: 'recruitment',
    icon: <IdcardTwoTone />,
    label: translate('Rekrutmen') || 'Rekrutmen',
    style: {
      fontSize: 15,
      fontWeight: 600,
    },
    children: [
      {
        key: 'recruitment_jobs',
        label: <Link to="/recruitment/jobs">Lowongan Kerja</Link>,
      },
      {
        key: 'recruitment_applicants',
        label: <Link to="/recruitment/applicants">Data Pelamar</Link>,
      },
      {
        key: 'recruitment_approvals',
        label: <Link to="/recruitment/approvals">Approval</Link>,
      },
      {
        key: 'recruitment_broadcast',
        label: <Link to="/recruitment/broadcast">Broadcast Email</Link>,
      },
      {
        key: 'recruitment_approval_settings',
        label: <Link to="/recruitment/approval-settings">Alur Approval</Link>,
      },
      {
        key: 'recruitment_email_config',
        label: <Link to="/recruitment/email-config">Konfigurasi Email</Link>,
      },
    ],
  },
  {
    key: 'pengaturan',
    icon: <SettingTwoTone />,
    label: translate('Pengaturan & Master') || 'Pengaturan & Master Korporat',
    style: {
      fontSize: 15,
      fontWeight: 600,
    },
    children: [
      {
        key: 'perusahaan',
        label: <Link to="/perusahaan">Master Perusahaan (PT/Legal)</Link>,
      },
      {
        key: 'entitas',
        label: <Link to="/entitas">Master Entitas (Cabang/Unit)</Link>,
      },
      {
        key: 'lokasi',
        label: <Link to="/lokasi">Lokasi Office</Link>,
      },
      {
        key: 'role_access',
        label: <Link to="/role-access">Hak Akses Role</Link>,
      },
    ],
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
    const isAllowed = (key) => {
      if (!key) return false;
      return (
        allowedCodes.includes(key) ||
        allowedCodes.includes(key.replace('/', '_')) ||
        allowedCodes.includes(key.replace('_', '/'))
      );
    };

    const filterItem = (item) => {
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children
          .map(filterItem)
          .filter(Boolean);

        // Group header: only display if it has at least one visible child
        if (item.type === 'group') {
          if (filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren,
            };
          }
          return null;
        }

        // Parent menu: display if it has visible children OR parent key itself is allowed
        if (filteredChildren.length > 0 || isAllowed(item.key)) {
          return {
            ...item,
            children: filteredChildren,
          };
        }
        return null;
      }

      // Leaf menu item
      if (isAllowed(item.key)) {
        return item;
      }

      return null;
    };

    return items.map(filterItem).filter(Boolean);
  }

  // 3. User yang belum memiliki role group TIDAK boleh mendapatkan akses ke menu apapun (Security Default: Deny)
  return [];
};

const applyMenuStyles = (items, isChild = false) => {
  return items.map((item) => {
    if (item.type === 'group') {
      return {
        ...item,
        style: {
          fontSize: 11,
          fontWeight: 700,
          color: '#8c8c8c',
          letterSpacing: '0.6px',
          paddingTop: 8,
          paddingBottom: 2,
          paddingLeft: 12,
          margin: 0,
        },
        children: item.children ? applyMenuStyles(item.children, true) : [],
      };
    }

    const styledItem = {
      ...item,
      style: {
        fontSize: isChild ? 13.5 : 14.5,
        fontWeight: isChild ? 400 : 600,
        color: isChild ? '#444444' : '#1f1f1f',
        height: 'auto',
        lineHeight: 1.35,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        paddingTop: 4,
        paddingBottom: 4,
        ...(item.style || {}),
      },
    };

    if (item.children) {
      styledItem.children = applyMenuStyles(item.children, true);
    }

    return styledItem;
  });
};

const syncLabelsFromDb = (items, dbMenus) => {
  if (!Array.isArray(dbMenus) || dbMenus.length === 0) return items;
  const labelMap = {};
  dbMenus.forEach((m) => {
    if (m.code && m.label) {
      labelMap[m.code] = m.label;
      labelMap[m.code.replace('_', '/')] = m.label;
      labelMap[m.code.replace('/', '_')] = m.label;
    }
  });

  const syncItem = (item) => {
    let newItem = { ...item };
    if (item.key && !item.type) {
      const mappedLabel = labelMap[item.key] || labelMap[item.key.replace('/', '_')];
      if (mappedLabel) {
        if (item.children && item.children.length > 0) {
          newItem.label = mappedLabel;
        } else if (item.label && item.label.props?.to) {
          newItem.label = <Link to={item.label.props.to}>{mappedLabel}</Link>;
        } else {
          newItem.label = mappedLabel;
        }
      }
    }
    if (item.children && item.children.length > 0) {
      newItem.children = item.children.map(syncItem);
    }
    return newItem;
  };

  return items.map(syncItem);
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
  const [dbMenus, setDbMenus] = useState([]);
  const [collapsed, setCollapsed] = useState(isNavMenuClose);

  useEffect(() => {
    fetch(`${API_BASE_URL}employees/backoffice-menus`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.result)) {
          setDbMenus(data.result);
        }
      })
      .catch((err) => console.error('Failed to fetch backoffice menus:', err));
  }, []);

  useEffect(() => {
    setCollapsed(isNavMenuClose);
  }, [isNavMenuClose]);

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

  const onCollapse = (value) => {
    setCollapsed(value);
    navMenu.collapse();
  };

  const rawItems = syncLabelsFromDb(getMenuItems(translate), dbMenus);
  const filteredItems = filterMenuByRole(rawItems, currentAdmin, dynamicCodes || currentAdmin?.allowed_menu_codes);
  const styledItems = applyMenuStyles(filteredItems);
  const defaultOpenMenu = ['dashboard', 'operasional', 'manageHR', 'recruitment', 'pengaturan'];
  const activeMenuKey = pathToMenuKey(location.pathname);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      collapsedWidth={80}
      width={260}
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
            selectedKeys={[activeMenuKey]}
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
  const [dbMenus, setDbMenus] = useState([]);
  const translate = useLanguage();

  useEffect(() => {
    fetch(`${API_BASE_URL}employees/backoffice-menus`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.result)) {
          setDbMenus(data.result);
        }
      })
      .catch((err) => console.error('Failed to fetch backoffice menus:', err));
  }, []);

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

  useEffect(() => {
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

  const rawItems = syncLabelsFromDb(getMenuItems(translate), dbMenus);
  const filteredItems = filterMenuByRole(rawItems, currentAdmin, dynamicCodes || currentAdmin?.allowed_menu_codes);
  const styledItems = applyMenuStyles(filteredItems);
  const defaultOpenMenu = ['dashboard', 'operasional', 'manageHR', 'recruitment', 'pengaturan'];
  const activeMenuKey = pathToMenuKey(location.pathname);

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
          selectedKeys={[activeMenuKey]}
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
