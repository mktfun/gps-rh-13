
import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';

const queryClient = new QueryClient();

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="dark bg-background text-foreground min-h-screen">
          {children}
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default RootLayout;
