
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

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
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
}

export const useEmpresaPlanos = () => {
  const { data: empresaId, isLoading: isLoadingEmpresa } = useEmpresaId();

  return useQuery({
    queryKey: ['empresa-planos', empresaId],
    queryFn: async (): Promise<PlanoEmpresa[]> => {
      if (!empresaId) throw new Error('Empresa não encontrada');

      console.log('🔍 Buscando planos da empresa:', empresaId);

      // Buscar planos através dos CNPJs da empresa
      const { data: planos, error } = await supabase
        .from('dados_planos')
        .select(`
          *,
          cnpjs!inner(
            id,
            cnpj,
            razao_social,
            empresa_id
          )
        `)
        .eq('cnpjs.empresa_id', empresaId);

      if (error) {
        console.error('❌ Erro ao buscar planos da empresa:', error);
        throw error;
      }

      if (!planos || planos.length === 0) {
        console.log('📋 Nenhum plano encontrado para a empresa');
        return [];
      }

      // Para cada plano, buscar dados dos funcionários
      const planosComFuncionarios = await Promise.all(
        planos.map(async (plano: any) => {
          const { data: funcionarios } = await supabase
            .from('funcionarios')
            .select('id, status')
            .eq('cnpj_id', plano.cnpj_id);

          const funcionariosData = funcionarios || [];
          const funcionarios_ativos = funcionariosData.filter(f => f.status === 'ativo').length;
          const funcionarios_pendentes = funcionariosData.filter(f => f.status === 'pendente').length;
          const total_funcionarios = funcionarios_ativos + funcionarios_pendentes;

          return {
            id: plano.id,
            seguradora: plano.seguradora,
            valor_mensal: plano.valor_mensal,
            cobertura_morte: plano.cobertura_morte,
            cobertura_morte_acidental: plano.cobertura_morte_acidental,
            cobertura_invalidez_acidente: plano.cobertura_invalidez_acidente,
            cobertura_auxilio_funeral: plano.cobertura_auxilio_funeral,
            cnpj_id: plano.cnpj_id,
            cnpj_numero: plano.cnpjs.cnpj,
            cnpj_razao_social: plano.cnpjs.razao_social,
            total_funcionarios,
            funcionarios_ativos,
            funcionarios_pendentes,
          };
        })
      );

      console.log('✅ Planos da empresa encontrados:', planosComFuncionarios.length);
      return planosComFuncionarios;
    },
    enabled: !!empresaId && !isLoadingEmpresa,
  });
};
