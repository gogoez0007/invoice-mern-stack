import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Layout, Badge, Button } from 'antd';

// import Notifications from '@/components/Notification';

import { LogoutOutlined, ToolOutlined, UserOutlined, MenuOutlined } from '@ant-design/icons';

import { selectCurrentAdmin } from '@/redux/auth/selectors';

import { FILE_BASE_URL } from '@/config/serverApiConfig';
import logoIcon from '@/style/images/logo-icon.svg';

import useLanguage from '@/locale/useLanguage';
import useResponsive from '@/hooks/useResponsive';

import UpgradeButton from './UpgradeButton';

export default function HeaderContent() {
  const currentAdmin = useSelector(selectCurrentAdmin);
  const { Header } = Layout;
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  const translate = useLanguage();

  const ProfileDropdown = () => {
    return (
      <div className="profileDropdown" onClick={() => navigate('/profile')}>
        <Avatar
          size="large"
          className="last"
          src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
          style={{
            color: '#f56a00',
            backgroundColor: currentAdmin?.photo ? 'none' : '#fde3cf',
            boxShadow: 'rgba(150, 190, 238, 0.35) 0px 0px 6px 1px',
          }}
        >
          {currentAdmin?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
        <div className="profileDropdownInfo">
          <p>
            {currentAdmin?.name} {currentAdmin?.surname}
          </p>
          <p>{currentAdmin?.email}</p>
        </div>
      </div>
    );
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      navigate('/logout');
    } else if (key === 'settingProfile') {
      navigate('/profile');
    } else if (key === 'settingApp') {
      navigate('/settings');
    }
  };

  const items = [
    {
      label: <ProfileDropdown className="headerDropDownMenu" />,
      key: 'ProfileDropdown',
    },
    {
      type: 'divider',
    },
    {
      icon: <UserOutlined />,
      key: 'settingProfile',
      label: translate('profile_settings'),
    },
    {
      icon: <ToolOutlined />,
      key: 'settingApp',
      label: translate('app_settings'),
    },
    {
      type: 'divider',
    },
    {
      icon: <LogoutOutlined />,
      key: 'logout',
      label: translate('logout'),
    },
  ];

  return (
    <Header
      style={{
        padding: isMobile ? '0 14px' : '0 32px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: isMobile ? 'space-between' : 'flex-end',
        alignItems: 'center',
        gap: '12px',
        height: isMobile ? 56 : 64,
        lineHeight: isMobile ? '56px' : '64px',
        position: 'sticky',
        top: 0,
        zIndex: 900,
        borderBottom: '1px solid #f0f0f0',
        boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
      }}
    >
      {isMobile ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20, color: '#1f1f1f' }} />}
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
              aria-label="Buka Menu"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                padding: 0,
                borderRadius: 8,
              }}
            />
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <img
                src={logoIcon}
                alt="Logo"
                style={{ height: 26, width: 'auto', objectFit: 'contain' }}
              />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1f1f1f', letterSpacing: '-0.2px' }}>
                Backoffice
              </span>
            </div>
          </div>

          <Dropdown
            menu={{
              items,
              onClick: handleMenuClick,
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Avatar
              className="last"
              src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
              style={{
                color: '#f56a00',
                backgroundColor: currentAdmin?.photo ? 'none' : '#fde3cf',
                boxShadow: 'rgba(150, 190, 238, 0.35) 0px 0px 10px 2px',
                cursor: 'pointer',
              }}
              size="default"
            >
              {currentAdmin?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
          </Dropdown>
        </>
      ) : (
        <Dropdown
          menu={{
            items,
            onClick: handleMenuClick,
          }}
          trigger={['click']}
          placement="bottomRight"
          style={{ width: '280px', float: 'right' }}
        >
          <Avatar
            className="last"
            src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
            style={{
              color: '#f56a00',
              backgroundColor: currentAdmin?.photo ? 'none' : '#fde3cf',
              boxShadow: 'rgba(150, 190, 238, 0.35) 0px 0px 10px 2px',
              float: 'right',
              cursor: 'pointer',
            }}
            size="large"
          >
            {currentAdmin?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
        </Dropdown>
      )}
    </Header>
  );
}

//  console.log(
//    '🚀 Welcome to IDURAR ERP CRM! Did you know that we also offer commercial customization services? Contact us at hello@idurarapp.com for more information.'
//  );
