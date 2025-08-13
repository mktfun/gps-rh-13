import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

export const useDebugCostsData = () => {
  const { data: empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['debug-costs-data', empresaId],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('🔍 Debug: Buscando dados básicos para empresa:', empresaId);

      // 1. Verificar CNPJs da empresa
      const { data: cnpjs, error: cnpjsError } = await supabase
        .from('cnpjs')
        .select('id, razao_social, cnpj, status, created_at')
        .eq('empresa_id', empresaId);

      if (cnpjsError) throw cnpjsError;

      // 2. Verificar funcionários
      const { data: funcionarios, error: funcError } = await supabase
        .from('funcionarios')
        .select('id, nome, cpf, status, cnpj_id, created_at, data_exclusao')
        .in('cnpj_id', cnpjs?.map(c => c.id) || []);

      if (funcError) throw funcError;

      // 3. Verificar dados de planos
      const { data: planos, error: planosError } = await supabase
        .from('dados_planos')
        .select('id, cnpj_id, valor_mensal, seguradora, tipo_seguro, created_at')
        .in('cnpj_id', cnpjs?.map(c => c.id) || []);

      if (planosError) throw planosError;

      // 4. Executar a função SQL diretamente para comparar
      const { data: sqlResult, error: sqlError } = await supabase.rpc('get_relatorio_custos_empresa', {
        p_empresa_id: empresaId,
        p_page_size: 5,
        p_page_offset: 0
      });

      return {
        empresaId,
        cnpjs: cnpjs || [],
        funcionarios: funcionarios || [],
        planos: planos || [],
        sqlResult: sqlResult || [],
        sqlError,
        summary: {
          total_cnpjs: cnpjs?.length || 0,
          cnpjs_with_plans: planos?.length || 0,
          total_funcionarios: funcionarios?.length || 0,
          funcionarios_ativos: funcionarios?.filter(f => f.status === 'ativo').length || 0,
          total_plan_value: planos?.reduce((sum, p) => sum + (Number(p.valor_mensal) || 0), 0) || 0,
          plans_by_cnpj: cnpjs?.map(cnpj => ({
            cnpj: cnpj.cnpj,
            razao_social: cnpj.razao_social,
            funcionarios: funcionarios?.filter(f => f.cnpj_id === cnpj.id).length || 0,
            funcionarios_ativos: funcionarios?.filter(f => f.cnpj_id === cnpj.id && f.status === 'ativo').length || 0,
            plano: planos?.find(p => p.cnpj_id === cnpj.id),
          })) || []
        }
      };
    },
    enabled: !!empresaId,
  });
};
