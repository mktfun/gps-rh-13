import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePendenciasEmpresa } from '@/hooks/usePendenciasEmpresa';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Bug, Calendar, Filter, AlertTriangle } from 'lucide-react';
import { subDays, addDays } from 'date-fns';

export const RelatorioPendenciasDebug = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();
  const { data: pendenciasRaw = [], isLoading: isLoadingPendencias } = usePendenciasEmpresa();
  const { user, empresaId } = useAuth();

  const debugRelatorio = async () => {
    if (!user?.id || !empresaId) {
      toast({
        title: "Erro",
        description: "Usuário ou empresa não identificados",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 DEBUG RELATÓRIO DE PENDÊNCIAS');
      
      // Simular o range de data padrão do relatório (corrigido)
      const dateRange = {
        from: subDays(new Date(), 30),
        to: addDays(new Date(), 30) // Incluir próximos 30 dias para pendências futuras
      };

      console.log('📅 Range de datas padrão:', {
        from: dateRange.from.toISOString().split('T')[0],
        to: dateRange.to.toISOString().split('T')[0]
      });

      // Analisar os dados brutos
      console.log('📊 Dados brutos do hook:', {
        total: pendenciasRaw.length,
        pendencias: pendenciasRaw
      });

      let filteredByDate = [];
      let statusAnalysis = {};
      let cnpjAnalysis = {};

      if (pendenciasRaw.length > 0) {
        // Aplicar filtro de data (igual ao relatório)
        filteredByDate = pendenciasRaw.filter(p => {
          const dataVencimento = new Date(p.data_vencimento);
          const dentroRange = dataVencimento >= dateRange.from && dataVencimento <= dateRange.to;
          
          console.log(`📋 Pendência ${p.protocolo}:`, {
            data_vencimento: p.data_vencimento,
            dentroRange,
            diasEmAberto: p.dias_em_aberto
          });
          
          return dentroRange;
        });

        // Analisar status de cada pendência
        statusAnalysis = pendenciasRaw.reduce((acc, p) => {
          const status = p.dias_em_aberto > 30 ? 'critica' :
                        p.dias_em_aberto > 15 ? 'urgente' : 'normal';
          acc[p.protocolo] = {
            diasEmAberto: p.dias_em_aberto,
            status,
            dataVencimento: p.data_vencimento,
            dataCriacao: p.data_criacao
          };
          return acc;
        }, {});

        // Analisar dados por CNPJ (simular o processamento do relatório)
        cnpjAnalysis = filteredByDate.reduce((acc, p) => {
          const key = p.cnpj || 'N/A';
          if (!acc[key]) {
            acc[key] = {
              cnpj: p.cnpj || 'N/A',
              razao_social: p.razao_social || 'N/A',
              total_pendencias: 0,
              criticas: 0,
              urgentes: 0
            };
          }
          acc[key].total_pendencias++;
          if (p.dias_em_aberto > 30) acc[key].criticas++;
          else if (p.dias_em_aberto > 15) acc[key].urgentes++;
          return acc;
        }, {});
      }

      // Buscar pendências diretas para comparação
      const { data: pendenciasDirectas, error } = await supabase
        .from('pendencias')
        .select(`
          *,
          funcionarios(nome, cpf),
          cnpjs(cnpj, razao_social, empresa_id)
        `)
        .eq('status', 'pendente')
        .eq('cnpjs.empresa_id', empresaId);

      if (error) {
        console.error('❌ Erro na busca direta:', error);
      }

      const info = {
        userInfo: {
          userId: user.id,
          empresaId,
        },
        dateRange: {
          from: dateRange.from.toISOString().split('T')[0],
          to: dateRange.to.toISOString().split('T')[0]
        },
        hookData: {
          isLoading: isLoadingPendencias,
          total: pendenciasRaw.length,
          pendencias: pendenciasRaw.map(p => ({
            protocolo: p.protocolo,
            tipo: p.tipo,
            data_vencimento: p.data_vencimento,
            data_criacao: p.data_criacao,
            dias_em_aberto: p.dias_em_aberto,
            funcionario_nome: p.funcionario_nome
          }))
        },
        filteredByDate: {
          total: filteredByDate.length,
          pendencias: filteredByDate.map(p => p.protocolo)
        },
        statusAnalysis,
        cnpjAnalysis,
        directQuery: {
          total: pendenciasDirectas?.length || 0,
          error: error?.message || null,
          pendencias: pendenciasDirectas?.map(p => ({
            protocolo: p.protocolo,
            empresa_id: (p.cnpjs as any)?.empresa_id,
            data_vencimento: p.data_vencimento
          })) || []
        }
      };

      setDebugInfo(info);
      console.log('🎯 INFO COMPLETA:', info);

      toast({
        title: "Debug Concluído",
        description: `Hook: ${pendenciasRaw.length} | Filtradas: ${filteredByDate.length} | Diretas: ${pendenciasDirectas?.length || 0}`,
      });

    } catch (error) {
      console.error('💥 Erro no debug:', error);
      toast({
        title: "Erro no Debug",
        description: "Falha ao executar debug. Verifique o console.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Relatório de Pendências
        </CardTitle>
        <CardDescription>
          Diagnóstico específico do relatório de pendências da empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Hook Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <div><strong>Loading:</strong> {isLoadingPendencias ? 'Sim' : 'Não'}</div>
                <div><strong>Pendências:</strong> {pendenciasRaw.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Range Padrão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <div><strong>De:</strong> {subDays(new Date(), 30).toLocaleDateString()}</div>
                <div><strong>Até:</strong> {addDays(new Date(), 30).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Filtros Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <div><strong>Status:</strong> Todas</div>
                <div><strong>Tipo:</strong> Todas</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Botão de Debug */}
        <div className="text-center">
          <Button 
            onClick={debugRelatorio} 
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {isLoading ? 'Analisando Relatório...' : 'Debugar Relatório'}
          </Button>
        </div>

        {/* Resultados do Debug */}
        {debugInfo && (
          <>
            <Separator />
            
            <div className="space-y-4">
              {/* Status dos Dados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Hook Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs space-y-2">
                      <div><strong>Total:</strong> {debugInfo.hookData.total}</div>
                      {debugInfo.hookData.pendencias.map((p: any) => (
                        <div key={p.protocolo} className="p-2 bg-muted rounded">
                          <div><strong>{p.protocolo}</strong></div>
                          <div>Tipo: {p.tipo}</div>
                          <div>Vencimento: {p.data_vencimento}</div>
                          <div>Dias em aberto: {p.dias_em_aberto}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Após Filtro Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs space-y-2">
                      <div><strong>Total:</strong> {debugInfo.filteredByDate.total}</div>
                      <div><strong>Range:</strong> {debugInfo.dateRange.from} - {debugInfo.dateRange.to}</div>
                      {debugInfo.filteredByDate.pendencias.map((protocolo: string) => (
                        <Badge key={protocolo} variant="outline" className="text-xs">
                          {protocolo}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Query Direta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs space-y-2">
                      <div><strong>Total:</strong> {debugInfo.directQuery.total}</div>
                      {debugInfo.directQuery.error && (
                        <div className="text-red-600">Erro: {debugInfo.directQuery.error}</div>
                      )}
                      {debugInfo.directQuery.pendencias.map((p: any) => (
                        <div key={p.protocolo} className="p-1 bg-muted rounded text-xs">
                          {p.protocolo}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Análise de Status */}
              {Object.keys(debugInfo.statusAnalysis).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Análise de Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(debugInfo.statusAnalysis).map(([protocolo, info]: [string, any]) => (
                        <div key={protocolo} className="p-2 bg-muted rounded">
                          <div><strong>{protocolo}</strong></div>
                          <div>Status: <Badge variant="outline">{info.status}</Badge></div>
                          <div>Dias em aberto: {info.diasEmAberto}</div>
                          <div>Vencimento: {info.dataVencimento}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
