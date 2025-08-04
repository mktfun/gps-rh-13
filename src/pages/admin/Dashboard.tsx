
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const AdminDashboard = () => {
  const { user, role } = useAuth();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard do Administrador</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Bem-vindo!</h2>
            <p className="text-muted-foreground">
              Você está logado como: <strong>{user?.email}</strong>
            </p>
            <p className="text-muted-foreground">
              Seu perfil: <strong>{role}</strong>
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">Usuários</h3>
            <p className="text-muted-foreground">Gerencie todos os usuários</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">Sistema</h3>
            <p className="text-muted-foreground">Configurações do sistema</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">Logs</h3>
            <p className="text-muted-foreground">Visualize logs do sistema</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">Relatórios Globais</h3>
            <p className="text-muted-foreground">Relatórios de todo o sistema</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
