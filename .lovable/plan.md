

# Fix: Garantir 1 plano por tipo por funcionário + mostrar planos na tabela

## Situação Atual

### Problema 1: Sem constraint de unicidade
A tabela `planos_funcionarios` **não tem constraint** que impeça um funcionário de ser vinculado a 2 planos de saúde ou 2 planos de vida. Qualquer inserção duplicada passa.

### Problema 2: Dados de plano incorretos na tabela
A RPC `get_funcionarios_empresa_completo` faz `LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id` -- ou seja, pega **qualquer plano do CNPJ**, não o plano real em que o funcionário está matriculado. Além disso, mostra apenas 1 plano (o primeiro que aparece via `DISTINCT ON`).

### Problema 3: Coluna "Plano" genérica
A tabela de funcionários tem apenas 1 coluna "Plano" que mostra seguradora + valor. Deveria mostrar separadamente: Plano Saúde e Seguro Vida, cada um com seguradora e valor.

---

## Plano de Correção

### Etapa 1: Migration SQL

1. **Adicionar UNIQUE constraint** para impedir duplicatas por tipo de seguro:
```sql
-- Constraint: 1 funcionário por plano
ALTER TABLE planos_funcionarios 
  ADD CONSTRAINT uq_funcionario_plano UNIQUE (funcionario_id, plano_id);

-- Função + trigger para impedir 2 planos do mesmo tipo_seguro
CREATE FUNCTION check_unique_tipo_seguro() ...
  -- Antes de INSERT, verificar se já existe vínculo ativo 
  -- para o mesmo funcionário + mesmo tipo_seguro
```

2. **Atualizar RPC `get_funcionarios_empresa_completo`** para retornar colunas separadas:
   - `plano_saude_seguradora`, `plano_saude_valor`
   - `plano_vida_seguradora`, `plano_vida_valor`
   - Fazer JOIN via `planos_funcionarios` (não direto no CNPJ)

### Etapa 2: Atualizar tipo e hook `useFuncionariosEmpresa.ts`
- Adicionar os novos campos ao tipo `FuncionarioEmpresaCompleto`
- Mapear no transform de `useFuncionarios.ts`

### Etapa 3: Atualizar interface e colunas `funcionariosEmpresaTableColumns.tsx`
- Substituir a coluna genérica "Plano" por 2 colunas:
  - **Saúde**: seguradora + valor (ou badge "Sem plano")
  - **Vida**: seguradora + valor (ou badge "Sem plano")

### Etapa 4: Query de CNPJ específico em `useFuncionarios.ts`
- Quando `cnpj_id` é fornecido, a query atual faz `LEFT JOIN dados_planos` no CNPJ inteiro. Corrigir para buscar via `planos_funcionarios` também.

---

## Resumo de Arquivos

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| Nova migration SQL | Criação | UNIQUE constraint + trigger tipo_seguro + atualizar RPC |
| `src/hooks/useFuncionariosEmpresa.ts` | Edição | Novos campos saude/vida no tipo |
| `src/hooks/useFuncionarios.ts` | Edição | Mapear novos campos + corrigir query cnpj_id |
| `src/components/empresa/funcionariosEmpresaTableColumns.tsx` | Edição | 2 colunas separadas (Saúde + Vida) com valores |

