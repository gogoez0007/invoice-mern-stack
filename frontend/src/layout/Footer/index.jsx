import React from 'react';
import { Layout } from 'antd';
import logoIcon from '@/style/images/logo-icon.svg';
import useResponsive from "@/hooks/useResponsive";

const { Footer } = Layout;

const FooterContent = () => {
  const { isMobile } = useResponsive(); // Cek apakah mode mobile

  return (
    <Footer
      style={{
        display: "flex",
        justifyContent: "center", // Tengah horizontal
        alignItems: "center", // Tengah vertikal
        position: "fixed",
        bottom: 0,
        left: isMobile ? 0 : 250, // Jika mobile, left = 0
        width: isMobile ? "100%" : "calc(100% - 250px)", // Mobile full width
        backgroundColor: "#fff",
        color: "#000",
        zIndex: 1000,
        height: "50px",
      }}
    >
      <img
        src={logoIcon}
        alt="Logo"
        style={{ width: "50px", marginRight: "10px", verticalAlign: "middle" }}
      />
      © 2025 Delta Marine - Back Office System
    </Footer>
  );
};



export default FooterContent;
