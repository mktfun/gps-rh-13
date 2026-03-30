
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

export interface CreatePlanoData {
  cnpj_id: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  tipo_seguro: 'vida' | 'saude' | 'outros';
}

export interface UpdatePlanoData {
  plano_id: string;
  cnpj_id: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  tipo_seguro: 'vida' | 'saude' | 'outros';
}

interface RPCResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export const usePlanosMutation = () => {
  const queryClient = useQueryClient();

  const createPlano = useMutation({
    mutationFn: async (data: CreatePlanoData) => {
      logger.info('🔄 Criando plano:', data);
      
      // Use direct RPC call to ensure the function exists
      const { data: result, error } = await supabase.rpc('create_plano_v2' as any, {
        p_cnpj_id: data.cnpj_id,
        p_seguradora: data.seguradora,
        p_valor_mensal: data.valor_mensal,
        p_cobertura_morte: data.cobertura_morte,
        p_cobertura_morte_acidental: data.cobertura_morte_acidental,
        p_cobertura_invalidez_acidente: data.cobertura_invalidez_acidente,
        p_cobertura_auxilio_funeral: data.cobertura_auxilio_funeral,
        p_tipo_seguro: data.tipo_seguro
      });

      if (error) {
        logger.error('❌ Erro ao criar plano:', error);
        throw error;
      }

      const response = result as unknown as RPCResponse;
      if (response && !response.success) {
        logger.error('❌ Erro retornado pela função:', response.error);
        throw new Error(response.error);
      }

      logger.info('✅ Plano criado com sucesso:', result);
      return response;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Plano criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['dados-planos-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cnpjs-com-planos'] });
      queryClient.invalidateQueries({ queryKey: ['pulse-financeiro'] });
    },
    onError: (error: any) => {
      logger.error('❌ Erro na mutação de criação:', error);
      handleApiError(error, 'Ao criar plano');
    },
  });

  const updatePlano = useMutation({
    mutationFn: async (data: UpdatePlanoData) => {
      logger.info('🔄 Atualizando plano:', data);
      
      // Use direct RPC call to ensure the function exists
      const { data: result, error } = await supabase.rpc('update_plano_v2' as any, {
        p_plano_id: data.plano_id,
        p_seguradora: data.seguradora,
        p_valor_mensal: data.valor_mensal,
        p_cobertura_morte: data.cobertura_morte,
        p_cobertura_morte_acidental: data.cobertura_morte_acidental,
        p_cobertura_invalidez_acidente: data.cobertura_invalidez_acidente,
        p_cobertura_auxilio_funeral: data.cobertura_auxilio_funeral,
        p_tipo_seguro: data.tipo_seguro
      });

      if (error) {
        logger.error('❌ Erro ao atualizar plano:', error);
        throw error;
      }

      const response = result as unknown as RPCResponse;
      if (response && !response.success) {
        logger.error('❌ Erro retornado pela função:', response.error);
        throw new Error(response.error);
      }

      logger.info('✅ Plano atualizado com sucesso:', result);
      return response;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Plano atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['dados-planos-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cnpjs-com-planos'] });
      queryClient.invalidateQueries({ queryKey: ['plano-detalhes'] });
      queryClient.invalidateQueries({ queryKey: ['pulse-financeiro'] });
    },
    onError: (error: any) => {
      logger.error('❌ Erro na mutação de atualização:', error);
      handleApiError(error, 'Ao atualizar plano');
    },
  });

  const deletePlano = useMutation({
    mutationFn: async (planoId: string) => {
      logger.info('🔄 Excluindo plano:', planoId);
      
      const { data: result, error } = await supabase.rpc('delete_plano', {
        p_plano_id: planoId
      });

      if (error) {
        logger.error('❌ Erro ao excluir plano:', error);
        throw error;
      }

      const response = result as unknown as RPCResponse;
      if (response && !response.success) {
        logger.error('❌ Erro retornado pela função:', response.error);
        throw new Error(response.error);
      }

      logger.info('✅ Plano excluído com sucesso:', result);
      return response;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Plano excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['dados-planos-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cnpjs-com-planos'] });
      queryClient.invalidateQueries({ queryKey: ['plano-detalhes'] });
      queryClient.invalidateQueries({ queryKey: ['pulse-financeiro'] });
    },
    onError: (error: any) => {
      logger.error('❌ Erro na mutação de exclusão:', error);
      handleApiError(error, 'Ao excluir plano');
    },
  });

  return {
    createPlano,
    updatePlano,
    deletePlano,
  };
};
