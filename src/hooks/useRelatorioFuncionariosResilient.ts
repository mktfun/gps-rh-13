import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface RelatorioFuncionarioResilient {
  funcionario_id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  status: string;
  cnpj_razao_social: string;
  data_contratacao: string;
  total_count: number;
  id: string;
  idade: number;
  created_at: string;
}

interface UseRelatorioFuncionariosResilientParams {
  cnpjId?: string;
  pageSize?: number;
  pageIndex?: number;
}

export const useRelatorioFuncionariosResilient = (params: UseRelatorioFuncionariosResilientParams = {}) => {
  const { data: empresaId } = useEmpresaId();
  const { cnpjId, pageSize = 10, pageIndex = 0 } = params;

  return useQuery({
    queryKey: ['relatorio-funcionarios-resilient', empresaId, cnpjId, pageSize, pageIndex],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('🔍 Tentando buscar relatório de funcionários (resilient):', { 
        empresaId, 
        cnpjId,
        pageSize, 
        pageOffset: pageIndex * pageSize 
      });

      try {
        // Try the SQL function first (after it's fixed)
        const { data, error } = await supabase.rpc('get_relatorio_funcionarios_empresa', {
          p_empresa_id: empresaId,
          p_cnpj_id: cnpjId || null,
          p_page_size: pageSize,
          p_page_offset: pageIndex * pageSize
        });

        if (error) {
          console.warn('⚠️ SQL function failed, trying fallback method:', error.message);
          throw error; // This will trigger the fallback
        }

        console.log('✅ SQL function succeeded');
        
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
          id: item.funcionario_id,
          idade: 0,
          created_at: item.data_contratacao,
        })) as RelatorioFuncionarioResilient[];
        
        const totalCount = results.length > 0 ? Number(results[0].total_count) : 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        return {
          data: results,
          totalCount,
          totalPages,
          currentPage: pageIndex,
          pageSize,
          method: 'sql_function'
        };

      } catch (sqlError) {
        console.warn('🔄 Falling back to direct query method');
        
        // Fallback: Direct query method
        const { data: cnpjsData, error: cnpjsError } = await supabase
          .from('cnpjs')
          .select('id, razao_social, cnpj')
          .eq('empresa_id', empresaId);

        if (cnpjsError) throw cnpjsError;

        if (!cnpjsData || cnpjsData.length === 0) {
          return {
            data: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: pageIndex,
            pageSize,
            method: 'fallback'
          };
        }

        const targetCnpjIds = cnpjId 
          ? cnpjsData.filter(c => c.id === cnpjId).map(c => c.id)
          : cnpjsData.map(c => c.id);

        if (targetCnpjIds.length === 0) {
          return {
            data: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: pageIndex,
            pageSize,
            method: 'fallback'
          };
        }

        // Count total
        const { count: totalCount, error: countError } = await supabase
          .from('funcionarios')
          .select('*', { count: 'exact', head: true })
          .in('cnpj_id', targetCnpjIds);

        if (countError) throw countError;

        // Get data
        const { data: funcionariosData, error: funcionariosError } = await supabase
          .from('funcionarios')
          .select(`
            id,
            nome,
            cpf,
            cargo,
            salario,
            status,
            created_at,
            cnpj_id,
            cnpjs!inner(id, razao_social, cnpj)
          `)
          .in('cnpj_id', targetCnpjIds)
          .range(pageIndex * pageSize, (pageIndex * pageSize) + pageSize - 1)
          .order('nome');

        if (funcionariosError) throw funcionariosError;

        console.log('✅ Fallback method succeeded');

        const results: RelatorioFuncionarioResilient[] = (funcionariosData || []).map(f => ({
          funcionario_id: f.id,
          nome: f.nome,
          cpf: f.cpf,
          cargo: f.cargo || '',
          salario: f.salario || 0,
          status: f.status,
          cnpj_razao_social: f.cnpjs?.razao_social || '',
          data_contratacao: f.created_at.split('T')[0],
          total_count: totalCount || 0,
          id: f.id,
          idade: 0,
          created_at: f.created_at
        }));

        const totalPages = Math.ceil((totalCount || 0) / pageSize);

        return {
          data: results,
          totalCount: totalCount || 0,
          totalPages,
          currentPage: pageIndex,
          pageSize,
          method: 'fallback'
        };
      }
    },
    enabled: !!empresaId,
    retry: 1, // Only retry once to avoid infinite loops
  });
};
