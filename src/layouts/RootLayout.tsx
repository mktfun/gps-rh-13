
import React from 'react';
import { Outlet } from 'react-router-dom';

interface RootLayoutProps {
  children?: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {children || <Outlet />}
    </div>
  );
};

export default RootLayout;
