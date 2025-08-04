import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função de validação de CPF com dígitos verificadores
const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;
  
  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;
  
  return parseInt(cleanCPF.charAt(10)) === secondDigit;
};

// Função para converter salário brasileiro para número
const convertBrazilianSalary = (salarioStr: string): number => {
  console.log(`🔄 Convertendo salário: "${salarioStr}"`);
  
  // Remove espaços e símbolos de moeda
  let cleaned = salarioStr.replace(/[R$\s]/g, '').trim();
  console.log(`📝 Após limpeza inicial: "${cleaned}"`);
  
  // Se não tem vírgula nem ponto, é um número simples
  if (!cleaned.includes(',') && !cleaned.includes('.')) {
    const result = parseFloat(cleaned);
    console.log(`✅ Número simples: ${cleaned} → ${result}`);
    return result;
  }
  
  // Se tem vírgula como último separador (formato brasileiro: 1.234,56)
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  
  if (lastComma > lastDot) {
    // Formato brasileiro: vírgula é decimal, ponto é milhares
    // Ex: 2.242,62 ou 1.000,00
    const integerPart = cleaned.substring(0, lastComma).replace(/\./g, '');
    const decimalPart = cleaned.substring(lastComma + 1);
    const result = parseFloat(`${integerPart}.${decimalPart}`);
    console.log(`✅ Formato brasileiro: "${salarioStr}" → partes: "${integerPart}" + "${decimalPart}" = ${result}`);
    return result;
  } else if (lastDot > lastComma) {
    // Formato americano: ponto é decimal, vírgula é milhares
    // Ex: 1,234.56
    const integerPart = cleaned.substring(0, lastDot).replace(/,/g, '');
    const decimalPart = cleaned.substring(lastDot + 1);
    const result = parseFloat(`${integerPart}.${decimalPart}`);
    console.log(`✅ Formato americano: "${salarioStr}" → partes: "${integerPart}" + "${decimalPart}" = ${result}`);
    return result;
  } else {
    // Só tem ponto ou só tem vírgula
    if (cleaned.includes('.')) {
      // Se tem ponto, assumir formato americano se não houver vírgula
      const result = parseFloat(cleaned);
      console.log(`✅ Só ponto (americano): "${salarioStr}" → ${result}`);
      return result;
    } else {
      // Se tem vírgula, assumir formato brasileiro
      const result = parseFloat(cleaned.replace(',', '.'));
      console.log(`✅ Só vírgula (brasileiro): "${salarioStr}" → ${result}`);
      return result;
    }
  }
};

interface FuncionarioData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  cargo: string;
  salario: string;
  estado_civil?: string;
  email?: string;
  telefone?: string;
  _originalRow?: number;
}

interface ImportOptions {
  skip_duplicates: boolean;
  update_existing: boolean;
  strict_validation: boolean;
  ignore_errors: boolean;
  duplicate_handling: 'ignore' | 'update' | 'create_anyway';
}

interface ImportPayload {
  cnpj_id: string;
  csv_data: FuncionarioData[];
  options: ImportOptions;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const payload: ImportPayload = await req.json();
    console.log('🚀 Iniciando importação em massa com opções avançadas:', {
      cnpj_id: payload.cnpj_id,
      total_rows: payload.csv_data.length,
      options: payload.options
    });

    const startTime = Date.now();
    const results = {
      total_rows: payload.csv_data.length,
      successful_imports: 0,
      updated_records: 0,
      failed_imports: 0,
      warnings: 0,
      ignored_errors: 0,
      duplicates_handled: 0,
      processing_time: 0,
      detailed_results: {
        success: [] as any[],
        errors: [] as any[],
        warnings: [] as any[],
        ignored: [] as any[],
        duplicates: [] as any[]
      }
    };

    // Validação do CNPJ
    const { data: cnpjData, error: cnpjError } = await supabaseClient
      .from('cnpjs')
      .select('id, razao_social')
      .eq('id', payload.cnpj_id)
      .single();

    if (cnpjError || !cnpjData) {
      console.error('❌ CNPJ não encontrado:', payload.cnpj_id);
      throw new Error('CNPJ não encontrado');
    }

    console.log('✅ CNPJ validado:', cnpjData.razao_social);

    // Buscar funcionários existentes para detectar duplicatas
    const { data: existingFuncionarios } = await supabaseClient
      .from('funcionarios')
      .select('id, nome, cpf, email, cargo, salario')
      .eq('cnpj_id', payload.cnpj_id);

    const existingCpfs = new Map(existingFuncionarios?.map(f => [f.cpf.replace(/\D/g, ''), f]) || []);
    console.log(`📊 Encontrados ${existingCpfs.size} funcionários existentes no CNPJ`);

    // Processar funcionários em batches de 10 para evitar timeout
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < payload.csv_data.length; i += batchSize) {
      batches.push(payload.csv_data.slice(i, i + batchSize));
    }

    console.log(`📦 Processando ${batches.length} batches de até ${batchSize} funcionários`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`🔄 Processando batch ${batchIndex + 1}/${batches.length}`);

      for (let itemIndex = 0; itemIndex < batch.length; itemIndex++) {
        const funcionarioData = batch[itemIndex];
        const rowNumber = funcionarioData._originalRow || ((batchIndex * batchSize) + itemIndex + 1);

        try {
          console.log(`📋 Processando linha ${rowNumber}:`, {
            nome: funcionarioData.nome,
            cpf: funcionarioData.cpf,
            cargo: funcionarioData.cargo,
            salario_original: funcionarioData.salario
          });

          // Validação e limpeza do CPF
          const cpfLimpo = funcionarioData.cpf.replace(/\D/g, '');
          
          console.log(`🔍 Validando CPF linha ${rowNumber}: "${funcionarioData.cpf}" → "${cpfLimpo}"`);
          
          if (!isValidCPF(funcionarioData.cpf)) {
            const errorMsg = `CPF inválido: ${funcionarioData.cpf}`;
            console.log(`❌ ${errorMsg} (linha ${rowNumber})`);
            
            if (payload.options.ignore_errors) {
              console.log(`⚠️ Linha ${rowNumber}: CPF inválido - ignorando devido à configuração`);
              results.ignored_errors++;
              results.detailed_results.ignored.push({
                row: rowNumber,
                data: funcionarioData,
                reason: 'CPF inválido'
              });
              continue;
            } else {
              results.failed_imports++;
              results.detailed_results.errors.push({
                row: rowNumber,
                data: funcionarioData,
                errors: [{ field: 'cpf', severity: 'error', message: errorMsg }]
              });
              continue;
            }
          }

          console.log(`✅ CPF válido linha ${rowNumber}: ${cpfLimpo}`);

          // Converter data de nascimento
          let dataNascimento: string;
          try {
            const [dia, mes, ano] = funcionarioData.data_nascimento.split('/');
            dataNascimento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            console.log(`📅 Data convertida linha ${rowNumber}: ${funcionarioData.data_nascimento} → ${dataNascimento}`);
          } catch {
            const errorMsg = `Data de nascimento inválida: ${funcionarioData.data_nascimento}`;
            console.log(`❌ ${errorMsg} (linha ${rowNumber})`);
            
            if (payload.options.ignore_errors) {
              console.log(`⚠️ Linha ${rowNumber}: Data inválida - ignorando devido à configuração`);
              results.ignored_errors++;
              results.detailed_results.ignored.push({
                row: rowNumber,
                data: funcionarioData,
                reason: 'Data de nascimento inválida'
              });
              continue;
            } else {
              results.failed_imports++;
              results.detailed_results.errors.push({
                row: rowNumber,
                data: funcionarioData,
                errors: [{ field: 'data_nascimento', severity: 'error', message: errorMsg }]
              });
              continue;
            }
          }

          // Calcular idade
          const hoje = new Date();
          const nascimento = new Date(dataNascimento);
          const idade = hoje.getFullYear() - nascimento.getFullYear() - 
                       (hoje < new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate()) ? 1 : 0);

          // Converter salário usando a nova função
          console.log(`💰 Processando salário linha ${rowNumber}: "${funcionarioData.salario}"`);
          const salario = convertBrazilianSalary(funcionarioData.salario);
          
          if (isNaN(salario) || salario <= 0) {
            const errorMsg = `Salário inválido após conversão: "${funcionarioData.salario}" → ${salario}`;
            console.log(`❌ ${errorMsg} (linha ${rowNumber})`);
            
            if (payload.options.ignore_errors) {
              console.log(`⚠️ Linha ${rowNumber}: Salário inválido - ignorando devido à configuração`);
              results.ignored_errors++;
              results.detailed_results.ignored.push({
                row: rowNumber,
                data: funcionarioData,
                reason: 'Salário inválido'
              });
              continue;
            } else {
              results.failed_imports++;
              results.detailed_results.errors.push({
                row: rowNumber,
                data: funcionarioData,
                errors: [{ field: 'salario', severity: 'error', message: errorMsg }]
              });
              continue;
            }
          }
          
          console.log(`✅ Salário convertido linha ${rowNumber}: "${funcionarioData.salario}" → ${salario}`);

          // Validar estado civil (opcional)
          let estadoCivil = null;
          if (funcionarioData.estado_civil && funcionarioData.estado_civil.trim()) {
            const estadoCivilValidos = ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel'];
            const estadoCivilLower = funcionarioData.estado_civil.toLowerCase().trim();
            if (estadoCivilValidos.includes(estadoCivilLower)) {
              estadoCivil = estadoCivilLower;
            } else {
              // Estado civil inválido gera warning
              results.warnings++;
              results.detailed_results.warnings.push({
                row: rowNumber,
                funcionario_id: '',
                warnings: [{ field: 'estado_civil', severity: 'warning', message: 'Estado civil inválido - será ignorado' }]
              });
            }
          }

          // Verificar se funcionário já existe (duplicata)
          const existingFuncionario = existingCpfs.get(cpfLimpo);

          const funcionarioPayload = {
            nome: funcionarioData.nome.trim(),
            cpf: cpfLimpo,
            data_nascimento: dataNascimento,
            idade: idade,
            cargo: funcionarioData.cargo.trim(),
            salario: salario,
            estado_civil: estadoCivil,
            email: funcionarioData.email?.trim() || null,
            cnpj_id: payload.cnpj_id,
            status: 'ativo'
          };

          let funcionarioResult;
          let action: 'created' | 'updated' | 'ignored' = 'created';

          if (existingFuncionario) {
            console.log(`🔄 Funcionário duplicado encontrado: ${funcionarioData.nome} (${cpfLimpo})`);
            console.log(`📊 Dados existentes:`, existingFuncionario);
            console.log(`📊 Opção de duplicata:`, payload.options.duplicate_handling);
            
            results.duplicates_handled++;

            // Tratar duplicata conforme configuração
            switch (payload.options.duplicate_handling) {
              case 'ignore':
                console.log(`⏭️ Duplicata ignorada: ${funcionarioData.nome} (${cpfLimpo})`);
                results.detailed_results.duplicates.push({
                  row: rowNumber,
                  data: funcionarioData,
                  action: 'ignored',
                  existing_funcionario_id: existingFuncionario.id
                });
                action = 'ignored';
                // Não incrementar successful_imports quando ignoramos
                break;

              case 'update':
                console.log(`🔄 Tentando atualizar funcionário existente: ${existingFuncionario.id}`);
                
                try {
                  const { data: updatedData, error: updateError } = await supabaseClient
                    .from('funcionarios')
                    .update(funcionarioPayload)
                    .eq('id', existingFuncionario.id)
                    .select()
                    .single();

                  if (updateError) {
                    console.error(`❌ Erro ao atualizar funcionário ${existingFuncionario.id}:`, updateError);
                    throw updateError;
                  }

                  funcionarioResult = updatedData;
                  action = 'updated';
                  results.updated_records++;
                  results.successful_imports++; // Contar como sucesso
                  results.detailed_results.duplicates.push({
                    row: rowNumber,
                    data: funcionarioData,
                    action: 'updated',
                    existing_funcionario_id: existingFuncionario.id
                  });
                  console.log(`✅ Funcionário duplicado atualizado: ${funcionarioData.nome} (${cpfLimpo})`);
                } catch (updateError) {
                  console.error(`❌ Falha ao atualizar funcionário duplicado linha ${rowNumber}:`, updateError);
                  throw updateError;
                }
                break;

              case 'create_anyway':
                console.log(`⚠️ Criando funcionário mesmo sendo duplicata: ${funcionarioData.nome} (${cpfLimpo})`);
                
                try {
                  const { data: newDataDup, error: insertErrorDup } = await supabaseClient
                    .from('funcionarios')
                    .insert(funcionarioPayload)
                    .select()
                    .single();

                  if (insertErrorDup) {
                    console.error(`❌ Erro ao criar funcionário duplicado linha ${rowNumber}:`, insertErrorDup);
                    throw insertErrorDup;
                  }

                  funcionarioResult = newDataDup;
                  results.successful_imports++;
                  results.detailed_results.duplicates.push({
                    row: rowNumber,
                    data: funcionarioData,
                    action: 'created_anyway',
                    existing_funcionario_id: existingFuncionario.id
                  });
                  console.log(`⚠️ Funcionário duplicado criado mesmo assim: ${funcionarioData.nome} (${cpfLimpo})`);
                } catch (insertError) {
                  console.error(`❌ Falha ao criar funcionário duplicado linha ${rowNumber}:`, insertError);
                  throw insertError;
                }
                break;
            }
          } else {
            // Criar novo funcionário
            console.log(`➕ Criando novo funcionário: ${funcionarioData.nome} (${cpfLimpo})`);
            
            try {
              const { data: newData, error: insertError } = await supabaseClient
                .from('funcionarios')
                .insert(funcionarioPayload)
                .select()
                .single();

              if (insertError) {
                console.error(`❌ Erro ao criar funcionário linha ${rowNumber}:`, insertError);
                throw insertError;
              }

              funcionarioResult = newData;
              results.successful_imports++;
              console.log(`✅ Funcionário criado: ${funcionarioData.nome} (${cpfLimpo})`);
            } catch (insertError) {
              console.error(`❌ Falha ao criar funcionário linha ${rowNumber}:`, insertError);
              throw insertError;
            }
          }

          // Adicionar aos resultados de sucesso se houve um resultado válido
          if (funcionarioResult && action !== 'ignored') {
            results.detailed_results.success.push({
              row: rowNumber,
              funcionario_id: funcionarioResult.id,
              nome: funcionarioResult.nome,
              cpf: funcionarioResult.cpf,
              action: action
            });
          }

        } catch (error) {
          console.error(`❌ Erro ao processar linha ${rowNumber}:`, error);
          
          if (payload.options.ignore_errors) {
            console.log(`⚠️ Linha ${rowNumber}: Erro ignorado devido à configuração`);
            results.ignored_errors++;
            results.detailed_results.ignored.push({
              row: rowNumber,
              data: funcionarioData,
              reason: error.message || 'Erro desconhecido'
            });
          } else {
            results.failed_imports++;
            results.detailed_results.errors.push({
              row: rowNumber,
              data: funcionarioData,
              errors: [{ 
                field: 'general', 
                severity: 'error', 
                message: error.message || 'Erro desconhecido' 
              }]
            });
          }
        }
      }

      // Pequena pausa entre batches para não sobrecarregar
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    results.processing_time = Math.round((Date.now() - startTime) / 1000);

    console.log('🎉 Importação concluída com opções avançadas:', {
      total: results.total_rows,
      sucesso: results.successful_imports,
      erros: results.failed_imports,
      ignorados: results.ignored_errors,
      duplicatas: results.duplicates_handled,
      atualizados: results.updated_records,
      tempo: results.processing_time + 's'
    });

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro geral na importação:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor',
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
