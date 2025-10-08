-- Adicionar coluna data_admissao à tabela funcionarios
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS data_admissao DATE;

-- Comentário explicativo
COMMENT ON COLUMN funcionarios.data_admissao IS 'Data de admissão do funcionário na empresa';