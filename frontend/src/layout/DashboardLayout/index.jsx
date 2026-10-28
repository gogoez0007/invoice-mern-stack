import React from 'react';
import useResponsive from '@/hooks/useResponsive';

export default function DashboardLayout({ children }) {
  const { isMobile } = useResponsive();

  return (
    <div
      style={{
        marginLeft: isMobile ? 0 : 140,
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}
