
-- PASSO 1: Destruir a política de SELECT antiga e burra, se ela existir.
DROP POLICY IF EXISTS "Permitir leitura para participantes" ON public.empresas;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.empresas; -- Nome comum de política padrão
DROP POLICY IF EXISTS "Empresas podem ver sua própria empresa" ON public.empresas; -- Possível nome existente
DROP POLICY IF EXISTS "Corretoras podem gerenciar suas empresas" ON public.empresas; -- Limpar duplicatas se existirem

-- PASSO 2: Criar a política de SELECT inteligente e definitiva.
CREATE POLICY "Corretoras podem ver suas empresas e usuários da empresa a própria empresa"
ON public.empresas FOR SELECT
TO authenticated
USING (
  -- Regra 1: A corretora pode ver a empresa se o ID dela estiver na coluna 'corretora_id'.
  (corretora_id = auth.uid())
  OR
  -- Regra 2: O usuário da empresa pode ver a própria empresa.
  -- (Isto assume que a sua tabela 'profiles' tem uma coluna 'empresa_id')
  (id = (SELECT p.empresa_id FROM public.profiles p WHERE p.id = auth.uid()))
);
