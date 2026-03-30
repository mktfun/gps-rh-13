
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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
      logger.info('🔄 Criando novo plano:', data);
      
      // Verificar se já existe um plano com o mesmo cnpj_id e tipo_seguro
      const { data: existingPlano, error: checkError } = await supabase
        .from('dados_planos')
        .select('id')
        .eq('cnpj_id', data.cnpj_id)
        .eq('tipo_seguro', data.tipo_seguro)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        logger.error('❌ Erro ao verificar plano existente:', checkError);
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
        logger.error('❌ Erro ao criar plano:', insertError);
        throw insertError;
      }

      logger.info('✅ Plano criado com sucesso:', newPlano);
      return newPlano;
    },
    onSuccess: () => {
      toast.success('Plano configurado com sucesso!');
      
      // Invalidar queries relevantes para atualizar as telas
      queryClient.invalidateQueries({ queryKey: ['empresasComPlanos'] });
      queryClient.invalidateQueries({ queryKey: ['cnpjs-com-planos'] });
      queryClient.invalidateQueries({ queryKey: ['dados-planos-cards'] });
    },
    onError: (error: any) => {
      logger.error('❌ Erro na criação do plano:', error);
      toast.error(error?.message || 'Erro ao configurar plano');
    },
  });
};
