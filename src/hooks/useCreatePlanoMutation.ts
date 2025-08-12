
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreatePlanoData {
  cnpj_id: string;
  tipo_seguro: 'vida' | 'saude';
  seguradora: string;
  valor_mensal: number;
  cobertura_morte?: number;
  cobertura_morte_acidental?: number;
  cobertura_invalidez_acidente?: number;
  cobertura_auxilio_funeral?: number;
}

export const useCreatePlanoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlanoData) => {
      console.log('🔄 Criando novo plano:', data);
      
      // Verificar se já existe um plano com o mesmo cnpj_id e tipo_seguro
      const { data: existingPlano, error: checkError } = await supabase
        .from('dados_planos')
        .select('id')
        .eq('cnpj_id', data.cnpj_id)
        .eq('tipo_seguro', data.tipo_seguro)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar plano existente:', checkError);
        throw checkError;
      }

      if (existingPlano) {
        throw new Error(`Já existe um plano de ${data.tipo_seguro} para este CNPJ`);
      }

      // Criar o novo plano
      const { data: newPlano, error: insertError } = await supabase
        .from('dados_planos')
        .insert({
          cnpj_id: data.cnpj_id,
          tipo_seguro: data.tipo_seguro,
          seguradora: data.seguradora,
          valor_mensal: data.valor_mensal,
          cobertura_morte: data.cobertura_morte || 0,
          cobertura_morte_acidental: data.cobertura_morte_acidental || 0,
          cobertura_invalidez_acidente: data.cobertura_invalidez_acidente || 0,
          cobertura_auxilio_funeral: data.cobertura_auxilio_funeral || 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar plano:', insertError);
        throw insertError;
      }

      console.log('✅ Plano criado com sucesso:', newPlano);
      return newPlano;
    },
    onSuccess: (data, variables) => {
      toast.success('Plano configurado com sucesso!');
      
      console.log('🎯 Invalidação CIRÚRGICA de cache iniciada para:', {
        cnpj_id: variables.cnpj_id,
        tipo_seguro: variables.tipo_seguro,
        plano_id: data.id
      });

      // INVALIDAÇÃO CIRÚRGICA:
      
      // 1. Invalida a lista de empresas APENAS para o tipo de plano que mudou
      queryClient.invalidateQueries({ 
        queryKey: ['empresasComPlanos', variables.tipo_seguro] 
      });

      // 2. Invalida os detalhes do plano para ESTE CNPJ e ESTE tipo, forçando a tela a recarregar
      queryClient.invalidateQueries({ 
        queryKey: ['plano-detalhes', variables.cnpj_id, variables.tipo_seguro] 
      });

      // 3. Invalida o plano específico recém-criado
      queryClient.invalidateQueries({ 
        queryKey: ['plano-detalhes', data.id] 
      });

      console.log('✅ Cache invalidado com sucesso - apenas queries afetadas foram atualizadas');
    },
    onError: (error: any) => {
      console.error('❌ Erro na criação do plano:', error);
      toast.error(error?.message || 'Erro ao configurar plano');
    },
  });
};
