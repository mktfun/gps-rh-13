
-- Criar tabela de conversas
CREATE TABLE IF NOT EXISTS public.conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(corretora_id, empresa_id)
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  remetente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS nas tabelas
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conversas - usuários só veem conversas das quais fazem parte
CREATE POLICY "Corretoras podem ver conversas de suas empresas" 
  ON public.conversas 
  FOR SELECT 
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corretora' 
    AND corretora_id = auth.uid()
  );

CREATE POLICY "Empresas podem ver suas próprias conversas" 
  ON public.conversas 
  FOR SELECT 
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'empresa' 
    AND empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Corretoras podem criar conversas com suas empresas" 
  ON public.conversas 
  FOR INSERT 
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corretora' 
    AND corretora_id = auth.uid()
    AND empresa_id IN (
      SELECT id FROM public.empresas WHERE corretora_id = auth.uid()
    )
  );

-- Políticas RLS para mensagens - usuários só veem mensagens de conversas das quais fazem parte
CREATE POLICY "Usuários podem ver mensagens de suas conversas" 
  ON public.mensagens 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversas c 
      WHERE c.id = conversa_id 
      AND (
        c.corretora_id = auth.uid() 
        OR c.empresa_id IN (
          SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Usuários podem enviar mensagens em suas conversas" 
  ON public.mensagens 
  FOR INSERT 
  WITH CHECK (
    remetente_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.conversas c 
      WHERE c.id = conversa_id 
      AND (
        c.corretora_id = auth.uid() 
        OR c.empresa_id IN (
          SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Ativar realtime para as tabelas
ALTER TABLE public.conversas REPLICA IDENTITY FULL;
ALTER TABLE public.mensagens REPLICA IDENTITY FULL;

-- Adicionar as tabelas à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;

-- Trigger para atualizar updated_at na tabela conversas
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversas_updated_at 
  BEFORE UPDATE ON public.conversas 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
