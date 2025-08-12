
export interface PlanoDetalhes {
  id: string;
  cnpj_id: string;
  tipo_seguro: 'vida' | 'saude' | 'outros';
  seguradora: string;
  valor_mensal: number;
  valor_mensal_calculado?: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  created_at: string;
  updated_at: string;
  cnpj: {
    id: string;
    cnpj: string;
    razao_social: string;
    empresa_id: string;
    empresas?: {
      nome: string;
    };
  };
  // Estatísticas dos funcionários DO PLANO (não do CNPJ)
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
  // Campos derivados para compatibilidade
  empresa_nome?: string;
  cnpj_numero?: string;
  cnpj_razao_social?: string;
}
