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

// Interface base unificada para funcionários
export interface FuncionarioBase {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  data_nascimento: string | Date;
  status: string;
  cnpj_id: string;
  created_at: string;
  updated_at?: string;
  data_admissao: string;
}

// Tipos específicos baseados na interface base
export interface FuncionarioData extends FuncionarioBase {}
export interface PlanoFuncionario extends FuncionarioBase {}
export interface FuncionarioPlano extends FuncionarioBase {}

// Interface para dados de dashboard de corretora
export interface CorretoraDashboardData {
  total_empresas: number;
  total_funcionarios: number;
  receita_mensal: number;
  total_pendencias: number;
  produtividade_carteira: number;
  taxa_eficiencia: number;
  qualidade_dados: number;
  funcionarios_travados: number;
  cnpjs_sem_plano: number;
  empresas_inativas: number;
  acoes_inteligentes: Array<any>;
}

// Interface para dados de dashboard de empresa
export interface EmpresaDashboardData {
  total_cnpjs: number;
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
  custo_mensal_total: number;
  funcionariosPendentes: number;
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