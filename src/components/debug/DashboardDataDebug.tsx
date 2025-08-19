import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DebugData {
  debug_info: {
    empresa_id_usado: string;
    total_cnpjs: number;
    total_funcionarios: number;
    funcionarios_ativos: number;
    total_planos: number;
    total_vinculos: number;
    soma_valores_planos: number;
  };
  empresa: {
    empresa_id: string;
    empresa_nome: string;
    empresa_cnpj: string;
    corretora_id: string;
  };
  cnpjs: Array<{
    cnpj_id: string;
    cnpj: string;
    razao_social: string;
    status: string;
    empresa_id: string;
  }>;
  funcionarios: Array<{
    funcionario_id: string;
    nome: string;
    cpf: string;
    status: string;
    cnpj_id: string;
    cargo: string;
  }>;
  planos: Array<{
    plano_id: string;
    cnpj_id: string;
    seguradora: string;
    tipo_seguro: string;
    valor_mensal: number;
    cnpj_razao_social: string;
  }>;
  vinculos_planos_funcionarios: Array<{
    vinculo_id: string;
    plano_id: string;
    funcionario_id: string;
    status: string;
    funcionario_nome: string;
    plano_tipo: string;
    plano_seguradora: string;
  }>;
}

export const DashboardDataDebug: React.FC = () => {
  const { empresaId } = useAuth();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDebug = async () => {
    setIsLoading(true);
    setError(null);
    setDebugData(null);

    try {
      console.log('🔍 [Debug] Executando debug com empresa ID:', empresaId);

      const { data, error: debugError } = await supabase.rpc(
        'debug_dashboard_data',
        empresaId ? { p_empresa_id: empresaId } : {}
      );

      if (debugError) {
        throw new Error(`Erro na função de debug: ${debugError.message}`);
      }

      console.log('📊 [Debug] Dados retornados:', data);
      setDebugData(data);
      toast.success('Debug executado com sucesso!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error('❌ [Debug] Erro:', err);
      toast.error(`Erro no debug: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string, type: 'cnpj' | 'funcionario' | 'vinculo' = 'funcionario') => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ativo: 'default',
      pendente: 'secondary',
      inativo: 'destructive',
      configuracao: 'outline',
      suspenso: 'destructive',
      desativado: 'destructive',
      exclusao_solicitada: 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Debug de Dados do Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={runDebug} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Executar Debug
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-semibold">Erro no Debug</h3>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {debugData && (
            <div className="space-y-6">
              {/* Resumo Geral */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Resumo Geral</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Empresa ID</p>
                      <p className="font-mono text-xs">{debugData.debug_info.empresa_id_usado}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total CNPJs</p>
                      <p className="text-2xl font-bold">{debugData.debug_info.total_cnpjs}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Funcionários</p>
                      <p className="text-2xl font-bold">{debugData.debug_info.total_funcionarios}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Funcionários Ativos</p>
                      <p className="text-2xl font-bold text-green-600">{debugData.debug_info.funcionarios_ativos}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Planos</p>
                      <p className="text-2xl font-bold">{debugData.debug_info.total_planos}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Soma Valores Planos</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(debugData.debug_info.soma_valores_planos)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações da Empresa */}
              {debugData.empresa && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🏢 Empresa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Nome:</strong> {debugData.empresa.empresa_nome}</p>
                      <p><strong>CNPJ:</strong> {debugData.empresa.empresa_cnpj}</p>
                      <p><strong>Corretora ID:</strong> {debugData.empresa.corretora_id}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CNPJs */}
              {debugData.cnpjs && debugData.cnpjs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🏭 CNPJs ({debugData.cnpjs.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {debugData.cnpjs.map((cnpj, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{cnpj.razao_social}</p>
                              <p className="text-sm text-muted-foreground">CNPJ: {cnpj.cnpj}</p>
                            </div>
                            {getStatusBadge(cnpj.status, 'cnpj')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Planos */}
              {debugData.planos && debugData.planos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📋 Planos ({debugData.planos.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {debugData.planos.map((plano, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <p className="font-medium">{plano.seguradora}</p>
                              <p className="text-sm text-muted-foreground">{plano.cnpj_razao_social}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{plano.tipo_seguro}</Badge>
                              <Badge variant="default">{formatCurrency(plano.valor_mensal)}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Funcionários */}
              {debugData.funcionarios && debugData.funcionarios.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">👥 Funcionários ({debugData.funcionarios.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {debugData.funcionarios.map((func, index) => (
                        <div key={index} className="flex items-center justify-between border rounded p-2">
                          <div>
                            <p className="font-medium">{func.nome}</p>
                            <p className="text-sm text-muted-foreground">{func.cargo || 'Sem cargo'}</p>
                          </div>
                          {getStatusBadge(func.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vínculos */}
              {debugData.vinculos_planos_funcionarios && debugData.vinculos_planos_funcionarios.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🔗 Vínculos Planos-Funcionários ({debugData.vinculos_planos_funcionarios.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {debugData.vinculos_planos_funcionarios.map((vinculo, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{vinculo.funcionario_nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {vinculo.plano_seguradora} - {vinculo.plano_tipo}
                              </p>
                            </div>
                            {getStatusBadge(vinculo.status, 'vinculo')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Casos onde não há dados */}
              {debugData.debug_info.total_cnpjs === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum CNPJ encontrado</h3>
                    <p className="text-muted-foreground">
                      Esta empresa não possui CNPJs cadastrados. Isso explica por que o dashboard está vazio.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
