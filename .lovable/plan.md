

# Fix: Pendências fantasma nos CNPJs + Exclusão na tela de Funcionários da Empresa

## Problemas Identificados

### 1. CNPJs mostrando "1 pendente" sem funcionários pendentes
A RPC `get_cnpjs_com_metricas_por_tipo` conta `pendentes_no_plano` buscando na tabela `pendencias` (registros com `status = 'pendente'` e `tipo = 'ativacao'`). Encontrei **2 registros stale** na tabela `pendencias` para "João da Silva Santos" (que já está com status `ativo`). Essas pendências nunca foram fechadas quando o funcionário foi ativado.

**Causa raiz:** O fluxo de ativação de funcionário não limpa/resolve as pendências correspondentes na tabela `pendencias`.

### 2. Empresa não consegue solicitar exclusão na tela de Funcionários
A tela `Funcionarios.tsx` **não lê o parâmetro `cnpj` da URL**. Quando o usuário navega da tela de CNPJs clicando "Gerenciar Funcionários", a URL recebe `?cnpj=...` mas a página ignora. A tabela de colunas (`funcionariosEmpresaTableColumns.tsx`) já tem o botão "Solicitar Exclusão" condicionado a `isEmpresa && status === 'ativo'` -- isso deveria funcionar. O problema pode ser que o `role` retornado pelo `useAuth()` não está sendo reconhecido como `'empresa'`.

---

## Plano de Correção

### Etapa 1: Migration SQL - Limpar pendências stale e prevenir futuras
1. **Limpar pendências existentes** onde o funcionário já está ativo
2. **Atualizar a RPC `get_cnpjs_com_metricas_por_tipo`** para cruzar com o status real do funcionário (ignorar pendências cujo funcionário já está ativo)

```sql
-- Resolver pendencias stale (funcionário já ativo mas pendência aberta)
UPDATE pendencias SET status = 'resolvida'
WHERE tipo = 'ativacao' AND status = 'pendente'
AND funcionario_id IN (
  SELECT id FROM funcionarios WHERE status = 'ativo'
);
```

E atualizar a subquery de `pendentes_no_plano` na RPC para adicionar:
```sql
AND pend.funcionario_id NOT IN (
  SELECT f2.id FROM funcionarios f2 WHERE f2.status = 'ativo'
)
```

### Etapa 2: Funcionarios.tsx - Ler cnpj da URL e garantir exclusão funcione
1. Adicionar `useSearchParams` para ler o `?cnpj=` da URL
2. Passar `cnpj_id` para o hook `useFuncionarios` quando presente
3. Adicionar log para debug do `role` para confirmar que o botão de exclusão aparece

### Etapa 3: Garantir que ativação de funcionário feche pendências
No fluxo de ativação (`ativarFuncionario` mutation em `Funcionarios.tsx`), após atualizar o status para `'ativo'`, resolver pendências correspondentes:
```js
// Após ativar, resolver pendências
await supabase.from('pendencias')
  .update({ status: 'resolvida' })
  .eq('funcionario_id', funcionarioId)
  .eq('tipo', 'ativacao')
  .eq('status', 'pendente');
```

---

## Resumo de Mudanças

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| Nova migration SQL | Criação | Limpar pendências stale + atualizar RPC para ignorar pendências de funcionários já ativos |
| `src/pages/empresa/Funcionarios.tsx` | Edição | Ler `?cnpj=` da URL e passar como `cnpj_id` ao hook |
| `src/pages/empresa/Funcionarios.tsx` | Edição | Ativação de funcionário também resolve pendências na tabela `pendencias` |

