
-- Remover versões duplicadas para evitar ambiguidade no PostgREST/Supabase RPC
DROP FUNCTION IF EXISTS public.get_empresa_dashboard_metrics(uuid, integer);
DROP FUNCTION IF EXISTS get_empresa_dashboard_metrics(uuid, integer);

-- Garantir permissão de execução na versão de 1 parâmetro (mantida)
GRANT EXECUTE ON FUNCTION public.get_empresa_dashboard_metrics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_empresa_dashboard_metrics(uuid) TO authenticated;
