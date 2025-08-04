
// Tipos para o sistema de importação
export interface ParsedCsvData {
  headers: string[];
  data: any[][];
  preview: any[][];
}

export interface ColumnMapping {
  [csvColumn: string]: string; // csvColumn -> systemField or 'ignore'
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  row: number;
  status: 'valid' | 'warning' | 'error';
  issues: ValidationIssue[];
  data: any;
  isDuplicate?: boolean;
  duplicateInfo?: {
    existingFuncionarioId?: string;
    duplicateType: 'csv_internal' | 'database_existing';
    existingData?: any;
  };
}

export interface ImportResults {
  total_rows: number;
  successful_imports: number;
  updated_records: number;
  failed_imports: number;
  warnings: number;
  ignored_errors: number;
  duplicates_handled: number;
  processing_time: number;
  detailed_results: {
    success: ImportedRecord[];
    errors: ErrorRecord[];
    warnings: WarningRecord[];
    ignored: IgnoredRecord[];
    duplicates: DuplicateRecord[];
  };
}

export interface ImportedRecord {
  row: number;
  funcionario_id: string;
  nome: string;
  cpf: string;
  action: 'created' | 'updated';
}

export interface ErrorRecord {
  row: number;
  data: any;
  errors: ValidationIssue[];
}

export interface WarningRecord {
  row: number;
  funcionario_id: string;
  warnings: ValidationIssue[];
}

export interface IgnoredRecord {
  row: number;
  data: any;
  reason: string;
}

export interface DuplicateRecord {
  row: number;
  data: any;
  action: 'ignored' | 'updated' | 'created_anyway';
  existing_funcionario_id?: string;
}

export interface ImportOptions {
  skip_duplicates: boolean;
  update_existing: boolean;
  strict_validation: boolean;
  ignore_errors: boolean;
  duplicate_handling: 'ignore' | 'update' | 'create_anyway';
}

export const SYSTEM_FIELDS = {
  required: {
    nome: 'Nome Completo',
    cpf: 'CPF',
    data_nascimento: 'Data de Nascimento (DD/MM/AAAA)',
    cargo: 'Cargo',
    salario: 'Salário'
  },
  optional: {
    estado_civil: 'Estado Civil',
    email: 'E-mail',
    telefone: 'Telefone'
  },
  ignore: 'Ignorar esta coluna'
} as const;

export const ESTADO_CIVIL_OPTIONS = [
  'solteiro',
  'casado', 
  'divorciado',
  'viuvo',
  'uniao_estavel'
] as const;
