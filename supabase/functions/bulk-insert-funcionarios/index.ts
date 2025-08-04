
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FuncionarioInput {
  nome: string
  cpf: string
  data_nascimento: string // YYYY-MM-DD
  cargo: string
  salario: number
  idade: number
  estado_civil: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel'
  email?: string
}

interface BulkInsertRequest {
  cnpj_id: string
  funcionarios: FuncionarioInput[]
}

interface BulkInsertResponse {
  success: boolean
  inserted: number
  updated: number
  errors: Array<{
    funcionario: FuncionarioInput
    error: string
  }>
}

interface ProcessingError {
  funcionario: FuncionarioInput
  error: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const body: BulkInsertRequest = await req.json()
    
    console.log(`Iniciando bulk insert para CNPJ: ${body.cnpj_id} com ${body.funcionarios?.length || 0} funcionários`)

    // Validate request structure
    if (!body.cnpj_id || !body.funcionarios || !Array.isArray(body.funcionarios)) {
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos. Esperado: { cnpj_id: string, funcionarios: Array }' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (body.funcionarios.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Lista de funcionários não pode estar vazia' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate CNPJ exists
    const { data: cnpjData, error: cnpjError } = await supabase
      .from('cnpjs')
      .select('id, razao_social')
      .eq('id', body.cnpj_id)
      .single()

    if (cnpjError || !cnpjData) {
      console.error('CNPJ não encontrado:', cnpjError)
      return new Response(
        JSON.stringify({ 
          error: `CNPJ com ID ${body.cnpj_id} não encontrado` 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`CNPJ validado: ${cnpjData.razao_social}`)

    // Valid estado_civil values
    const validEstadosCivis = ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel']
    
    // Process each funcionario with manual upsert logic
    let insertedCount = 0
    let updatedCount = 0
    const errors: ProcessingError[] = []

    for (const funcionario of body.funcionarios) {
      try {
        // Validate funcionario data structure
        if (!funcionario.nome || !funcionario.cpf || !funcionario.data_nascimento || 
            !funcionario.cargo || typeof funcionario.salario !== 'number' || 
            typeof funcionario.idade !== 'number' || !funcionario.estado_civil) {
          errors.push({
            funcionario,
            error: 'Dados obrigatórios faltando: nome, cpf, data_nascimento, cargo, salario, idade, estado_civil'
          })
          continue
        }

        // Validate estado_civil enum
        if (!validEstadosCivis.includes(funcionario.estado_civil)) {
          errors.push({
            funcionario,
            error: `Estado civil inválido: ${funcionario.estado_civil}. Valores aceitos: ${validEstadosCivis.join(', ')}`
          })
          continue
        }

        // Validate CPF format (basic check)
        const cpfClean = funcionario.cpf.replace(/\D/g, '')
        if (cpfClean.length !== 11) {
          errors.push({
            funcionario,
            error: 'CPF deve conter 11 dígitos'
          })
          continue
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(funcionario.data_nascimento)) {
          errors.push({
            funcionario,
            error: 'Data de nascimento deve estar no formato YYYY-MM-DD'
          })
          continue
        }

        // Check if funcionario already exists (manual upsert logic)
        const { data: existingFuncionario, error: checkError } = await supabase
          .from('funcionarios')
          .select('id')
          .eq('cpf', cpfClean)
          .eq('cnpj_id', body.cnpj_id)
          .maybeSingle()

        if (checkError) {
          console.error('Erro ao verificar funcionário existente:', checkError)
          errors.push({
            funcionario,
            error: `Erro interno ao verificar funcionário: ${checkError.message}`
          })
          continue
        }

        const funcionarioData = {
          nome: funcionario.nome.trim(),
          cpf: cpfClean,
          data_nascimento: funcionario.data_nascimento,
          cargo: funcionario.cargo.trim(),
          salario: funcionario.salario,
          idade: funcionario.idade,
          estado_civil: funcionario.estado_civil,
          email: funcionario.email?.trim() || null,
          cnpj_id: body.cnpj_id,
          status: 'ativo' as const,
          updated_at: new Date().toISOString()
        }

        if (existingFuncionario) {
          // UPDATE existing funcionario
          const { error: updateError } = await supabase
            .from('funcionarios')
            .update(funcionarioData)
            .eq('id', existingFuncionario.id)

          if (updateError) {
            console.error('Erro ao atualizar funcionário:', updateError)
            errors.push({
              funcionario,
              error: `Erro ao atualizar funcionário: ${updateError.message}`
            })
          } else {
            updatedCount++
            console.log(`Funcionário atualizado: ${funcionario.nome} (CPF: ${cpfClean})`)
          }
        } else {
          // INSERT new funcionario
          const { error: insertError } = await supabase
            .from('funcionarios')
            .insert({
              ...funcionarioData,
              created_at: new Date().toISOString()
            })

          if (insertError) {
            console.error('Erro ao inserir funcionário:', insertError)
            errors.push({
              funcionario,
              error: `Erro ao inserir funcionário: ${insertError.message}`
            })
          } else {
            insertedCount++
            console.log(`Funcionário inserido: ${funcionario.nome} (CPF: ${cpfClean})`)
          }
        }

      } catch (error) {
        console.error('Erro inesperado ao processar funcionário:', error)
        errors.push({
          funcionario,
          error: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        })
      }
    }

    // Prepare response
    const response: BulkInsertResponse = {
      success: errors.length === 0,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errors
    }

    const statusCode = errors.length === 0 ? 200 : (insertedCount + updatedCount > 0 ? 207 : 400)

    console.log(`Bulk insert concluído: ${insertedCount} inseridos, ${updatedCount} atualizados, ${errors.length} erros`)

    return new Response(
      JSON.stringify(response),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro crítico na Edge Function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
