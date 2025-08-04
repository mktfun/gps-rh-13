
-- Criar tabela para configurações de branding da corretora
CREATE TABLE public.corretora_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corretora_id UUID REFERENCES public.profiles(id) NOT NULL,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#3b82f6', -- azul padrão
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(corretora_id)
);

-- Adicionar colunas para preferências de notificação na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notificacoes_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notificacoes_sistema BOOLEAN DEFAULT true;

-- Habilitar RLS na tabela de branding
ALTER TABLE public.corretora_branding ENABLE ROW LEVEL SECURITY;

-- Política para que corretoras vejam apenas seu próprio branding
CREATE POLICY "Corretoras podem ver seu próprio branding" 
  ON public.corretora_branding 
  FOR SELECT 
  USING (corretora_id = auth.uid());

-- Política para que corretoras criem seu próprio branding
CREATE POLICY "Corretoras podem criar seu próprio branding" 
  ON public.corretora_branding 
  FOR INSERT 
  WITH CHECK (corretora_id = auth.uid());

-- Política para que corretoras atualizem seu próprio branding
CREATE POLICY "Corretoras podem atualizar seu próprio branding" 
  ON public.corretora_branding 
  FOR UPDATE 
  USING (corretora_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_corretora_branding_updated_at
  BEFORE UPDATE ON public.corretora_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
