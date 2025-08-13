import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface RelatorioFuncionarioEmpresaSafe {
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

interface UseRelatorioFuncionariosEmpresaSafeParams {
  cnpjId?: string;
  pageSize?: number;
  pageIndex?: number;
}

export const useRelatorioFuncionariosEmpresaSafe = (params: UseRelatorioFuncionariosEmpresaSafeParams = {}) => {
  const { data: empresaId } = useEmpresaId();
  const { cnpjId, pageSize = 10, pageIndex = 0 } = params;

  return useQuery({
    queryKey: ['relatorio-funcionarios-empresa-safe', empresaId, cnpjId, pageSize, pageIndex],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('🔍 Buscando relatório de funcionários (safe):', { 
        empresaId, 
        cnpjId,
        pageSize, 
        pageOffset: pageIndex * pageSize 
      });

      // First, get the CNPJs for this empresa
      const { data: cnpjsData, error: cnpjsError } = await supabase
        .from('cnpjs')
        .select('id, razao_social, cnpj')
        .eq('empresa_id', empresaId);

      if (cnpjsError) {
        console.error('❌ Erro ao buscar CNPJs:', cnpjsError);
        throw cnpjsError;
      }

      if (!cnpjsData || cnpjsData.length === 0) {
        console.log('⚠️ Nenhum CNPJ encontrado para a empresa');
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: pageIndex,
          pageSize
        };
      }

      // Filter CNPJs if cnpjId is provided
      const targetCnpjIds = cnpjId 
        ? cnpjsData.filter(c => c.id === cnpjId).map(c => c.id)
        : cnpjsData.map(c => c.id);

      if (targetCnpjIds.length === 0) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: pageIndex,
          pageSize
        };
      }

      // Count total funcionarios for pagination
      const { count: totalCount, error: countError } = await supabase
        .from('funcionarios')
        .select('*', { count: 'exact', head: true })
        .in('cnpj_id', targetCnpjIds);

      if (countError) {
        console.error('❌ Erro ao contar funcionários:', countError);
        throw countError;
      }

      // Get funcionarios with pagination
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

      if (funcionariosError) {
        console.error('❌ Erro ao buscar funcionários:', funcionariosError);
        throw funcionariosError;
      }

      console.log('✅ Funcionários carregados (safe):', funcionariosData?.length || 0);

      const results: RelatorioFuncionarioEmpresaSafe[] = (funcionariosData || []).map(f => ({
        funcionario_id: f.id,
        nome: f.nome,
        cpf: f.cpf,
        cargo: f.cargo || '',
        salario: f.salario || 0,
        status: f.status,
        cnpj_razao_social: f.cnpjs?.razao_social || '',
        data_contratacao: f.created_at.split('T')[0], // Convert to date string
        total_count: totalCount || 0,
        // For compatibility
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
        pageSize
      };
    },
    enabled: !!empresaId,
  });
};
