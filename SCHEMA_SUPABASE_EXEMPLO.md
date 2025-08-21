# Schema Supabase - Dashboard da Empresa

## Tabelas Necessárias

### 1. Tabela `empresas`
```sql
CREATE TABLE empresas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    telefone varchar(20),
    responsavel varchar(255),
    corretora_id uuid REFERENCES profiles(id),
    primeiro_acesso boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
```

### 2. Tabela `cnpjs`
```sql
CREATE TYPE cnpj_status AS ENUM ('ativo', 'suspenso', 'configuracao');

CREATE TABLE cnpjs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj varchar(18) NOT NULL UNIQUE,
    razao_social varchar(255) NOT NULL,
    empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
    status cnpj_status DEFAULT 'configuracao',
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
```

### 3. Tabela `funcionarios`
```sql
CREATE TYPE funcionario_status AS ENUM ('ativo', 'pendente', 'desativado', 'exclusao_solicitada', 'arquivado');
CREATE TYPE estado_civil AS ENUM ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel');

CREATE TABLE funcionarios (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome varchar(255) NOT NULL,
    cpf varchar(14) NOT NULL,
    email varchar(255),
    data_nascimento date NOT NULL,
    idade integer NOT NULL,
    cargo varchar(255) NOT NULL,
    salario decimal(10,2) NOT NULL,
    estado_civil estado_civil,
    cnpj_id uuid REFERENCES cnpjs(id) ON DELETE CASCADE,
    status funcionario_status DEFAULT 'pendente',
    dados_pendentes jsonb,
    data_solicitacao_exclusao timestamp,
    data_exclusao timestamp,
    motivo_exclusao text,
    usuario_solicitante varchar(255),
    usuario_executor varchar(255),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
```

### 4. Tabela `dados_planos`
```sql
CREATE TYPE tipo_seguro AS ENUM ('vida', 'saude', 'outros');

CREATE TABLE dados_planos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj_id uuid REFERENCES cnpjs(id) ON DELETE CASCADE,
    seguradora varchar(255) NOT NULL,
    tipo_seguro tipo_seguro DEFAULT 'vida',
    valor_mensal decimal(10,2) NOT NULL,
    cobertura_morte decimal(12,2) DEFAULT 0,
    cobertura_morte_acidental decimal(12,2) DEFAULT 0,
    cobertura_invalidez_acidente decimal(12,2) DEFAULT 0,
    cobertura_auxilio_funeral decimal(10,2) DEFAULT 0,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
```

### 5. Tabela `planos_funcionarios` (relacionamento)
```sql
CREATE TYPE status_matricula AS ENUM ('ativo', 'pendente', 'inativo', 'exclusao_solicitada');

CREATE TABLE planos_funcionarios (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id uuid REFERENCES funcionarios(id) ON DELETE CASCADE,
    plano_id uuid REFERENCES dados_planos(id) ON DELETE CASCADE,
    status status_matricula DEFAULT 'pendente',
    created_at timestamp DEFAULT now()
);
```

### 6. Tabela `profiles` (usuários)
```sql
CREATE TYPE user_role AS ENUM ('corretora', 'empresa', 'admin');

CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    role user_role DEFAULT 'empresa',
    empresa_id uuid REFERENCES empresas(id),
    status varchar(50) DEFAULT 'ativo',
    notificacoes_email boolean DEFAULT true,
    notificacoes_sistema boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
```

## Função RPC Necessária

A função `get_empresa_dashboard_metrics` já existe mas pode ter bugs. Aqui está uma versão corrigida:

```sql
CREATE OR REPLACE FUNCTION public.get_empresa_dashboard_metrics(p_empresa_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    custo_mensal_total numeric := 0;
    total_cnpjs integer := 0;
    total_funcionarios integer := 0;
    funcionarios_ativos integer := 0;
    funcionarios_pendentes integer := 0;
    custos_por_cnpj json;
    evolucao_mensal json;
    distribuicao_cargos json;
    plano_principal json;
BEGIN
    -- KPIs principais
    SELECT COUNT(*) INTO total_cnpjs
    FROM cnpjs
    WHERE empresa_id = p_empresa_id AND status = 'ativo';

    SELECT COUNT(*) INTO total_funcionarios
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND f.status IN ('ativo', 'pendente');

    SELECT COUNT(*) INTO funcionarios_ativos
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND f.status = 'ativo';

    SELECT COUNT(*) INTO funcionarios_pendentes
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND f.status = 'pendente';

    -- Custo mensal total
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO custo_mensal_total
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id AND c.status = 'ativo';

    -- Custos por CNPJ
    SELECT json_agg(
      json_build_object(
        'cnpj', cnpj_dados.cnpj,
        'razao_social', cnpj_dados.razao_social,
        'valor_mensal', cnpj_dados.valor_total,
        'funcionarios_count', cnpj_dados.funcionarios_count
      )
    )
    INTO custos_por_cnpj
    FROM (
      SELECT 
        c.cnpj,
        c.razao_social,
        COALESCE(SUM(dp.valor_mensal), 0) AS valor_total,
        COUNT(DISTINCT f.id) AS funcionarios_count
      FROM cnpjs c
      LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
      LEFT JOIN funcionarios f ON f.cnpj_id = c.id 
        AND f.status IN ('ativo', 'pendente')
      WHERE c.empresa_id = p_empresa_id AND c.status = 'ativo'
      GROUP BY c.id, c.cnpj, c.razao_social
      ORDER BY c.razao_social
    ) cnpj_dados;

    -- Distribuição por cargos
    SELECT json_agg(
      json_build_object('cargo', cargo, 'count', cnt)
    )
    INTO distribuicao_cargos
    FROM (
      SELECT f.cargo, COUNT(*) AS cnt
      FROM funcionarios f
      JOIN cnpjs c ON f.cnpj_id = c.id
      WHERE c.empresa_id = p_empresa_id
        AND f.status IN ('ativo', 'pendente')
      GROUP BY f.cargo
      ORDER BY cnt DESC
      LIMIT 5
    ) t;

    -- Plano principal
    SELECT json_build_object(
      'seguradora', dp.seguradora,
      'valor_mensal', dp.valor_mensal,
      'cobertura_morte', dp.cobertura_morte,
      'cobertura_morte_acidental', dp.cobertura_morte_acidental,
      'cobertura_invalidez_acidente', dp.cobertura_invalidez_acidente,
      'razao_social', c.razao_social,
      'tipo_seguro', dp.tipo_seguro
    )
    INTO plano_principal
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id AND c.status = 'ativo'
    ORDER BY dp.valor_mensal DESC, dp.created_at DESC
    LIMIT 1;

    -- Evolução mensal
    WITH meses AS (
      SELECT date_trunc('month', generate_series(
        current_date - interval '5 months',
        current_date,
        interval '1 month'
      ))::date AS mes_ano
    )
    SELECT json_agg(
      json_build_object(
        'mes', to_char(mes_ano, 'Mon/YY'),
        'funcionarios', 0,
        'custo', 0
      ) ORDER BY mes_ano
    )
    INTO evolucao_mensal
    FROM meses;

    -- Resultado final
    result := json_build_object(
      'totalCnpjs', total_cnpjs,
      'totalFuncionarios', total_funcionarios,
      'funcionariosAtivos', funcionarios_ativos,
      'funcionariosPendentes', funcionarios_pendentes,
      'custoMensalTotal', custo_mensal_total,
      'custosPorCnpj', COALESCE(custos_por_cnpj, '[]'::json),
      'evolucaoMensal', COALESCE(evolucao_mensal, '[]'::json),
      'distribuicaoCargos', COALESCE(distribuicao_cargos, '[]'::json),
      'planoPrincipal', plano_principal
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_empresa_dashboard_metrics(uuid) TO authenticated;
```

## Dados de Exemplo para Teste

```sql
-- Inserir empresa de exemplo
INSERT INTO empresas (id, nome, email, telefone, responsavel) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Empresa Teste LTDA', 'contato@empresa.com', '(11) 99999-9999', 'João Silva');

-- Inserir CNPJ
INSERT INTO cnpjs (id, cnpj, razao_social, empresa_id, status) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', '12.345.678/0001-90', 'Empresa Teste LTDA', '550e8400-e29b-41d4-a716-446655440000', 'ativo');

-- Inserir funcionários
INSERT INTO funcionarios (nome, cpf, data_nascimento, idade, cargo, salario, cnpj_id, status) VALUES
('Maria Santos', '123.456.789-01', '1990-01-15', 34, 'Analista', 5000.00, '550e8400-e29b-41d4-a716-446655440001', 'ativo'),
('João Oliveira', '987.654.321-09', '1985-05-20', 39, 'Gerente', 8000.00, '550e8400-e29b-41d4-a716-446655440001', 'ativo'),
('Ana Costa', '456.789.123-45', '1992-08-10', 32, 'Assistente', 3000.00, '550e8400-e29b-41d4-a716-446655440001', 'pendente');

-- Inserir plano
INSERT INTO dados_planos (cnpj_id, seguradora, valor_mensal, cobertura_morte, tipo_seguro) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Seguradora ABC', 150.00, 50000.00, 'vida');
```

Este schema fornece tudo que o dashboard precisa para funcionar corretamente.
