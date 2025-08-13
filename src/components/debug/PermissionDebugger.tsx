import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DebugData {
  currentUser: any;
  currentProfile: any;
  samplePlano: any;
  sampleFuncionario: any;
  pendenciasPermissions: any;
  planosFuncionariosPermissions: any;
  error?: string;
}

export const PermissionDebugger: React.FC = () => {
  const { user, role, empresaId } = useAuth();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    setDebugData(null);

    try {
      const data: DebugData = {
        currentUser: null,
        currentProfile: null,
        samplePlano: null,
        sampleFuncionario: null,
        pendenciasPermissions: null,
        planosFuncionariosPermissions: null,
      };

      // Current user info
      data.currentUser = {
        id: user?.id,
        email: user?.email,
        authRole: role,
        empresaId: empresaId
      };

      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      data.currentProfile = { profile, error: profileError };

      // Get a sample plano to test with
      const { data: planos, error: planosError } = await supabase
        .from('dados_planos')
        .select(`
          id, 
          cnpj_id,
          cnpjs!inner(
            id,
            empresas!inner(
              id,
              corretora_id
            )
          )
        `)
        .limit(1);

      data.samplePlano = { planos, error: planosError };

      // Get a sample funcionario 
      const { data: funcionarios, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('id, status, cnpj_id')
        .eq('status', 'ativo')
        .limit(1);

      data.sampleFuncionario = { funcionarios, error: funcionariosError };

      // Test pendencias permissions by trying to insert a test record (dry run)
      const testPendencia = {
        protocolo: `TEST-${Date.now()}`,
        tipo: 'ativacao',
        descricao: 'Test pendencia for permission check',
        funcionario_id: funcionarios?.[0]?.id,
        cnpj_id: funcionarios?.[0]?.cnpj_id,
        corretora_id: user?.id,
        status: 'pendente',
        data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      // Don't actually insert, just check if we would be able to
      const { data: pendenciasTest, error: pendenciasError } = await supabase
        .from('pendencias')
        .select('id')
        .limit(1);

      data.pendenciasPermissions = { testPendencia, selectTest: { data: pendenciasTest, error: pendenciasError } };

      // Test planos_funcionarios permissions
      const { data: planosFunc, error: planosFuncError } = await supabase
        .from('planos_funcionarios')
        .select('id')
        .limit(1);

      data.planosFuncionariosPermissions = { data: planosFunc, error: planosFuncError };

      setDebugData(data);
    } catch (error) {
      setDebugData({
        currentUser: null,
        currentProfile: null,
        samplePlano: null,
        sampleFuncionario: null,
        pendenciasPermissions: null,
        planosFuncionariosPermissions: null,
        error: String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Permission Debugger</CardTitle>
        <Button onClick={runDebug} disabled={isLoading}>
          {isLoading ? 'Running Debug...' : 'Run Permission Debug'}
        </Button>
      </CardHeader>
      <CardContent>
        {debugData && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Current User Info</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugData.currentUser, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Current Profile</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugData.currentProfile, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Sample Plano Data</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugData.samplePlano, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Sample Funcionario Data</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugData.sampleFuncionario, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Pendencias Permissions</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugData.pendenciasPermissions, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Planos Funcionarios Permissions</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugData.planosFuncionariosPermissions, null, 2)}
              </pre>
            </div>

            {debugData.error && (
              <div>
                <h3 className="font-semibold text-red-600">Error</h3>
                <pre className="bg-red-100 p-2 rounded text-xs overflow-auto">
                  {debugData.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
