-- Criar bucket de storage para documentos de funcionários
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos_funcionarios', 'documentos_funcionarios', false)
ON CONFLICT (id) DO NOTHING;

-- Tabela de dependentes
CREATE TABLE IF NOT EXISTS public.dependentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  parentesco TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de documentos de funcionários
CREATE TABLE IF NOT EXISTS public.documentos_funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  dependente_id UUID REFERENCES public.dependentes(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  path_storage TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_dependentes_funcionario_id ON public.dependentes(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_documentos_funcionario_id ON public.documentos_funcionarios(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_documentos_dependente_id ON public.documentos_funcionarios(dependente_id);

-- Habilitar RLS
ALTER TABLE public.dependentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_funcionarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies para dependentes
-- Corretoras podem gerenciar dependentes de suas empresas
CREATE POLICY "Corretoras podem gerenciar dependentes"
ON public.dependentes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE f.id = dependentes.funcionario_id
    AND e.corretora_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE f.id = dependentes.funcionario_id
    AND e.corretora_id = auth.uid()
  )
);

-- Empresas podem ver dependentes de seus funcionários
CREATE POLICY "Empresas podem gerenciar dependentes"
ON public.dependentes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE f.id = dependentes.funcionario_id
    AND c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE f.id = dependentes.funcionario_id
    AND c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- RLS Policies para documentos_funcionarios
-- Corretoras podem gerenciar documentos
CREATE POLICY "Corretoras podem gerenciar documentos"
ON public.documentos_funcionarios
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE f.id = documentos_funcionarios.funcionario_id
    AND e.corretora_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE f.id = documentos_funcionarios.funcionario_id
    AND e.corretora_id = auth.uid()
  )
);

-- Empresas podem gerenciar documentos de seus funcionários
CREATE POLICY "Empresas podem gerenciar documentos"
ON public.documentos_funcionarios
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE f.id = documentos_funcionarios.funcionario_id
    AND c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE f.id = documentos_funcionarios.funcionario_id
    AND c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Storage Policies para o bucket documentos_funcionarios
-- Corretoras podem fazer upload
CREATE POLICY "Corretoras podem fazer upload de documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos_funcionarios'
  AND (storage.foldername(name))[1] IN (
    SELECT f.id::text
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = auth.uid()
  )
);

-- Corretoras podem visualizar documentos
CREATE POLICY "Corretoras podem visualizar documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos_funcionarios'
  AND (storage.foldername(name))[1] IN (
    SELECT f.id::text
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = auth.uid()
  )
);

-- Corretoras podem deletar documentos
CREATE POLICY "Corretoras podem deletar documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos_funcionarios'
  AND (storage.foldername(name))[1] IN (
    SELECT f.id::text
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = auth.uid()
  )
);

-- Empresas podem fazer upload
CREATE POLICY "Empresas podem fazer upload de documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos_funcionarios'
  AND (storage.foldername(name))[1] IN (
    SELECT f.id::text
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Empresas podem visualizar documentos
CREATE POLICY "Empresas podem visualizar documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos_funcionarios'
  AND (storage.foldername(name))[1] IN (
    SELECT f.id::text
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Empresas podem deletar documentos
CREATE POLICY "Empresas podem deletar documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos_funcionarios'
  AND (storage.foldername(name))[1] IN (
    SELECT f.id::text
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  )
);