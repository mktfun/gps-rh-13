-- Criar pendência de ativação automaticamente após adicionar funcionário a plano
-- Idempotente: só cria se não existir uma pendência 'ativacao' pendente para o funcionário no plano

CREATE OR REPLACE FUNCTION public.criar_pendencia_ativacao_apos_adicionar_ao_plano()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_corretora_id uuid;
  v_ja_existe boolean;
  v_protocolo text;
  v_data_vencimento date;
  v_funcionario_nome text;
  v_plano_seguradora text;
BEGIN
  -- Consideramos apenas funcionários adicionados ao plano com status 'pendente'
  IF NEW.status IS NULL OR NEW.status::text NOT IN ('pendente') THEN
    RETURN NEW;
  END IF;

  -- Evitar duplicidade: já existe pendência de ativação pendente para este funcionário?
  SELECT EXISTS (
    SELECT 1
    FROM public.pendencias p
    WHERE p.funcionario_id = NEW.funcionario_id
      AND p.tipo = 'ativacao'
      AND p.status = 'pendente'
  ) INTO v_ja_existe;

  IF v_ja_existe THEN
    RETURN NEW;
  END IF;

  -- Obter nome do funcionário para a descrição
  SELECT f.nome
    INTO v_funcionario_nome
  FROM public.funcionarios f
  WHERE f.id = NEW.funcionario_id;

  -- Obter nome da seguradora do plano para a descrição
  SELECT p.seguradora
    INTO v_plano_seguradora
  FROM public.planos p
  WHERE p.id = NEW.plano_id;

  -- Obter corretora dona do CNPJ do funcionário
  SELECT e.corretora_id
    INTO v_corretora_id
  FROM public.funcionarios f
  JOIN public.cnpjs c ON c.id = f.cnpj_id
  JOIN public.empresas e ON e.id = c.empresa_id
  WHERE f.id = NEW.funcionario_id;

  -- Se não conseguirmos resolver a corretora, não criamos pendência
  IF v_corretora_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Gerar protocolo e data de vencimento (+7 dias)
  v_protocolo := 'PLN-' || EXTRACT(EPOCH FROM now())::bigint || '-' || substr(md5(random()::text), 1, 6);
  v_data_vencimento := (now() + interval '7 days')::date;

  -- Inserir pendência (rodará com privilégios do dono da função, contornando RLS)
  INSERT INTO public.pendencias (
    protocolo,
    tipo,
    descricao,
    funcionario_id,
    cnpj_id,
    corretora_id,
    status,
    data_vencimento
  ) VALUES (
    v_protocolo,
    'ativacao',
    'Ativação pendente para ' || COALESCE(v_funcionario_nome, 'funcionário') || 
    ' no plano ' || COALESCE(v_plano_seguradora, 'de seguro') || '.',
    NEW.funcionario_id,
    (SELECT cnpj_id FROM public.funcionarios WHERE id = NEW.funcionario_id),
    v_corretora_id,
    'pendente',
    v_data_vencimento
  );

  RETURN NEW;
END;
$$;

-- Criar trigger para INSERT na tabela planos_funcionarios
DROP TRIGGER IF EXISTS trg_criar_pendencia_ativacao_plano ON public.planos_funcionarios;

CREATE TRIGGER trg_criar_pendencia_ativacao_plano
AFTER INSERT ON public.planos_funcionarios
FOR EACH ROW
EXECUTE FUNCTION public.criar_pendencia_ativacao_apos_adicionar_ao_plano();

-- Criar trigger para UPDATE na tabela planos_funcionarios (caso status mude para pendente)
DROP TRIGGER IF EXISTS trg_criar_pendencia_ativacao_plano_update ON public.planos_funcionarios;

CREATE TRIGGER trg_criar_pendencia_ativacao_plano_update
AFTER UPDATE OF status ON public.planos_funcionarios
FOR EACH ROW
WHEN (NEW.status = 'pendente' AND OLD.status != 'pendente')
EXECUTE FUNCTION public.criar_pendencia_ativacao_apos_adicionar_ao_plano();

-- Comentário explicativo
COMMENT ON FUNCTION public.criar_pendencia_ativacao_apos_adicionar_ao_plano() IS 
'Cria pendência de ativação automaticamente quando funcionário é adicionado a plano com status pendente';
