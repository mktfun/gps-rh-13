import React from 'react';
import { PermissionDebugger } from '@/components/debug/PermissionDebugger';
import { FuncionarioPlanoVerification } from '@/components/debug/FuncionarioPlanoVerification';
import { PlanoValueTest } from '@/components/debug/PlanoValueTest';
import { PendenciasRLSDebug } from '@/components/debug/PendenciasRLSDebug';
import { PendenciasDebugEmpresa } from '@/components/debug/PendenciasDebugEmpresa';
// import { DashboardHealthPlanTest } from '@/components/debug/DashboardHealthPlanTest'; // Removido
import { DashboardDataDebug } from '@/components/debug/DashboardDataDebug';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const PermissionTestPage: React.FC = () => {
  const { user, role, empresaId } = useAuth();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Permission Issues Debug Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Current Authentication State</h3>
            <div className="bg-gray-100 p-3 rounded">
              <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Role:</strong> {role || 'Unknown'}</p>
              <p><strong>Empresa ID:</strong> {empresaId || 'N/A'}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Known Issues</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>❌ Erro ao criar pendências de ativação: [object Object]</li>
              <li>❌ Error: Você não tem permissão para criar pendências</li>
              <li>❌ Erro ao buscar estatísticas de matrículas: [object Object]</li>
              <li>❌ Dashboard não contabilizava planos de saúde nos custos</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Expected Fixes</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✅ Better error messages instead of [object Object]</li>
              <li>✅ Improved permission verification before database operations</li>
              <li>✅ Fixed RLS policies for pendencias table</li>
              <li>✅ Enhanced query key invalidation patterns</li>
              <li>✅ Dashboard agora inclui planos de saúde nos cálculos de custo</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <DashboardDataDebug />

      {/* <DashboardHealthPlanTest /> Removido temporariamente */}

      <PendenciasDebugEmpresa />

      <PendenciasRLSDebug />

      <PlanoValueTest />

      <FuncionarioPlanoVerification />

      <PermissionDebugger />
    </div>
  );
};

export default PermissionTestPage;
