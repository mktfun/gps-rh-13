
-- Criar política RLS para permitir INSERT na tabela notifications
CREATE POLICY "Sistema pode criar notificações" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (true);
