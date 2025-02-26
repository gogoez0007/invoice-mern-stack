import React from 'react';
import { Layout } from 'antd';
import logoIcon from '@/style/images/logo-icon.svg';

const { Footer } = Layout;

const FooterContent = () => (
  <Footer
    style={{
      textAlign: 'center',
      backgroundColor: '#fff',
      color: '#000',
      bottom: 0,
      left: 0,
      width: '100%',
      zIndex: 1000, // 🔧 Z-index lebih rendah agar di belakang
      position: 'fixed',
    }}
  >
    <img
      src={logoIcon}
      alt="Logo"
      style={{ width: '30px', marginRight: '10px', verticalAlign: 'middle' }}
    />
    © 2025 Delta Marine - Back Office System
  </Footer>
);

export default FooterContent;
