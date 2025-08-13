import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface RelatorioFuncionarioEmpresaPaginado {
  funcionario_id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  status: string;
  cnpj_razao_social: string;
  data_contratacao: string;
  total_count: number; // Will be converted from BIGINT to number
  // Campos adicionais para compatibilidade com FuncionarioEmpresa
  id: string;
  idade: number;
  created_at: string;
}

interface UseRelatorioFuncionariosEmpresaPaginadoParams {
  cnpjId?: string;
  pageSize?: number;
  pageIndex?: number;
}

export const useRelatorioFuncionariosEmpresaPaginado = (params: UseRelatorioFuncionariosEmpresaPaginadoParams = {}) => {
  const { data: empresaId } = useEmpresaId();
  const { cnpjId, pageSize = 10, pageIndex = 0 } = params;

  return useQuery({
    queryKey: ['relatorio-funcionarios-empresa-paginado', empresaId, cnpjId, pageSize, pageIndex],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('Buscando relatório de funcionários paginado:', { 
        empresaId, 
        cnpjId,
        pageSize, 
        pageOffset: pageIndex * pageSize 
      });

      const { data, error } = await (supabase as any).rpc('get_relatorio_funcionarios_empresa', {
        p_empresa_id: empresaId,
        p_cnpj_id: cnpjId || null,
        p_page_size: pageSize,
        p_page_offset: pageIndex * pageSize
      });

      if (error) {
        console.error('Erro ao buscar relatório de funcionários paginado:', error);
        throw error;
      }

      console.log('✅ Relatório de funcionários paginado carregado:', data);
      
      const results = (data || []).map((item: any) => ({
        funcionario_id: item.funcionario_id,
        nome: item.nome,
        cpf: item.cpf,
        cargo: item.cargo,
        salario: item.salario,
        status: item.status,
        cnpj_razao_social: item.cnpj_razao_social,
        data_contratacao: item.data_contratacao,
        total_count: Number(item.total_count), // Convert BIGINT to number
        // Mapeamento para compatibilidade
        id: item.funcionario_id,
        idade: 0, // Valor padrão - não disponível na função SQL
        created_at: item.data_contratacao,
      })) as RelatorioFuncionarioEmpresaPaginado[];
      
      const totalCount = results.length > 0 ? Number(results[0].total_count) : 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: results,
        totalCount,
        totalPages,
        currentPage: pageIndex,
        pageSize
      };
    },
    enabled: !!empresaId,
  });
};
