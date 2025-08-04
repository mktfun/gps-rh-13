
-- 1. TABELAS (O ALICERCE)
CREATE TABLE public.conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(corretora_id, empresa_id)
);

CREATE TABLE public.mensagens (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversa_id UUID REFERENCES public.conversas(id) ON DELETE CASCADE NOT NULL,
  remetente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conteudo TEXT NOT NULL CHECK (char_length(conteudo) > 0 AND char_length(conteudo) < 500),
  lida BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. HABILITAR RLS (OS MUROS)
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- 3. HABILITAR REALTIME (A ELETRICIDADE)
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas, public.mensagens;

-- 4. POLÍTICAS DE SEGURANÇA (OS SEGURANÇAS)
CREATE POLICY "Participantes podem ver suas conversas" ON public.conversas FOR SELECT
USING ((SELECT auth.uid()) = corretora_id OR (SELECT profiles.empresa_id FROM public.profiles WHERE profiles.id = auth.uid()) = conversas.empresa_id);

CREATE POLICY "Participantes podem ver TODAS as mensagens de suas conversas" ON public.mensagens FOR SELECT
USING (mensagens.conversa_id IN (
  SELECT c.id FROM public.conversas c 
  WHERE c.corretora_id = auth.uid() 
  OR (SELECT profiles.empresa_id FROM public.profiles WHERE profiles.id = auth.uid()) = c.empresa_id
));

CREATE POLICY "Participantes podem inserir mensagens em suas conversas" ON public.mensagens FOR INSERT
WITH CHECK (
  remetente_id = auth.uid() 
  AND conversa_id IN (
    SELECT c.id FROM public.conversas c 
    WHERE c.corretora_id = auth.uid() 
    OR (SELECT profiles.empresa_id FROM public.profiles WHERE profiles.id = auth.uid()) = c.empresa_id
  )
);

-- 5. POLÍTICA PARA CRIAÇÃO DE CONVERSAS
CREATE POLICY "Corretoras podem criar conversas" ON public.conversas FOR INSERT
WITH CHECK (corretora_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'corretora'
));

-- 6. HABILITAR REPLICA IDENTITY FULL PARA REALTIME
ALTER TABLE public.conversas REPLICA IDENTITY FULL;
ALTER TABLE public.mensagens REPLICA IDENTITY FULL;
