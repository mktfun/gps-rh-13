import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Search, AlertTriangle } from 'lucide-react';

export const PendencyVisibilityDebug = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const { toast } = useToast();
  const { user, role } = useAuth();

  const runDebugAnalysis = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDebugResults(null);

    try {
      console.log('🔍 Iniciando análise de visibilidade de pendências...');

      // 1. Check funcionarios with status pendente
      const { data: funcionariosPendentes, error: funcError } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          cpf,
          status,
          cnpj_id,
          cnpjs!inner (
            id,
            razao_social,
            empresa_id,
            empresas!inner (
              id,
              nome,
              corretora_id
            )
          )
        `)
        .eq('status', 'pendente')
        .eq('cnpjs.empresas.corretora_id', user.id);

      if (funcError) {
        console.error('❌ Erro ao buscar funcionários pendentes:', funcError);
        throw funcError;
      }

      // 2. Check existing pendencias for these funcionarios
      const funcionarioIds = funcionariosPendentes?.map(f => f.id) || [];
      const { data: pendenciasExistentes, error: pendError } = await supabase
        .from('pendencias')
        .select('*')
        .in('funcionario_id', funcionarioIds);

      if (pendError) {
        console.error('❌ Erro ao buscar pendências existentes:', pendError);
        throw pendError;
      }

      // 3. Check pendencias visible to corretora
      const { data: pendenciasCorretora, error: corrError } = await supabase
        .from('pendencias')
        .select(`
          *,
          funcionarios(nome, cpf, status),
          cnpjs(razao_social, empresa_id)
        `)
        .eq('corretora_id', user.id)
        .eq('status', 'pendente');

      if (corrError) {
        console.error('❌ Erro ao buscar pendências da corretora:', corrError);
        throw corrError;
      }

      // 4. Check RLS access
      const { data: rlsTest, error: rlsError } = await supabase
        .rpc('debug_pendencias_permissions', { p_empresa_id: null });

      // 5. Analyze results
      const funcionariosSemPendencia = funcionariosPendentes?.filter(func => 
        !pendenciasExistentes?.some(pend => pend.funcionario_id === func.id)
      ) || [];

      const pendenciasOrfas = pendenciasExistentes?.filter(pend =>
        !pendenciasCorretora?.some(corr => corr.id === pend.id)
      ) || [];

      const results = {
        funcionariosPendentes: funcionariosPendentes?.length || 0,
        funcionariosSemPendencia: funcionariosSemPendencia.length,
        pendenciasExistentes: pendenciasExistentes?.length || 0,
        pendenciasVisiveisCorretora: pendenciasCorretora?.length || 0,
        pendenciasOrfas: pendenciasOrfas.length,
        rlsAccess: rlsTest || 'Não testado',
        detalhes: {
          funcionariosPendentes,
          funcionariosSemPendencia,
          pendenciasExistentes,
          pendenciasCorretora,
          pendenciasOrfas
        }
      };

      setDebugResults(results);

      console.log('📊 Análise completa:', results);

      if (funcionariosSemPendencia.length > 0) {
        toast({
          title: "Problemas Encontrados",
          description: `${funcionariosSemPendencia.length} funcionário(s) pendente(s) sem registro de pendência`,
          variant: "destructive",
        });
      } else if (pendenciasOrfas.length > 0) {
        toast({
          title: "Problemas de Visibilidade",
          description: `${pendenciasOrfas.length} pendência(s) não visível(is) para a corretora`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Análise Concluída",
          description: "Nenhum problema de visibilidade detectado",
        });
      }

    } catch (error) {
      console.error('❌ Erro na análise:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar análise de pendências",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Debug: Visibilidade de Pendências
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runDebugAnalysis}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Analisando...' : 'Analisar Visibilidade de Pendências'}
        </Button>

        {debugResults && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Funcionários Pendentes</div>
                <div className="text-lg font-bold text-yellow-600">
                  {debugResults.funcionariosPendentes}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Pendências Existentes</div>
                <div className="text-lg font-bold text-blue-600">
                  {debugResults.pendenciasExistentes}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Visíveis para Corretora</div>
                <div className="text-lg font-bold text-green-600">
                  {debugResults.pendenciasVisiveisCorretora}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Sem Pendência</div>
                <div className="text-lg font-bold text-red-600">
                  {debugResults.funcionariosSemPendencia}
                </div>
              </div>
            </div>

            {debugResults.funcionariosSemPendencia > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center gap-2 text-red-700 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Funcionários sem pendência detectados
                </div>
                <div className="text-red-600 text-xs mt-1">
                  Use o botão "Corrigir Pendências" para criar registros faltantes.
                </div>
              </div>
            )}

            {debugResults.pendenciasOrfas > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center gap-2 text-yellow-700 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Pendências com problemas de visibilidade
                </div>
                <div className="text-yellow-600 text-xs mt-1">
                  Pendências existem mas não são visíveis para a corretora.
                </div>
              </div>
            )}

            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Ver detalhes técnicos</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(debugResults.detalhes, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
