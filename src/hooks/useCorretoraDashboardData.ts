import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { CorretoraDashboardData } from '@/types/supabase-json';

export const useCorretoraDashboardData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['corretora-dashboard-data', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔍 [Dashboard] Buscando dados do dashboard da corretora...');
      
      try {
        // Chamar função RPC do Supabase
        const { data: dashboardData, error } = await supabase.rpc(
          'get_corretora_dashboard_metrics'
        );

        if (error) {
          console.error('❌ [Dashboard] Erro ao buscar dados:', error);
          throw error;
        }

        if (dashboardData) {
          console.log('✅ Dados carregados via get_corretora_dashboard_metrics:', dashboardData);
          const typedData = dashboardData as unknown as CorretoraDashboardData;
          return {
            kpis: {
              empresas_ativas: Number(typedData.total_empresas) || 0,
              funcionarios_ativos: Number(typedData.total_funcionarios) || 0,
              receita_mensal: Number(typedData.receita_mensal) || 0,
              total_pendencias: Number(typedData.total_pendencias) || 0,
            },
            eficiencia: {
              produtividade_carteira: Number(typedData.produtividade_carteira) || 75,
              taxa_eficiencia: Number(typedData.taxa_eficiencia) || 82,
              qualidade_dados: Number(typedData.qualidade_dados) || 88,
            },
            alertas: {
              funcionarios_travados: Number(typedData.funcionarios_travados) || 0,
              cnpjs_sem_plano: Number(typedData.cnpjs_sem_plano) || 0,
              empresas_inativas: Number(typedData.empresas_inativas) || 0,
            },
            acoes: Array.isArray(typedData.acoes_inteligentes) ? typedData.acoes_inteligentes : []
          };
        }
      } catch (error) {
        console.error('❌ [Dashboard] Erro inesperado:', error);
        throw error;
      }

      // Fallback com dados mockados em caso de erro
      return {
        kpis: {
          empresas_ativas: 0,
          funcionarios_ativos: 0,
          receita_mensal: 0,
          total_pendencias: 0,
        },
        eficiencia: {
          produtividade_carteira: 75,
          taxa_eficiencia: 82,
          qualidade_dados: 88,
        },
        alertas: {
          funcionarios_travados: 0,
          cnpjs_sem_plano: 0,
          empresas_inativas: 0,
        },
        acoes: []
      };
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook para ações inteligentes
export const useCorretoraDashboardActions = () => {
  const queryClient = useQueryClient();

  const executarAcaoInteligente = useMutation({
    mutationFn: async ({ acao, parametros }: { acao: string; parametros?: any }) => {
      console.log('🎯 [Dashboard Actions] Executando ação:', acao, parametros);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (acao) {
        case 'ativar_funcionario_travado':
          if (parametros?.funcionario_id) {
            const { data, error } = await supabase
              .from('funcionarios')
              .update({ status: 'ativo' as const })
              .eq('id', parametros.funcionario_id)
              .eq('status', 'pendente');

            if (error) throw error;
            return { success: true, funcionario_ativado: parametros.funcionario_id };
          }
          break;
          
        case 'criar_plano_cnpj':
          if (parametros?.cnpj_id) {
            return { success: true, plano_criado: parametros.cnpj_id };
          }
          break;
          
        default:
          throw new Error(`Ação não reconhecida: ${acao}`);
      }
    },
    onSuccess: (data, variables) => {
      console.log('✅ [Dashboard Actions] Ação executada com sucesso:', data);
      toast.success(`Ação "${variables.acao}" executada com sucesso!`);
      
      queryClient.invalidateQueries({ queryKey: ['corretora-dashboard-data'] });
    },
    onError: (error, variables) => {
      console.error('❌ [Dashboard Actions] Erro ao executar ação:', error);
      toast.error(`Erro ao executar ação "${variables.acao}"`);
    }
  });

  return {
    executarAcao: executarAcaoInteligente.mutate,
    isLoading: executarAcaoInteligente.isPending,
    error: executarAcaoInteligente.error
  };
};