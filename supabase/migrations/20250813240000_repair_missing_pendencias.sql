-- Function to repair missing pendencias for funcionarios with status 'pendente'
-- This will create pendencias for employees that should have them but don't

CREATE OR REPLACE FUNCTION public.repair_missing_pendencias_for_empresa(p_empresa_id UUID DEFAULT NULL)
RETURNS TABLE (
  funcionario_id UUID,
  funcionario_nome TEXT,
  pendencia_criada BOOLEAN,
  erro TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  v_corretora_id UUID;
  v_protocolo TEXT;
  v_data_vencimento DATE;
  v_pendencia_existe BOOLEAN;
BEGIN
  -- Loop through funcionarios with status 'pendente' that don't have pendencias
  FOR rec IN 
    SELECT 
      f.id as funcionario_id,
      f.nome as funcionario_nome,
      f.cnpj_id,
      c.empresa_id
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    LEFT JOIN pendencias p ON f.id = p.funcionario_id AND p.tipo = 'ativacao' AND p.status = 'pendente'
    WHERE f.status = 'pendente'
      AND p.id IS NULL  -- No existing pendencia
      AND (p_empresa_id IS NULL OR c.empresa_id = p_empresa_id)
  LOOP
    BEGIN
      -- Get corretora for this funcionario
      SELECT e.corretora_id INTO v_corretora_id
      FROM cnpjs c
      INNER JOIN empresas e ON c.empresa_id = e.id
      WHERE c.id = rec.cnpj_id;

      IF v_corretora_id IS NULL THEN
        funcionario_id := rec.funcionario_id;
        funcionario_nome := rec.funcionario_nome;
        pendencia_criada := FALSE;
        erro := 'Corretora não encontrada';
        RETURN NEXT;
        CONTINUE;
      END IF;

      -- Generate protocol and due date
      v_protocolo := 'REPAIR-ACT-' || EXTRACT(EPOCH FROM now())::bigint || '-' || substr(md5(random()::text), 1, 6);
      v_data_vencimento := (now() + interval '7 days')::date;

      -- Create the missing pendencia
      INSERT INTO pendencias (
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
        'Pendência de ativação criada automaticamente para ' || rec.funcionario_nome,
        rec.funcionario_id,
        rec.cnpj_id,
        v_corretora_id,
        'pendente',
        v_data_vencimento
      );

      funcionario_id := rec.funcionario_id;
      funcionario_nome := rec.funcionario_nome;
      pendencia_criada := TRUE;
      erro := NULL;
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      funcionario_id := rec.funcionario_id;
      funcionario_nome := rec.funcionario_nome;
      pendencia_criada := FALSE;
      erro := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.repair_missing_pendencias_for_empresa(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.repair_missing_pendencias_for_empresa(UUID) IS 
'Repairs missing pendencias for funcionarios with status pendente. If empresa_id is provided, only repairs for that empresa.';
