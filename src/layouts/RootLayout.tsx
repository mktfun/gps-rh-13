
import React from 'react';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
};

export default RootLayout;
