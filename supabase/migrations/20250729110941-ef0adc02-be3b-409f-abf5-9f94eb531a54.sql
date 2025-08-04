
-- Criar VIEW para métricas unificadas e corretas dos planos
CREATE OR REPLACE VIEW public.planos_com_metricas_reais AS
SELECT
  dp.id as plano_id,
  dp.cnpj_id,
  dp.seguradora,
  dp.valor_mensal as valor_unitario,
  dp.cobertura_morte,
  dp.cobertura_morte_acidental,
  dp.cobertura_invalidez_acidente,
  dp.cobertura_auxilio_funeral,
  dp.created_at,
  dp.updated_at,
  c.cnpj as cnpj_numero,
  c.razao_social as cnpj_razao_social,
  c.empresa_id,
  -- Contagens corretas de funcionários
  COUNT(f.id) FILTER (WHERE f.status = 'ativo') as funcionarios_ativos,
  COUNT(f.id) FILTER (WHERE f.status = 'pendente') as funcionarios_pendentes,
  COUNT(f.id) FILTER (WHERE f.status IN ('ativo', 'pendente')) as total_funcionarios,
  -- Cálculo correto do custo mensal real (valor do plano por CNPJ, não por funcionário)
  dp.valor_mensal as custo_mensal_real
FROM dados_planos dp
JOIN cnpjs c ON dp.cnpj_id = c.id
LEFT JOIN funcionarios f ON f.cnpj_id = c.id
GROUP BY dp.id, dp.cnpj_id, dp.seguradora, dp.valor_mensal, dp.cobertura_morte, 
         dp.cobertura_morte_acidental, dp.cobertura_invalidez_acidente, 
         dp.cobertura_auxilio_funeral, dp.created_at, dp.updated_at,
         c.cnpj, c.razao_social, c.empresa_id;

-- Habilitar RLS na VIEW
ALTER VIEW public.planos_com_metricas_reais SET (security_barrier = true);

-- Criar política RLS para empresas verem seus próprios planos
CREATE POLICY "Empresas podem ver métricas de seus planos" 
ON public.planos_com_metricas_reais
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
      AND p.role = 'empresa'
      AND p.empresa_id = planos_com_metricas_reais.empresa_id
  )
);

-- Criar política RLS para corretoras verem planos de suas empresas
CREATE POLICY "Corretoras podem ver métricas de planos de suas empresas" 
ON public.planos_com_metricas_reais
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM empresas e
    JOIN profiles p ON p.id = auth.uid()
    WHERE e.id = planos_com_metricas_reais.empresa_id
      AND e.corretora_id = p.id
      AND p.role = 'corretora'
  )
);
