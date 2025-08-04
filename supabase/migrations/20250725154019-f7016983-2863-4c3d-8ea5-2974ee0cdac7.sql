
CREATE OR REPLACE FUNCTION public.delete_plano(p_plano_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_plano_info RECORD;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;

  -- Buscar informações do plano e verificar se o usuário tem permissão
  SELECT 
    dp.id,
    dp.seguradora,
    c.razao_social,
    e.nome as empresa_nome
  INTO v_plano_info
  FROM dados_planos dp
  JOIN cnpjs c ON dp.cnpj_id = c.id
  JOIN empresas e ON c.empresa_id = e.id
  JOIN profiles p ON p.id = v_user_id
  WHERE dp.id = p_plano_id 
    AND e.corretora_id = v_user_id
    AND p.role = 'corretora';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Plano não encontrado ou acesso negado'
    );
  END IF;

  -- Excluir o plano
  DELETE FROM dados_planos WHERE id = p_plano_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Plano excluído com sucesso',
    'plano', json_build_object(
      'id', v_plano_info.id,
      'seguradora', v_plano_info.seguradora,
      'empresa_nome', v_plano_info.empresa_nome,
      'cnpj_razao_social', v_plano_info.razao_social
    )
  );
END;
$function$
