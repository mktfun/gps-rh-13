import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RelatorioFinanceiroItem {
  empresa_id: string;
  empresa_nome: string;
  total_cnpjs_ativos: number;
  total_funcionarios_segurados: number;
  custo_total_mensal: number;
}

export const useRelatorioFinanceiroCorretora = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['relatorio-financeiro-corretora', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Chamando RPC get_empresas_com_metricas para relatório financeiro (sem parâmetro)');

      // Usar get_empresas_com_metricas sem parâmetro (já filtra por RLS)
      const { data, error } = await supabase.rpc('get_empresas_com_metricas');

      if (error) {
        console.error('Erro ao buscar relatório financeiro:', error);
        throw error;
      }

      console.log('Dados retornados da RPC get_empresas_com_metricas:', data);

      // A função get_empresas_com_metricas agora retorna dados de empresas
      // Vamos processar os dados para o relatório financeiro
      if (data && Array.isArray(data)) {
        const sanitizedData: RelatorioFinanceiroItem[] = data.map((empresa: any) => ({
          empresa_id: empresa.id || 'unknown',
          empresa_nome: empresa.nome || 'Empresa Desconhecida',
          total_cnpjs_ativos: Number(empresa.total_funcionarios) > 0 ? 1 : 0, // Estimate based on having employees
          total_funcionarios_segurados: Number(empresa.total_funcionarios) || 0,
          custo_total_mensal: Number(empresa.total_funcionarios) * 450 || 0, // Estimate R$450 per employee
        }));

        console.log('Dados processados para relatório financeiro (array):', sanitizedData);
        return sanitizedData;
      }

      // Se for array (empresas individuais), processa normalmente
      const sanitizedData = Array.isArray(data) ? data.map((item: any) => ({
        empresa_id: String(item.id) || '',
        empresa_nome: String(item.nome) || '',
        total_cnpjs_ativos: isNaN(Number(item.total_cnpjs)) ? 0 : Number(item.total_cnpjs),
        total_funcionarios_segurados: isNaN(Number(item.total_funcionarios)) ? 0 : Number(item.total_funcionarios),
        custo_total_mensal: isNaN(Number(item.custo_mensal_total)) ? 0 : Number(item.custo_mensal_total),
      })) : [];

      console.log('Dados processados para relatório financeiro (array):', sanitizedData);
      return sanitizedData as RelatorioFinanceiroItem[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });
};
