
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Interface TypeScript PERFEITA - espelho exato do JSON do backend
interface RelatorioMovimentacaoItem {
  mes: string;           // "YYYY-MM"
  inclusoes: number;     // bigint vira number no TS
  exclusoes: number;     // bigint vira number no TS
  saldo: number;         // bigint vira number no TS
}

export const useRelatorioMovimentacao = (
  dataInicio: string,
  dataFim: string,
  enabled: boolean = true
) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const queryResult = useQuery({
    queryKey: ['relatorio-movimentacao', user?.id, dataInicio, dataFim],
    queryFn: async (): Promise<RelatorioMovimentacaoItem[]> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (!dataInicio || !dataFim) {
        throw new Error('Datas de início e fim são obrigatórias');
      }

      console.log('Chamando RPC get_relatorio_movimentacao_corretora com:', {
        user_id: user.id,
        dataInicio,
        dataFim
      });

      // A GAMBIARRA - usando (supabase as any).rpc()
      const { data, error } = await (supabase as any).rpc('get_relatorio_movimentacao_corretora', {
        p_corretora_id: user.id,
        p_data_inicio: dataInicio,
        p_data_fim: dataFim
      });

      if (error) {
        console.error('Erro na RPC get_relatorio_movimentacao_corretora:', error);
        toast({
          title: 'Erro ao carregar relatório',
          description: 'Não foi possível carregar o relatório de movimentação.',
          variant: 'destructive',
        });
        throw error;
      }

      // A VALIDAÇÃO - conversão de tipo e console.log com proteção contra NaN
      const dadosMovimentacao = Array.isArray(data) ? data.map((item: any) => ({
        mes: String(item.mes) || '',
        inclusoes: isNaN(Number(item.inclusoes)) ? 0 : Number(item.inclusoes),
        exclusoes: isNaN(Number(item.exclusoes)) ? 0 : Number(item.exclusoes),
        saldo: isNaN(Number(item.saldo)) ? 0 : Number(item.saldo)
      })) : [];
      
      console.log('Dados movimentação recebidos:', dadosMovimentacao);

      return dadosMovimentacao;
    },
    enabled: enabled && !!user?.id && !!dataInicio && !!dataFim,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  return {
    ...queryResult,
    data: queryResult.data || []
  };
};

export type { RelatorioMovimentacaoItem };
