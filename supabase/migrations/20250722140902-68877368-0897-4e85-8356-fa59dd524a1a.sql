
-- 1. Adicionar coluna status na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN status TEXT NOT NULL DEFAULT 'ativo';

-- Adicionar constraint para validar valores permitidos
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('ativo', 'inativo'));

-- 2. Criar políticas RLS para admin na tabela profiles
CREATE POLICY "Admins podem ver todos os perfis" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins podem atualizar todos os perfis" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Criar função RPC toggle_corretora_status
CREATE OR REPLACE FUNCTION public.toggle_corretora_status(target_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
  target_user_info RECORD;
  new_status TEXT;
BEGIN
  -- Verificar se o usuário atual é admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Acesso negado: apenas administradores podem executar esta ação'
    );
  END IF;

  -- Buscar informações do usuário alvo
  SELECT * INTO target_user_info
  FROM public.profiles
  WHERE id = target_user_id AND role = 'corretora';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Corretora não encontrada'
    );
  END IF;

  -- Determinar novo status
  IF target_user_info.status = 'ativo' THEN
    new_status := 'inativo';
  ELSE
    new_status := 'ativo';
  END IF;

  -- Atualizar status
  UPDATE public.profiles 
  SET status = new_status, updated_at = NOW()
  WHERE id = target_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Status atualizado com sucesso',
    'corretora', json_build_object(
      'id', target_user_info.id,
      'nome', target_user_info.nome,
      'email', target_user_info.email,
      'status_anterior', target_user_info.status,
      'status_atual', new_status
    )
  );
END;
$$;
