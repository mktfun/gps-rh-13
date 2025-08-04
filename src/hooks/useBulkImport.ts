
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ColumnMapping, 
  ValidationResult, 
  ImportResults, 
  ImportOptions,
  SYSTEM_FIELDS,
  ESTADO_CIVIL_OPTIONS 
} from '@/types/import';
import { isValidCPF, formatCPF, getCPFValidationMessage } from '@/utils/cpfValidator';

interface UseBulkImportReturn {
  validateData: (
    cnpjId: string,
    data: any[][], 
    mapping: ColumnMapping
  ) => Promise<ValidationResult[]>;
  importData: (
    cnpjId: string,
    data: any[][],
    mapping: ColumnMapping,
    options: ImportOptions
  ) => Promise<ImportResults>;
  isImporting: boolean;
  isValidating: boolean;
  progress: number;
}

// Função para validar e converter salário brasileiro
const validateBrazilianSalary = (salarioStr: string): { isValid: boolean; value?: number; message?: string } => {
  if (!salarioStr || salarioStr.trim() === '') {
    return { isValid: false, message: 'Salário não informado' };
  }

  try {
    // Remove espaços e símbolos de moeda
    let cleaned = salarioStr.replace(/[R$\s]/g, '').trim();
    
    // Se não tem vírgula nem ponto, é um número simples
    if (!cleaned.includes(',') && !cleaned.includes('.')) {
      const value = parseFloat(cleaned);
      if (isNaN(value) || value <= 0) {
        return { isValid: false, message: 'Valor de salário inválido' };
      }
      return { isValid: true, value };
    }
    
    // Se tem vírgula como último separador (formato brasileiro: 1.234,56)
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    let value: number;
    
    if (lastComma > lastDot) {
      // Formato brasileiro: vírgula é decimal, ponto é milhares
      const integerPart = cleaned.substring(0, lastComma).replace(/\./g, '');
      const decimalPart = cleaned.substring(lastComma + 1);
      
      // Validar se a parte decimal tem no máximo 2 dígitos
      if (decimalPart.length > 2) {
        return { isValid: false, message: 'Formato de salário inválido - muitos dígitos decimais' };
      }
      
      value = parseFloat(`${integerPart}.${decimalPart}`);
    } else if (lastDot > lastComma) {
      // Formato americano: ponto é decimal, vírgula é milhares
      const integerPart = cleaned.substring(0, lastDot).replace(/,/g, '');
      const decimalPart = cleaned.substring(lastDot + 1);
      
      if (decimalPart.length > 2) {
        return { isValid: false, message: 'Formato de salário inválido - muitos dígitos decimais' };
      }
      
      value = parseFloat(`${integerPart}.${decimalPart}`);
    } else {
      // Só tem ponto ou só tem vírgula
      if (cleaned.includes('.')) {
        value = parseFloat(cleaned);
      } else {
        value = parseFloat(cleaned.replace(',', '.'));
      }
    }
    
    if (isNaN(value) || value <= 0) {
      return { isValid: false, message: 'Valor de salário deve ser positivo' };
    }
    
    // Verificar se o valor parece razoável (entre R$ 10 e R$ 1.000.000)
    if (value < 10) {
      return { 
        isValid: false, 
        message: `Valor muito baixo: R$ ${value.toFixed(2)} - verifique o formato (use vírgula como decimal)` 
      };
    }
    
    if (value > 1000000) {
      return { 
        isValid: false, 
        message: `Valor muito alto: R$ ${value.toFixed(2)} - verifique o formato` 
      };
    }
    
    return { isValid: true, value };
    
  } catch (error) {
    return { isValid: false, message: 'Erro ao processar valor do salário' };
  }
};

export const useBulkImport = (): UseBulkImportReturn => {
  const [isImporting, setIsImporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Validação client-side com detecção de duplicatas e validação robusta de CPF e salário
  const validateData = useCallback(async (
    cnpjId: string,
    data: any[][], 
    mapping: ColumnMapping
  ): Promise<ValidationResult[]> => {
    setIsValidating(true);
    console.log('🔍 Iniciando validação com detecção de duplicatas e validação robusta...');
    
    try {
      const results: ValidationResult[] = [];
      const cpfsInternos = new Set<string>();
      
      // Buscar CPFs existentes no banco para este CNPJ
      const existingFuncionarios = new Map<string, any>();
      try {
        const { data: funcionariosExistentes } = await supabase
          .from('funcionarios')
          .select('id, nome, cpf, email, cargo')
          .eq('cnpj_id', cnpjId);
        
        funcionariosExistentes?.forEach(func => {
          const cleanCPF = formatCPF(func.cpf);
          existingFuncionarios.set(cleanCPF, func);
        });
        
        console.log(`📊 Encontrados ${existingFuncionarios.size} funcionários existentes no CNPJ`);
      } catch (error) {
        console.error('❌ Erro ao buscar funcionários existentes:', error);
      }

      data.forEach((row, index) => {
        const validation: ValidationResult = {
          row: index + 1,
          status: 'valid',
          issues: [],
          data: {},
          isDuplicate: false
        };

        // Mapear dados da linha
        Object.entries(mapping).forEach(([csvColumn, systemField]) => {
          if (systemField === 'ignore') return;
          
          const columnIndex = Object.keys(mapping).indexOf(csvColumn);
          const value = row[columnIndex]?.toString().trim() || '';
          validation.data[systemField] = value;
        });

        // Validar campos obrigatórios
        Object.keys(SYSTEM_FIELDS.required).forEach(field => {
          if (!validation.data[field] || validation.data[field].trim() === '') {
            validation.issues.push({
              field,
              severity: 'error',
              message: `Campo obrigatório não preenchido`,
              suggestion: `Preencha o campo ${SYSTEM_FIELDS.required[field as keyof typeof SYSTEM_FIELDS.required]}`
            });
          }
        });

        // Validações específicas dos campos - CPF com validação robusta
        if (validation.data.cpf) {
          const cpfOriginal = validation.data.cpf;
          const cpfLimpo = formatCPF(cpfOriginal);
          validation.data.cpf = cpfLimpo; // Normalizar CPF
          
          console.log(`🔍 Validando CPF linha ${index + 1}: "${cpfOriginal}" → "${cpfLimpo}"`);
          
          const cpfValidationMessage = getCPFValidationMessage(cpfOriginal);
          if (cpfValidationMessage) {
            validation.issues.push({
              field: 'cpf',
              severity: 'error',
              message: cpfValidationMessage,
              suggestion: 'Verifique se o CPF está correto'
            });
            console.log(`❌ CPF inválido linha ${index + 1}: ${cpfValidationMessage}`);
          } else {
            console.log(`✅ CPF válido linha ${index + 1}: ${cpfLimpo}`);
            
            // Verificar duplicata interna no CSV
            if (cpfsInternos.has(cpfLimpo)) {
              validation.isDuplicate = true;
              validation.duplicateInfo = {
                duplicateType: 'csv_internal'
              };
              validation.issues.push({
                field: 'cpf',
                severity: 'warning',
                message: 'CPF duplicado no arquivo CSV',
                suggestion: 'Verifique se este CPF não se repete no arquivo'
              });
              console.log(`⚠️ CPF duplicado no CSV linha ${index + 1}: ${cpfLimpo}`);
            } else {
              cpfsInternos.add(cpfLimpo);
            }

            // Verificar duplicata no banco de dados
            const existingFunc = existingFuncionarios.get(cpfLimpo);
            if (existingFunc) {
              validation.isDuplicate = true;
              validation.duplicateInfo = {
                duplicateType: 'database_existing',
                existingFuncionarioId: existingFunc.id,
                existingData: existingFunc
              };
              validation.issues.push({
                field: 'cpf',
                severity: 'warning',
                message: `CPF já existe: ${existingFunc.nome}`,
                suggestion: 'Funcionário já cadastrado no sistema'
              });
              console.log(`⚠️ CPF duplicado no banco linha ${index + 1}: ${cpfLimpo} (${existingFunc.nome})`);
            }
          }
        }

        if (validation.data.email && validation.data.email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(validation.data.email)) {
            validation.issues.push({
              field: 'email',
              severity: 'error',
              message: 'E-mail inválido',
              suggestion: 'Verifique o formato do e-mail'
            });
          }
        }

        if (validation.data.data_nascimento) {
          const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
          if (!dateRegex.test(validation.data.data_nascimento)) {
            validation.issues.push({
              field: 'data_nascimento',
              severity: 'error',
              message: 'Data deve estar no formato DD/MM/AAAA',
              suggestion: 'Use o formato DD/MM/AAAA'
            });
          }
        }

        // Validação aprimorada de salário
        if (validation.data.salario) {
          console.log(`💰 Validando salário linha ${index + 1}: "${validation.data.salario}"`);
          const salaryValidation = validateBrazilianSalary(validation.data.salario);
          
          if (!salaryValidation.isValid) {
            validation.issues.push({
              field: 'salario',
              severity: 'error',
              message: salaryValidation.message || 'Salário inválido',
              suggestion: 'Use formato brasileiro (ex: 2.500,50) ou apenas números'
            });
            console.log(`❌ Salário inválido linha ${index + 1}: ${salaryValidation.message}`);
          } else {
            console.log(`✅ Salário válido linha ${index + 1}: "${validation.data.salario}" → R$ ${salaryValidation.value?.toFixed(2)}`);
          }
        }

        if (validation.data.estado_civil) {
          const estadoCivil = validation.data.estado_civil.toLowerCase();
          if (!ESTADO_CIVIL_OPTIONS.includes(estadoCivil as any)) {
            validation.issues.push({
              field: 'estado_civil',
              severity: 'error',
              message: 'Estado civil inválido',
              suggestion: `Valores aceitos: ${ESTADO_CIVIL_OPTIONS.join(', ')}`
            });
          }
        }

        // Definir status final
        const hasErrors = validation.issues.some(issue => issue.severity === 'error');
        const hasWarnings = validation.issues.some(issue => issue.severity === 'warning');
        
        if (hasErrors) {
          validation.status = 'error';
        } else if (hasWarnings) {
          validation.status = 'warning';
        }

        results.push(validation);
      });

      console.log(`✅ Validação concluída: ${results.length} linhas processadas`);
      console.log(`📊 Estatísticas: ${results.filter(r => r.status === 'valid').length} válidas, ${results.filter(r => r.status === 'warning').length} com avisos, ${results.filter(r => r.status === 'error').length} com erro`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Erro na validação:', error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Importação via Edge Function
  const importData = useCallback(async (
    cnpjId: string,
    data: any[][],
    mapping: ColumnMapping,
    options: ImportOptions
  ): Promise<ImportResults> => {
    setIsImporting(true);
    setProgress(0);

    try {
      // Preparar dados para envio com normalização de CPF
      const mappedData = data.map((row, index) => {
        const mapped: any = {};
        Object.entries(mapping).forEach(([csvColumn, systemField]) => {
          if (systemField === 'ignore') return;
          const columnIndex = Object.keys(mapping).indexOf(csvColumn);
          let value = row[columnIndex]?.toString().trim() || '';
          
          // Normalizar CPF
          if (systemField === 'cpf') {
            value = formatCPF(value);
          }
          
          mapped[systemField] = value;
        });
        mapped._originalRow = index + 1; // Adicionar número da linha original para debug
        return mapped;
      });

      console.log('🚀 Iniciando importação com dados normalizados:', {
        cnpjId,
        totalRows: mappedData.length,
        options,
        sampleData: mappedData.slice(0, 2) // Log dos primeiros 2 registros para debug
      });

      // Chamar Edge Function
      const { data: result, error } = await supabase.functions.invoke('bulk-import-funcionarios-v2', {
        body: {
          cnpj_id: cnpjId,
          csv_data: mappedData,
          options
        }
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw error;
      }

      setProgress(100);
      
      // Toast com informações detalhadas
      if (result.ignored_errors > 0) {
        toast.success(
          `Importação concluída: ${result.successful_imports} funcionários processados (${result.ignored_errors} erros ignorados)`
        );
      } else {
        toast.success(`Importação concluída: ${result.successful_imports} funcionários processados`);
      }
      
      console.log('✅ Resultado da importação:', result);
      
      return result as ImportResults;

    } catch (error) {
      console.error('❌ Erro na importação:', error);
      toast.error('Erro ao importar funcionários');
      throw error;
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  }, []);

  return {
    validateData,
    importData,
    isImporting,
    isValidating,
    progress
  };
};
