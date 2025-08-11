
-- Criar tabela de pendências
CREATE TABLE IF NOT EXISTS public.pendencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('documentacao', 'ativacao', 'alteracao', 'cancelamento')),
  funcionario_id UUID REFERENCES funcionarios(id),
  cnpj_id UUID REFERENCES cnpjs(id) NOT NULL,
  descricao TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'resolvida', 'cancelada')),
  comentarios_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para gerar protocolo automático
CREATE OR REPLACE FUNCTION generate_protocolo()
RETURNS TEXT AS $$
BEGIN
  RETURN 'GPS-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar protocolo automaticamente
CREATE OR REPLACE FUNCTION set_protocolo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.protocolo IS NULL OR NEW.protocolo = '' THEN
    NEW.protocolo := generate_protocolo();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_protocolo
  BEFORE INSERT ON pendencias
  FOR EACH ROW
  EXECUTE FUNCTION set_protocolo();

-- RLS para pendências
ALTER TABLE public.pendencias ENABLE ROW LEVEL SECURITY;

-- Empresas podem ver suas próprias pendências
CREATE POLICY "Empresas podem ver suas próprias pendências"
  ON public.pendencias
  FOR SELECT
  USING (
    cnpj_id IN (
      SELECT c.id
      FROM cnpjs c
      WHERE c.empresa_id = (
        SELECT p.empresa_id
        FROM profiles p
        WHERE p.id = auth.uid()
      )
    )
  );

-- Corretoras podem ver pendências de suas empresas
CREATE POLICY "Corretoras podem ver pendências de suas empresas"
  ON public.pendencias
  FOR SELECT
  USING (
    cnpj_id IN (
      SELECT c.id
      FROM cnpjs c
      JOIN empresas e ON c.empresa_id = e.id
      WHERE e.corretora_id = auth.uid()
    )
  );

-- Corretoras podem inserir/atualizar pendências
CREATE POLICY "Corretoras podem gerenciar pendências"
  ON public.pendencias
  FOR ALL
  USING (
    cnpj_id IN (
      SELECT c.id
      FROM cnpjs c
      JOIN empresas e ON c.empresa_id = e.id
      WHERE e.corretora_id = auth.uid()
    )
  )
  WITH CHECK (
    cnpj_id IN (
      SELECT c.id
      FROM cnpjs c
      JOIN empresas e ON c.empresa_id = e.id
      WHERE e.corretora_id = auth.uid()
    )
  );

-- Função para relatório de pendências da empresa
CREATE OR REPLACE FUNCTION get_relatorio_pendencias_empresa(
  p_empresa_id UUID
)
RETURNS TABLE (
  funcionario_nome TEXT,
  cpf TEXT,
  cargo TEXT,
  status TEXT,
  cnpj_razao_social TEXT,
  data_solicitacao DATE,
  motivo TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.nome as funcionario_nome,
    f.cpf,
    f.cargo,
    f.status,
    c.razao_social as cnpj_razao_social,
    f.updated_at::DATE as data_solicitacao,
    CASE 
      WHEN f.status = 'pendente' THEN 'Inclusão pendente'
      WHEN f.status = 'exclusao_solicitada' THEN 'Exclusão solicitada'
      WHEN f.status = 'inativo' THEN 'Funcionário inativo'
      ELSE 'Verificar status'
    END as motivo
  FROM funcionarios f
  INNER JOIN cnpjs c ON f.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND f.status IN ('pendente', 'exclusao_solicitada', 'inativo')
  ORDER BY f.updated_at DESC;
END;
$$;

-- Inserir alguns dados de teste para pendências
INSERT INTO public.pendencias (tipo, cnpj_id, descricao, data_vencimento, funcionario_id) 
SELECT 
  CASE 
    WHEN random() < 0.25 THEN 'documentacao'
    WHEN random() < 0.5 THEN 'ativacao'
    WHEN random() < 0.75 THEN 'alteracao'
    ELSE 'cancelamento'
  END,
  c.id,
  CASE 
    WHEN random() < 0.25 THEN 'Documentação CPF pendente de validação'
    WHEN random() < 0.5 THEN 'Ativação de funcionário aguardando aprovação'
    WHEN random() < 0.75 THEN 'Alteração salarial pendente'
    ELSE 'Cancelamento de plano em análise'
  END,
  CASE 
    WHEN random() < 0.3 THEN CURRENT_DATE - 2 -- Vencidas (críticas)
    WHEN random() < 0.6 THEN CURRENT_DATE + 5 -- Urgentes (até 7 dias)
    ELSE CURRENT_DATE + 15 -- Normais
  END,
  f.id
FROM cnpjs c
JOIN funcionarios f ON f.cnpj_id = c.id
WHERE c.status = 'ativo'
  AND f.status IN ('ativo', 'pendente')
LIMIT 15
ON CONFLICT (protocolo) DO NOTHING;
