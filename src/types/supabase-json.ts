// Interfaces específicas para dados JSON retornados do Supabase

export interface DashboardMetricsData {
  totalFuncionarios: number;
  funcionariosAtivos: number;
  funcionariosPendentes: number;
  custoMensalTotal: number;
  custosPorCnpj: Array<{
    cnpj: string;
    razao_social: string;
    valor_mensal: number;
    funcionarios_count: number;
  }>;
  evolucaoMensal: Array<{
    mes: string;
    funcionarios: number;
    custo: number;
  }>;
  distribuicaoCargos: Array<{
    cargo: string;
    count: number;
  }>;
}

export interface FinancialDataDebugResult {
  pulseFinanceiro: {
    receita_mes: number;
    crescimento_percentual: number;
    comissao_estimada: number;
    margem_risco: number;
    oportunidades: number;
  };
  cnpjsData: Array<{
    id: string;
    cnpj: string;
    razao_social: string;
    status: string;
    empresa_id: string;
  }>;
  planosData: Array<{
    id: string;
    cnpj_id: string;
    seguradora: string;
    valor_mensal: number;
    tipo_seguro: string;
  }>;
  funcionariosData: Array<{
    id: string;
    nome: string;
    cnpj_id: string;
    status: string;
  }>;
}

export interface PendencyDebugResult {
  pendencias: Array<{
    id: string;
    tipo: string;
    status: string;
    cnpj_id: string;
    funcionario_id?: string;
  }>;
  permissions: {
    canSeeAsCorretora: boolean;
    canSeeAsEmpresa: boolean;
    userRole: string;
    userId: string;
  };
}