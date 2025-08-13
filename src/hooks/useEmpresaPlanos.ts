import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PlanoEmpresa {
  id: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  cnpj_id: string;
  cnpj_numero: string;
  cnpj_razao_social: string;
  tipo_seguro: string;
  total_funcionarios?: number;
}

export const useEmpresaPlanos = () => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['planos-empresa', empresaId],
    queryFn: async (): Promise<PlanoEmpresa[]> => {
      if (!empresaId) {
        console.log('🔍 useEmpresaPlanos - Empresa ID não encontrado');
        return [];
      }

      console.log('🔍 useEmpresaPlanos - Buscando planos para empresa:', empresaId);

      const { data, error } = await supabase.rpc('get_planos_por_empresa', {
        p_empresa_id: empresaId,
      });

      if (error) {
        console.error('❌ useEmpresaPlanos - Erro ao buscar planos da empresa:', error);
        throw error;
      }

      // Buscar contagem de funcionários ATIVOS VINCULADOS AO PLANO ESPECÍFICO
      const planosComFuncionarios = await Promise.all(
        (data || []).map(async (plano: any) => {
          const { data: funcionariosData, error: funcionariosError } = await supabase
            .from('planos_funcionarios')
            .select('id', { count: 'exact' })
            .eq('plano_id', plano.id)
            .eq('status', 'ativo'); // Apenas funcionários ativos NO PLANO

          if (funcionariosError) {
            console.error('❌ Erro ao buscar funcionários do plano:', funcionariosError);
          }

          console.log(`📊 Plano ${plano.seguradora}: ${funcionariosData?.length || 0} funcionários vinculados`);

          return {
            ...plano,
            tipo_seguro: plano.tipo_seguro || 'vida',
            total_funcionarios: funcionariosData?.length || 0,
          };
        })
      );

      console.log('✅ useEmpresaPlanos - Planos encontrados:', planosComFuncionarios?.length || 0);
      return planosComFuncionarios;
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
