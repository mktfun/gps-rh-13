import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

interface FuncionariosReportKPIs {
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_inativos: number;
  taxa_cobertura: number;
}

interface EvolucaoTemporal {
  mes: string;
  mes_nome: string;
  funcionarios_ativos: number;
  funcionarios_inativos: number;
  novas_contratacoes: number;
  desligamentos: number;
}

interface DistribuicaoStatus {
  status: string;
  quantidade: number;
  percentual: number;
}

interface FuncionariosPorCNPJ {
  cnpj: string;
  razao_social: string;
  funcionarios_ativos: number;
  funcionarios_inativos: number;
  total: number;
}

interface TabelaDetalhada {
  id: string;
  nome_completo: string;
  cpf: string;
  cnpj: string;
  razao_social: string;
  status: string;
  data_admissao: string;
  data_ativacao_seguro: string;
  valor_individual: number;
  total_dependentes: number;
}

interface FuncionariosReportData {
  kpis: FuncionariosReportKPIs;
  evolucao_temporal: EvolucaoTemporal[];
  distribuicao_status: DistribuicaoStatus[];
  funcionarios_por_cnpj: FuncionariosPorCNPJ[];
  tabela_detalhada: TabelaDetalhada[];
  periodo: {
    inicio: string;
    fim: string;
  };
}

interface UseFuncionariosReportParams {
  startDate?: Date;
  endDate?: Date;
  statusFilter?: string;
  cnpjFilter?: string;
  searchTerm?: string;
}

export const useFuncionariosReport = (params: UseFuncionariosReportParams = {}) => {
  const { data: empresaId } = useEmpresaId();

  const startDate = params.startDate || startOfMonth(new Date());
  const endDate = params.endDate || endOfMonth(new Date());

  return useQuery({
    queryKey: ['funcionarios-report', empresaId, params],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('🔍 [useFuncionariosReport] Buscando relatório de funcionários:', {
        empresaId,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        statusFilter: params.statusFilter,
        cnpjFilter: params.cnpjFilter,
        searchTerm: params.searchTerm
      });

      // 1. Primeiro, buscar todos os CNPJs da empresa
      const { data: cnpjsData, error: cnpjsError } = await supabase
        .from('cnpjs')
        .select('id')
        .eq('empresa_id', empresaId);

      if (cnpjsError) {
        console.error('❌ [useFuncionariosReport] Erro ao buscar CNPJs:', cnpjsError);
        throw cnpjsError;
      }

      if (!cnpjsData || cnpjsData.length === 0) {
        console.log('⚠️ [useFuncionariosReport] Nenhum CNPJ encontrado para a empresa');
        return {
          kpis: { total_funcionarios: 0, funcionarios_ativos: 0, funcionarios_inativos: 0, taxa_cobertura: 0 },
          evolucao_temporal: [],
          distribuicao_status: [],
          funcionarios_por_cnpj: [],
          tabela_detalhada: [],
          periodo: { inicio: format(startDate, 'yyyy-MM-dd'), fim: format(endDate, 'yyyy-MM-dd') }
        };
      }

      const cnpjIds = cnpjsData.map(c => c.id);

      // 2. Base da query: buscar funcionários da empresa com dados dos planos
      let query = supabase
        .from('funcionarios')
        .select(`
          *,
          cnpjs ( razao_social, cnpj, dados_planos ( seguradora, valor_mensal ) )
        `)
        .in('cnpj_id', cnpjIds);

      // 3. Aplicar filtros dinamicamente
      if (params.statusFilter && params.statusFilter !== 'all') {
        // Definir os valores válidos do enum de status
        const validStatuses: Database['public']['Enums']['funcionario_status'][] = [
          'ativo', 'pendente', 'desativado', 'exclusao_solicitada', 
          'pendente_exclusao', 'arquivado', 'edicao_solicitada'
        ];
        
        // Verificar se o filtro é um status válido
        if (validStatuses.includes(params.statusFilter as Database['public']['Enums']['funcionario_status'])) {
          query = query.eq('status', params.statusFilter as Database['public']['Enums']['funcionario_status']);
        }
      }
      if (params.cnpjFilter && params.cnpjFilter !== 'all') {
        query = query.eq('cnpj_id', params.cnpjFilter);
      }
      if (params.searchTerm) {
        query = query.or(`nome.ilike.%${params.searchTerm}%,cpf.ilike.%${params.searchTerm}%`);
      }

      // 4. Executar a query
      const { data, error } = await query;

      if (error) {
        console.error('❌ [useFuncionariosReport] Erro ao buscar relatório:', error);
        throw error;
      }

      console.log('✅ [useFuncionariosReport] Dados brutos carregados:', data);

      // 5. Calcular KPIs
      const kpis: FuncionariosReportKPIs = {
        total_funcionarios: data.length,
        funcionarios_ativos: data.filter(f => f.status === 'ativo').length,
        funcionarios_inativos: data.filter(f => f.status !== 'ativo').length,
        taxa_cobertura: data.length > 0 ? (data.filter(f => f.status === 'ativo').length / data.length) * 100 : 0
      };

      // 6. Calcular distribuição por status
      const statusCounts = data.reduce((acc, f) => {
        acc[f.status] = (acc[f.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const distribuicao_status: DistribuicaoStatus[] = Object.entries(statusCounts).map(([status, quantidade]) => ({
        status,
        quantidade,
        percentual: data.length > 0 ? (quantidade / data.length) * 100 : 0
      }));

      // 7. Agrupar por CNPJ
      const cnpjGroups = data.reduce((acc, f) => {
        const cnpj = f.cnpjs?.cnpj || '';
        const razao_social = f.cnpjs?.razao_social || '';
        
        if (!acc[cnpj]) {
          acc[cnpj] = {
            cnpj,
            razao_social,
            funcionarios_ativos: 0,
            funcionarios_inativos: 0,
            total: 0
          };
        }
        
        acc[cnpj].total += 1;
        if (f.status === 'ativo') {
          acc[cnpj].funcionarios_ativos += 1;
        } else {
          acc[cnpj].funcionarios_inativos += 1;
        }
        
        return acc;
      }, {} as Record<string, FuncionariosPorCNPJ>);

      const funcionarios_por_cnpj: FuncionariosPorCNPJ[] = Object.values(cnpjGroups);

      // 8. Preparar tabela detalhada
      const tabela_detalhada: TabelaDetalhada[] = data.map(f => {
        // Corrigir o acesso ao valor_mensal - verificar se cnpj_id não é null
        let valorMensal = 0;
        if (f.cnpjs && Array.isArray(f.cnpjs.dados_planos) && f.cnpjs.dados_planos.length > 0) {
          valorMensal = f.cnpjs.dados_planos[0]?.valor_mensal || 0;
        }

        return {
          id: f.id,
          nome_completo: f.nome,
          cpf: f.cpf,
          cnpj: f.cnpjs?.cnpj || '',
          razao_social: f.cnpjs?.razao_social || '',
          status: f.status,
          data_admissao: format(new Date(f.created_at), 'yyyy-MM-dd'),
          data_ativacao_seguro: format(new Date(f.created_at), 'yyyy-MM-dd'),
          valor_individual: valorMensal,
          total_dependentes: 0
        };
      });

      // 9. Calcular evolução temporal (simplificada por enquanto)
      const evolucao_temporal: EvolucaoTemporal[] = [];

      const result: FuncionariosReportData = {
        kpis,
        evolucao_temporal,
        distribuicao_status,
        funcionarios_por_cnpj,
        tabela_detalhada,
        periodo: {
          inicio: format(startDate, 'yyyy-MM-dd'),
          fim: format(endDate, 'yyyy-MM-dd')
        }
      };

      console.log('✅ [useFuncionariosReport] Relatório processado:', result);
      return result;
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5, // 5 minutos
  });
};
