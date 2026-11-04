import { useLayoutEffect, useState } from 'react';
import { useEffect } from 'react';
import { selectAppSettings } from '@/redux/settings/selectors';
import { useDispatch, useSelector } from 'react-redux';

import { Layout, Button } from 'antd';

import { useAppContext } from '@/context/appContext';

import Navigation from '@/apps/Navigation/NavigationContainer';

import HeaderContent from '@/apps/Header/HeaderContainer';
import PageLoader from '@/components/PageLoader';
import FooterContent from '@/layout/Footer';

import { settingsAction } from '@/redux/settings/actions';

import { selectSettings } from '@/redux/settings/selectors';

import AppRouter from '@/router/AppRouter';

import useResponsive from '@/hooks/useResponsive';

import storePersist from '@/redux/storePersist';

export default function ErpCrmApp() {
  const { Content } = Layout;

  const { state: stateApp } = useAppContext();
  const { isNavMenuClose } = stateApp;

  const { isMobile } = useResponsive();
  const [stagingBannerClosed, setStagingBannerClosed] = useState(false);
  const isStaging = typeof window !== 'undefined' && window.location.hostname.includes('staging');

  const dispatch = useDispatch();

  useLayoutEffect(() => {
    dispatch(settingsAction.list({ entity: 'setting' }));
  }, []);

  // const appSettings = useSelector(selectAppSettings);

  const { isSuccess: settingIsloaded } = useSelector(selectSettings);

  // useEffect(() => {
  //   const { loadDefaultLang } = storePersist.get('firstVisit');
  //   if (appSettings.idurar_app_language && !loadDefaultLang) {
  //     window.localStorage.setItem('firstVisit', JSON.stringify({ loadDefaultLang: true }));
  //   }
  // }, [appSettings]);

  if (settingIsloaded)
    return (
      <Layout hasSider style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navigation />

        {isMobile ? (
          <Layout style={{ marginLeft: 0, minHeight: '100vh', width: '100%', background: '#f8fafc' }}>
            <HeaderContent />
            {isStaging && !stagingBannerClosed && (
              <div
                style={{
                  background: 'linear-gradient(90deg, #b45309 0%, #d97706 100%)',
                  color: '#ffffff',
                  padding: '8px 20px',
                  fontSize: 13,
                  letterSpacing: '0.4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(180, 83, 9, 0.25)',
                  borderBottom: '2px solid #fde68a',
                  zIndex: 899,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>🧪</span>
                  <span>
                    TAHAP STAGING &bull; LINGKUNGAN UJI COBA (DATABASE: <strong>dummy_attendance</strong>) — Data di sini adalah data testing.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStagingBannerClosed(true)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 18,
                    fontWeight: 700,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                  title="Tutup banner staging"
                >
                  &times;
                </button>
              </div>
            )}
            <Content
              style={{
                margin: '12px auto 28px',
                overflow: 'initial',
                width: '100%',
                padding: '0 12px 64px',
                maxWidth: 'none',
              }}
            >
              <AppRouter />
            </Content>
            <FooterContent/>
          </Layout>
        ) : (
          <Layout
            style={{
              marginLeft: isNavMenuClose ? 80 : 266,
              minHeight: '100vh',
              transition: 'margin-left 0.2s cubic-bezier(0.2, 0, 0, 1)',
              background: '#f8fafc',
            }}
          >
            <HeaderContent />
            {isStaging && !stagingBannerClosed && (
              <div
                style={{
                  background: 'linear-gradient(90deg, #b45309 0%, #d97706 100%)',
                  color: '#ffffff',
                  padding: '8px 20px',
                  fontSize: 13,
                  letterSpacing: '0.4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(180, 83, 9, 0.25)',
                  borderBottom: '2px solid #fde68a',
                  zIndex: 899,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>🧪</span>
                  <span>
                    TAHAP STAGING &bull; LINGKUNGAN UJI COBA (DATABASE: <strong>dummy_attendance</strong>) — Data di sini adalah data testing.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStagingBannerClosed(true)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 18,
                    fontWeight: 700,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                  title="Tutup banner staging"
                >
                  &times;
                </button>
              </div>
            )}
            <Content
              style={{
                margin: '24px auto 30px',
                overflow: 'initial',
                width: '100%',
                padding: '0 32px',
                maxWidth: 1440,
              }}
            >
              <AppRouter />
            </Content>
            <FooterContent/>
          </Layout>
        )}
      </Layout>
    );
  else return <PageLoader />;
}
