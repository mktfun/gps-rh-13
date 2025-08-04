
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface PlanoComMetricas {
  plano_id: string;
  cnpj_id: string;
  seguradora: string;
  valor_unitario: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  cnpj_numero: string;
  cnpj_razao_social: string;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
  total_funcionarios: number;
  custo_mensal_real: number;
}

export const useEmpresaPlanosUnificados = () => {
  const { data: empresaId, isLoading: isLoadingEmpresa } = useEmpresaId();

  return useQuery({
    queryKey: ['empresa-planos-unificados', empresaId],
    queryFn: async (): Promise<PlanoComMetricas[]> => {
      if (!empresaId) throw new Error('Empresa não encontrada');

      console.log('🔍 Buscando planos unificados da empresa:', empresaId);

      const { data: planos, error } = await supabase
        .rpc('get_empresa_planos_unificados', {
          p_empresa_id: empresaId
        });

      if (error) {
        console.error('❌ Erro ao buscar planos unificados:', error);
        throw error;
      }

      console.log('✅ Planos unificados encontrados:', planos?.length || 0);
      console.log('📊 Dados dos planos:', planos);
      
      return planos || [];
    },
    enabled: !!empresaId && !isLoadingEmpresa,
  });
};
