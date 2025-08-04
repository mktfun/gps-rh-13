
-- Criar políticas para o bucket 'branding' no Supabase Storage
-- Permitir que usuários autenticados façam upload de logos

-- Política para INSERT (upload de arquivos)
CREATE POLICY "Authenticated users can upload branding files"
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'branding');

-- Política para SELECT (visualizar arquivos)
CREATE POLICY "Anyone can view branding files"
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'branding');

-- Política para UPDATE (atualizar arquivos)
CREATE POLICY "Authenticated users can update their branding files"
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'branding');

-- Política para DELETE (deletar arquivos)
CREATE POLICY "Authenticated users can delete their branding files"
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'branding');
