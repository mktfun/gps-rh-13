
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UpdatePlanoSaudeData {
  plano_id: string;
  seguradora: string;
  nomePlano: string;
  faixasPreco: Record<string, number>;
}

interface PlanoSaudeResponse {
  success: boolean;
  error?: string;
  message?: string;
}

const FAIXAS_ETARIAS = [
  { key: '00-18', faixa_inicio: 0, faixa_fim: 18 },
  { key: '19-23', faixa_inicio: 19, faixa_fim: 23 },
  { key: '24-28', faixa_inicio: 24, faixa_fim: 28 },
  { key: '29-33', faixa_inicio: 29, faixa_fim: 33 },
  { key: '34-38', faixa_inicio: 34, faixa_fim: 38 },
  { key: '39-43', faixa_inicio: 39, faixa_fim: 43 },
  { key: '44-48', faixa_inicio: 44, faixa_fim: 48 },
  { key: '49-53', faixa_inicio: 49, faixa_fim: 53 },
  { key: '54-58', faixa_inicio: 54, faixa_fim: 58 },
  { key: '59+', faixa_inicio: 59, faixa_fim: 999 },
];

export const usePlanosSaudeEditMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePlanoSaudeData) => {
      console.log('🔄 Atualizando plano de saúde:', data);
      
      // 1. Atualizar informações básicas do plano
      const { error: updateError } = await supabase
        .from('dados_planos')
        .update({
          seguradora: data.seguradora,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.plano_id);

      if (updateError) {
        console.error('❌ Erro ao atualizar plano:', updateError);
        throw updateError;
      }

      // 2. Deletar faixas de preço antigas
      const { error: deleteError } = await supabase
        .from('planos_faixas_de_preco')
        .delete()
        .eq('plano_id', data.plano_id);

      if (deleteError) {
        console.error('❌ Erro ao deletar faixas antigas:', deleteError);
        throw deleteError;
      }

      // 3. Inserir novas faixas de preço
      const faixasToInsert = FAIXAS_ETARIAS
        .filter(faixa => data.faixasPreco[faixa.key] && data.faixasPreco[faixa.key] > 0)
        .map(faixa => ({
          plano_id: data.plano_id,
          faixa_inicio: faixa.faixa_inicio,
          faixa_fim: faixa.faixa_fim,
          valor: data.faixasPreco[faixa.key]
        }));

      if (faixasToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('planos_faixas_de_preco')
          .insert(faixasToInsert);

        if (insertError) {
          console.error('❌ Erro ao inserir novas faixas:', insertError);
          throw insertError;
        }
      }

      console.log('✅ Plano de saúde atualizado com sucesso');
      return { success: true, message: 'Plano atualizado com sucesso!' } as PlanoSaudeResponse;
    },
    onSuccess: () => {
      toast.success('Plano de saúde atualizado com sucesso!');
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['plano-detalhes-cnpj-saude'] });
      queryClient.invalidateQueries({ queryKey: ['plano-faixas-preco'] });
      queryClient.invalidateQueries({ queryKey: ['dados-planos-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cnpjs-com-planos'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro na atualização do plano:', error);
      toast.error(error?.message || 'Erro ao atualizar plano de saúde');
    },
  });
};
