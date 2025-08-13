import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DebugResult {
  funcionariosPendentes: any[];
  pendenciasExistentes: any[];
  empresaId: string | null;
  repairResult?: any[];
  error?: string;
}

export const PendenciasDebugEmpresa: React.FC = () => {
  const { data: empresaId } = useEmpresaId();
  const [result, setResult] = useState<DebugResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    if (!empresaId) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      const debugResult: DebugResult = {
        funcionariosPendentes: [],
        pendenciasExistentes: [],
        empresaId
      };

      // 1. Buscar funcionários com status pendente
      const { data: funcionariosPendentes, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          cpf,
          status,
          created_at,
          cnpj_id,
          cnpjs!inner(
            id,
            cnpj,
            razao_social,
            empresa_id
          )
        `)
        .eq('cnpjs.empresa_id', empresaId)
        .eq('status', 'pendente');

      if (funcionariosError) throw funcionariosError;
      debugResult.funcionariosPendentes = funcionariosPendentes || [];

      // 2. Buscar pendências existentes para a empresa
      const { data: pendenciasExistentes, error: pendenciasError } = await supabase
        .rpc('get_pendencias_empresa', { p_empresa_id: empresaId });

      if (pendenciasError) throw pendenciasError;
      debugResult.pendenciasExistentes = pendenciasExistentes || [];

      setResult(debugResult);
    } catch (error) {
      setResult({
        funcionariosPendentes: [],
        pendenciasExistentes: [],
        empresaId,
        error: String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const repairPendencias = async () => {
    if (!empresaId) return;

    setIsLoading(true);

    try {
      const { data: repairResult, error: repairError } = await supabase
        .rpc('repair_missing_pendencias_for_empresa', { p_empresa_id: empresaId });

      if (repairError) throw repairError;

      setResult(prev => prev ? { ...prev, repairResult } : null);

      // Rerun debug after repair
      await runDebug();
    } catch (error) {
      setResult(prev => prev ? { ...prev, error: String(error) } : null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Debug Pendências da Empresa</CardTitle>
        <Button onClick={runDebug} disabled={isLoading || !empresaId}>
          {isLoading ? 'Debugando...' : 'Debugar Pendências'}
        </Button>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-6">
            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h3 className="font-semibold text-red-800">Erro</h3>
                <p className="text-red-600">{result.error}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Empresa ID</h3>
              <p className="bg-gray-100 p-2 rounded">{result.empresaId}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Funcionários Pendentes ({result.funcionariosPendentes.length})</h3>
              <div className="bg-yellow-50 border rounded p-4 max-h-60 overflow-auto">
                {result.funcionariosPendentes.length === 0 ? (
                  <p className="text-gray-500">Nenhum funcionário pendente encontrado</p>
                ) : (
                  <pre className="text-xs">
                    {JSON.stringify(result.funcionariosPendentes, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Pendências Existentes ({result.pendenciasExistentes.length})</h3>
              <div className="bg-blue-50 border rounded p-4 max-h-60 overflow-auto">
                {result.pendenciasExistentes.length === 0 ? (
                  <p className="text-gray-500">Nenhuma pendência encontrada</p>
                ) : (
                  <pre className="text-xs">
                    {JSON.stringify(result.pendenciasExistentes, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Análise</h3>
              <div className="bg-green-50 border rounded p-4">
                <p><strong>Funcionários pendentes:</strong> {result.funcionariosPendentes.length}</p>
                <p><strong>Pendências criadas:</strong> {result.pendenciasExistentes.length}</p>
                <p><strong>Status:</strong> {
                  result.funcionariosPendentes.length === result.pendenciasExistentes.length 
                    ? '✅ Sincronizado' 
                    : '❌ Dessincronizado - deveria ter ' + result.funcionariosPendentes.length + ' pendências'
                }</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
