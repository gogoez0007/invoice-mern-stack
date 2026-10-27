import { useLayoutEffect } from 'react';
import { useEffect } from 'react';
import { selectAppSettings } from '@/redux/settings/selectors';
import { useDispatch, useSelector } from 'react-redux';

import { Layout } from 'antd';

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
              marginLeft: isNavMenuClose ? 80 : 256,
              minHeight: '100vh',
              transition: 'margin-left 0.2s cubic-bezier(0.2, 0, 0, 1)',
              background: '#f8fafc',
            }}
          >
            <HeaderContent />
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
