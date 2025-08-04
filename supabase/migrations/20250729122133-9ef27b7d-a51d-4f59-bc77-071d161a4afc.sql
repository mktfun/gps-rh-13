
-- Criar tabela para branding das empresas
CREATE TABLE public.empresa_branding (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

-- Habilitar RLS
ALTER TABLE public.empresa_branding ENABLE ROW LEVEL SECURITY;

-- Política para empresas verem seu próprio branding
CREATE POLICY "Empresas podem ver seu próprio branding" 
  ON public.empresa_branding 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role = 'empresa' 
        AND empresa_id = empresa_branding.empresa_id
    )
  );

-- Política para empresas criarem seu próprio branding
CREATE POLICY "Empresas podem criar seu próprio branding" 
  ON public.empresa_branding 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role = 'empresa' 
        AND empresa_id = empresa_branding.empresa_id
    )
  );

-- Política para empresas atualizarem seu próprio branding
CREATE POLICY "Empresas podem atualizar seu próprio branding" 
  ON public.empresa_branding 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role = 'empresa' 
        AND empresa_id = empresa_branding.empresa_id
    )
  );

-- Criar bucket para logos de empresas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('empresa-branding', 'empresa-branding', true);

-- Política de storage para permitir upload de logos
CREATE POLICY "Empresas podem fazer upload de logos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'empresa-branding' 
    AND auth.uid() IS NOT NULL
  );

-- Política de storage para permitir visualização de logos
CREATE POLICY "Logos de empresas são públicas" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'empresa-branding');

-- Política de storage para permitir atualização de logos
CREATE POLICY "Empresas podem atualizar suas logos" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'empresa-branding' 
    AND auth.uid() IS NOT NULL
  );

-- Política de storage para permitir exclusão de logos
CREATE POLICY "Empresas podem excluir suas logos" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'empresa-branding' 
    AND auth.uid() IS NOT NULL
  );
