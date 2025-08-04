
-- Permitir valores NULL na coluna estado_civil da tabela funcionarios
-- Isso resolve o erro "null value in column 'estado_civil' violates not-null constraint"
ALTER TABLE funcionarios ALTER COLUMN estado_civil DROP NOT NULL;
