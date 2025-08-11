
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      console.log('🔄 Criando plano:', data);
      
      // Verificar se já existe um plano do mesmo tipo para este CNPJ
      const { data: existingPlano, error: checkError } = await supabase
        .from('dados_planos')
        .select('id')
        .eq('cnpj_id', data.cnpj_id)
        .eq('tipo_seguro', data.tipo_seguro)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Erro ao verificar plano existente:', checkError);
        throw checkError;
      }

      if (existingPlano?.id) {
        const tipoTexto = data.tipo_seguro === 'vida' ? 'Seguro de Vida' : 
                         data.tipo_seguro === 'saude' ? 'Plano de Saúde' : 'Seguro';
        throw new Error(`Já existe um ${tipoTexto} cadastrado para este CNPJ`);
      }

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
        console.error('❌ Erro ao criar plano:', error);
        throw error;
      }

      const response = result as unknown as RPCResponse;
      if (response && !response.success) {
        console.error('❌ Erro retornado pela função:', response.error);
        throw new Error(response.error);
      }

      console.log('✅ Plano criado com sucesso:', result);
      return response;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Plano criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['dados-planos-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cnpjs-com-planos'] });
      queryClient.invalidateQueries({ queryKey: ['pulse-financeiro'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutação de criação:', error);
      toast.error(error?.message || 'Erro ao criar plano');
    },
  });

  const updatePlano = useMutation({
    mutationFn: async (data: UpdatePlanoData) => {
      console.log('🔄 Atualizando plano:', data);
      
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
        console.error('❌ Erro ao atualizar plano:', error);
        throw error;
      }

      const response = result as unknown as RPCResponse;
      if (response && !response.success) {
        console.error('❌ Erro retornado pela função:', response.error);
        throw new Error(response.error);
      }

      console.log('✅ Plano atualizado com sucesso:', result);
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
      console.error('❌ Erro na mutação de atualização:', error);
      toast.error(error?.message || 'Erro ao atualizar plano');
    },
  });

  const deletePlano = useMutation({
    mutationFn: async (planoId: string) => {
      console.log('🔄 Excluindo plano:', planoId);
      
      const { data: result, error } = await supabase.rpc('delete_plano', {
        p_plano_id: planoId
      });

      if (error) {
        console.error('❌ Erro ao excluir plano:', error);
        throw error;
      }

      const response = result as unknown as RPCResponse;
      if (response && !response.success) {
        console.error('❌ Erro retornado pela função:', response.error);
        throw new Error(response.error);
      }

      console.log('✅ Plano excluído com sucesso:', result);
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
      console.error('❌ Erro na mutação de exclusão:', error);
      toast.error(error?.message || 'Erro ao excluir plano');
    },
  });

  return {
    createPlano,
    updatePlano,
    deletePlano,
  };
};
