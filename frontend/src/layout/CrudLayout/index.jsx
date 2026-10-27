import { useEffect, useState } from 'react';

import DefaultLayout from '../DefaultLayout';

import SidePanel from '@/components/SidePanel';
import { Layout } from 'antd';
import { useCrudContext } from '@/context/crud';
import { useAppContext } from '@/context/appContext';

import useResponsive from '@/hooks/useResponsive';

const { Content } = Layout;

const ContentBox = ({ children }) => {
  const { state: stateCrud, crudContextAction } = useCrudContext();
  const { state: stateApp } = useAppContext();
  const { isPanelClose } = stateCrud;
  const { panel } = crudContextAction;
  const { isMobile } = useResponsive();

  const [isSidePanelClose, setSidePanel] = useState(isPanelClose);

  useEffect(() => {
    let timer = [];
    if (isPanelClose) {
      timer = setTimeout(() => {
        setSidePanel(isPanelClose);
      }, 200);
    } else {
      setSidePanel(isPanelClose);
    }

    return () => clearTimeout(timer);
  }, [isPanelClose]);

  return (
    <Content
      className="whiteBox shadow"
      style={{
        margin: 'auto',
        flex: 'none',
        borderRadius: isMobile ? '10px' : '16px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff',
        padding: isMobile ? '12px 8px' : '20px',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        className="responsive-content"
      >
        {children}
      </div>
      <style>{`
        @media (max-width: 1200px) {
          .responsive-content {
            padding: 12px;
            width: 100%;
          }
        }
        @media (max-width: 768px) {
          .responsive-content {
            padding: 4px 0;
            width: 100%;
          }
        }
        @media (max-width: 576px) {
          .responsive-content {
            padding: 0;
            width: 100%;
          }
        }
      `}</style>
    </Content>
  );
};

export default function CrudLayout({
  children,
  config,
  sidePanelTopContent,
  sidePanelBottomContent,
  fixHeaderPanel,
}) {
  return (
    <>
      <DefaultLayout>
        <SidePanel
          config={config}
          topContent={sidePanelTopContent}
          bottomContent={sidePanelBottomContent}
          fixHeaderPanel={fixHeaderPanel}
        ></SidePanel>

        <ContentBox>{children}</ContentBox>
      </DefaultLayout>
    </>
  );
}
