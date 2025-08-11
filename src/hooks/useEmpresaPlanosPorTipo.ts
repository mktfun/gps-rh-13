
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PlanoEmpresaPorTipo {
  id: string;
  seguradora: string;
  valor_mensal: number;
  valor_mensal_calculado?: number; // Novo campo para o valor calculado
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

export const useEmpresaPlanosPorTipo = (tipo: 'vida' | 'saude') => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['planos-empresa-por-tipo', empresaId, tipo],
    queryFn: async (): Promise<PlanoEmpresaPorTipo[]> => {
      if (!empresaId) {
        console.log('🔍 useEmpresaPlanosPorTipo - Empresa ID não encontrado');
        return [];
      }

      console.log('🔍 useEmpresaPlanosPorTipo - Buscando planos tipo', tipo, 'para empresa:', empresaId);

      // Buscar planos do tipo específico para a empresa
      const { data: planos, error: planosError } = await supabase
        .from('dados_planos')
        .select(`
          *,
          cnpjs!inner (
            id,
            cnpj,
            razao_social,
            empresa_id
          )
        `)
        .eq('cnpjs.empresa_id', empresaId)
        .eq('tipo_seguro', tipo);

      if (planosError) {
        console.error('❌ useEmpresaPlanosPorTipo - Erro ao buscar planos:', planosError);
        throw planosError;
      }

      if (!planos || planos.length === 0) {
        console.log('✅ useEmpresaPlanosPorTipo - Nenhum plano encontrado para tipo:', tipo);
        return [];
      }

      // Buscar contagem de funcionários ATIVOS e calcular valor mensal para cada plano
      const planosComFuncionarios = await Promise.all(
        planos.map(async (plano: any) => {
          const { data: funcionariosData, error: funcionariosError } = await supabase
            .from('funcionarios')
            .select('id', { count: 'exact' })
            .eq('cnpj_id', plano.cnpj_id)
            .eq('status', 'ativo');

          if (funcionariosError) {
            console.error('❌ Erro ao buscar funcionários:', funcionariosError);
          }

          // Calcular valor mensal se for plano de saúde
          let valorCalculado = plano.valor_mensal;
          if (tipo === 'saude') {
            try {
              const { data: valorData, error: valorError } = await supabase.rpc('calcular_valor_mensal_plano_saude', {
                plano_uuid: plano.id
              });
              
              if (!valorError && valorData !== null) {
                valorCalculado = valorData;
              }
            } catch (error) {
              console.error('❌ Erro ao calcular valor mensal:', error);
            }
          }

          return {
            id: plano.id,
            seguradora: plano.seguradora,
            valor_mensal: plano.valor_mensal,
            valor_mensal_calculado: valorCalculado,
            cobertura_morte: plano.cobertura_morte,
            cobertura_morte_acidental: plano.cobertura_morte_acidental,
            cobertura_invalidez_acidente: plano.cobertura_invalidez_acidente,
            cobertura_auxilio_funeral: plano.cobertura_auxilio_funeral,
            cnpj_id: plano.cnpj_id,
            cnpj_numero: plano.cnpjs.cnpj,
            cnpj_razao_social: plano.cnpjs.razao_social,
            tipo_seguro: plano.tipo_seguro,
            total_funcionarios: funcionariosData?.length || 0,
          };
        })
      );

      console.log('✅ useEmpresaPlanosPorTipo - Planos encontrados:', planosComFuncionarios.length, 'tipo:', tipo);
      return planosComFuncionarios;
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
