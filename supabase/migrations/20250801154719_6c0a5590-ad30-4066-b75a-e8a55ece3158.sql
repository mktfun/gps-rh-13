
-- Apaga a função antiga para garantir uma instalação limpa
DROP FUNCTION IF EXISTS public.get_empresas_com_metricas();

-- Cria a nova função, agora à prova de balas
CREATE OR REPLACE FUNCTION public.get_empresas_com_metricas()
RETURNS TABLE(
  id UUID,
  nome TEXT,
  responsavel TEXT,
  email TEXT,
  telefone TEXT,
  corretora_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  primeiro_acesso BOOLEAN,
  total_funcionarios BIGINT,
  total_pendencias BIGINT,
  status_geral TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é uma corretora ou admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() -- SEMPRE use o alias da tabela
    AND public.profiles.role IN ('corretora', 'admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas corretoras e administradores podem acessar esta função';
  END IF;

  RETURN QUERY
  SELECT 
    e.id,
    e.nome,
    e.responsavel,
    e.email,
    e.telefone,
    e.corretora_id,
    e.created_at,
    e.updated_at,
    e.primeiro_acesso,
    COALESCE(funcionarios_count.total_funcionarios, 0) as total_funcionarios,
    COALESCE(pendencias_count.total_pendencias, 0) as total_pendencias,
    CASE 
        WHEN cnpj_status.tem_configuracao_pendente > 0 THEN 'Configuração Pendente'
        ELSE 'Ativo'
    END as status_geral
  FROM public.empresas e
  LEFT JOIN (
    SELECT 
        c.empresa_id,
        COUNT(f.id) as total_funcionarios
    FROM public.cnpjs c
    LEFT JOIN public.funcionarios f ON f.cnpj_id = c.id AND f.status = 'ativo'
    GROUP BY c.empresa_id
  ) funcionarios_count ON funcionarios_count.empresa_id = e.id
  LEFT JOIN (
    SELECT 
        c.empresa_id,
        COUNT(f.id) as total_pendencias
    FROM public.cnpjs c
    LEFT JOIN public.funcionarios f ON f.cnpj_id = c.id AND f.status IN ('pendente', 'exclusao_solicitada')
    GROUP BY c.empresa_id
  ) pendencias_count ON pendencias_count.empresa_id = e.id
  LEFT JOIN (
    SELECT 
        c.empresa_id,
        COUNT(CASE WHEN c.status = 'configuracao' THEN 1 END) as tem_configuracao_pendente
    FROM public.cnpjs c
    GROUP BY c.empresa_id
  ) cnpj_status ON cnpj_status.empresa_id = e.id
  -- FILTRO DE SEGURANÇA SEM AMBIGUIDADE
  WHERE e.corretora_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin' -- SEMPRE use o alias da tabela
  );
END;
$$;
