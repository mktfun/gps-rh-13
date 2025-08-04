
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Breadcrumbs from '@/components/ui/breadcrumbs';

const ChatPage = () => {
  const breadcrumbItems = [
    { label: 'Chat' }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
          <p className="text-muted-foreground">
            Central de conversas e comunicação
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Central de Mensagens</CardTitle>
          <CardDescription>
            Gerencie suas conversas e comunicações aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Sistema de chat em desenvolvimento...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPage;
