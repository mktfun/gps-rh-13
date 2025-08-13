import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useFuncionariosConsolidated } from '@/hooks/useFuncionariosConsolidated';
import { useSmartActions } from '@/hooks/useSmartActions';
import { usePendenciasDaCorretora } from '@/hooks/usePendenciasDaCorretora';
import { AlertTriangle, RefreshCcw, Users, FileText, Database } from 'lucide-react';

export const FuncionariosDebugPanel = () => {
  const { data: consolidated, isLoading: consolidatedLoading, refetch: refetchConsolidated } = useFuncionariosConsolidated();
  const { data: smartActions, isLoading: smartLoading, refetch: refetchSmart } = useSmartActions();
  const { data: pendencias, isLoading: pendenciasLoading, refetch: refetchPendencias } = usePendenciasDaCorretora();

  const handleRefreshAll = () => {
    refetchConsolidated();
    refetchSmart();
    refetchPendencias();
  };

  if (consolidatedLoading || smartLoading || pendenciasLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Debug: Contagens de Funcionários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando dados...</p>
        </CardContent>
      </Card>
    );
  }

  const discrepancias = [];

  // Comparar funcionários pendentes
  const pendentesConsolidado = consolidated?.funcionarios_pendentes || 0;
  const pendentesSmartActions = smartActions?.ativacoes_pendentes || 0;
  const pendenciasPendentes = pendencias?.filter(p => p.tipo === 'ativacao').length || 0;

  if (pendentesConsolidado !== pendentesSmartActions || pendentesConsolidado !== pendenciasPendentes) {
    discrepancias.push({
      tipo: 'Funcionários Pendentes',
      values: [
        { fonte: 'Tabela funcionarios', valor: pendentesConsolidado },
        { fonte: 'Smart Actions (pendencias)', valor: pendentesSmartActions },
        { fonte: 'Lista pendencias', valor: pendenciasPendentes }
      ]
    });
  }

  // Comparar aprovações rápidas
  const aprovacoesSmartActions = smartActions?.aprovacoes_rapidas || 0;
  const pendenciasCancelamento = pendencias?.filter(p => p.tipo === 'cancelamento').length || 0;
  const funcionariosExclusao = consolidated?.funcionarios_exclusao_solicitada || 0;

  if (aprovacoesSmartActions !== pendenciasCancelamento) {
    discrepancias.push({
      tipo: 'Aprovações Rápidas',
      values: [
        { fonte: 'Smart Actions', valor: aprovacoesSmartActions },
        { fonte: 'Pendencias cancelamento', valor: pendenciasCancelamento },
        { fonte: 'Funcionários exclusão', valor: funcionariosExclusao }
      ]
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Debug: Contagens de Funcionários
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshAll}
              className="ml-auto"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Atualizar Tudo
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estatísticas Consolidadas */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Estatísticas Consolidadas (Fonte: Tabela funcionarios)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="text-sm">
                <span className="font-medium">Total:</span> {consolidated?.total_funcionarios || 0}
              </div>
              <div className="text-sm">
                <span className="font-medium">Ativos:</span> {consolidated?.funcionarios_ativos || 0}
              </div>
              <div className="text-sm">
                <span className="font-medium">Pendentes:</span> {consolidated?.funcionarios_pendentes || 0}
              </div>
              <div className="text-sm">
                <span className="font-medium">Exclusão:</span> {consolidated?.funcionarios_exclusao_solicitada || 0}
              </div>
            </div>
          </div>

          {/* Smart Actions */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Smart Actions (Fonte: Tabela pendencias)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="text-sm">
                <span className="font-medium">Ativações:</span> {smartActions?.ativacoes_pendentes || 0}
              </div>
              <div className="text-sm">
                <span className="font-medium">Aprovações:</span> {smartActions?.aprovacoes_rapidas || 0}
              </div>
              <div className="text-sm">
                <span className="font-medium">Sem Plano:</span> {smartActions?.cnpjs_sem_plano || 0}
              </div>
              <div className="text-sm">
                <span className="font-medium">Travados:</span> {smartActions?.funcionarios_travados || 0}
              </div>
            </div>
          </div>

          {/* Pendências Diretas */}
          <div>
            <h4 className="font-semibold mb-2">Contagem Direta de Pendências</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm">
                <span className="font-medium">Total:</span> {pendencias?.length || 0}
              </div>
              <div className="text-sm">
                <span className="font-medium">Ativação:</span> {pendencias?.filter(p => p.tipo === 'ativacao').length || 0}
              </div>
              <div className="text-sm">
                <span className="font-medium">Cancelamento:</span> {pendencias?.filter(p => p.tipo === 'cancelamento').length || 0}
              </div>
            </div>
          </div>

          {/* Duplicatas Detectadas */}
          {consolidated?.duplicatas_detectadas && consolidated.duplicatas_detectadas.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Duplicatas Detectadas:</strong> {consolidated.duplicatas_detectadas.length} CPFs duplicados encontrados
                <div className="mt-2 space-y-1">
                  {consolidated.duplicatas_detectadas.map((dup, index) => (
                    <div key={index} className="text-xs">
                      CPF {dup.cpf}: {dup.nome} ({dup.count} registros)
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Discrepâncias */}
          {discrepancias.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Discrepâncias Detectadas
              </h4>
              <div className="space-y-2">
                {discrepancias.map((disc, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription>
                      <strong>{disc.tipo}:</strong>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {disc.values.map((val, i) => (
                          <Badge key={i} variant="outline">
                            {val.fonte}: {val.valor}
                          </Badge>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {discrepancias.length === 0 && (
            <Alert>
              <AlertDescription>
                ✅ Todas as contagens estão consistentes entre as diferentes fontes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
