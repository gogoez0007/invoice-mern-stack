import { ErpContextProvider } from '@/context/erp';

import { Layout } from 'antd';
import { useSelector } from 'react-redux';

const { Content } = Layout;

export default function ErpLayout({ children }) {
  return (
    <ErpContextProvider>
      <Content
        className="whiteBox shadow layoutPadding"
        style={{
          margin: '30px auto',
          width: '100%',
          maxWidth: '1000px',
          minHeight: '600px',
          borderRadius: '16px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#fff',
          padding: '20px',
        }}
      >
        {children}
      </Content>
    </ErpContextProvider>
  );
}
