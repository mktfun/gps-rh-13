
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FuncionariosReportParams {
  p_empresa_id: string;
  p_start_date?: string;
  p_end_date?: string;
  p_status_filter?: string;
  p_cnpj_filter?: string;
  p_search_term?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { p_empresa_id, p_start_date, p_end_date, p_status_filter, p_cnpj_filter, p_search_term }: FuncionariosReportParams = await req.json()

    // Validate required parameters
    if (!p_empresa_id) {
      return new Response(
        JSON.stringify({ error: 'p_empresa_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 [get_funcionarios_report_fixed] Chamando função com parâmetros:', {
      p_empresa_id,
      p_start_date,
      p_end_date,
      p_status_filter,
      p_cnpj_filter,
      p_search_term
    });

    // Call the database function
    const { data, error } = await supabaseClient.rpc('get_funcionarios_report', {
      p_empresa_id,
      p_start_date: p_start_date || null,
      p_end_date: p_end_date || null,
      p_status_filter: p_status_filter || null,
      p_cnpj_filter: p_cnpj_filter || null,
      p_search_term: p_search_term || null
    });

    if (error) {
      console.error('❌ [get_funcionarios_report_fixed] Erro na função SQL:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [get_funcionarios_report_fixed] Dados retornados com sucesso');
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [get_funcionarios_report_fixed] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
