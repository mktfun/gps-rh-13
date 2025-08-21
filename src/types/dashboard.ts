export interface DashboardMetrics {
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
  total_planos: number;
  custo_mensal_total: number;
}

export interface EvolutionData {
  mes: string;
  funcionarios: number;
  custo: number;
}

export interface CargoDistribution {
  cargo: string;
  count: number;
}

export interface CnpjCost {
  cnpj: string;
  razao_social: string;
  valor_mensal: number;
  funcionarios_count: number;
}

export interface MainPlan {
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  razao_social: string;
  tipo_seguro: string;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface ChartProps {
  data?: any[];
  loading?: boolean;
  height?: number;
}

export interface TableSectionProps {
  data: DashboardMetrics;
  loading: boolean;
}

export interface DashboardError extends Error {
  code?: string;
  details?: string;
}
