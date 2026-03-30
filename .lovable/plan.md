

# Fix: `useAdicionarFuncionariosPlano` bypasses RPC, fails to activate employees

## Problem

`useAdicionarFuncionariosPlano` (used by `SelecionarFuncionariosModal` -- the "Add employees to plan" flow on the corretora side) does:

1. Direct INSERT into `planos_funcionarios` -- creates the link but doesn't resolve pendencias
2. Direct UPDATE on `funcionarios` setting `status = 'ativo'` -- silently fails/ignored because error is swallowed

This violates the centralized activation rule: all activation MUST go through the RPC `ativar_funcionario_no_plano` which atomically:
- Creates/updates the `planos_funcionarios` link
- Resolves matching pendencias
- Updates the employee status

The toast shows success because the INSERT succeeds, but the employee status doesn't actually change.

## Fix

Rewrite `useAdicionarFuncionariosPlano` to call the RPC `ativar_funcionario_no_plano` for each employee (same pattern as `BulkActivationModal`), instead of doing direct INSERT + UPDATE.

| File | Change |
|---------|-----------|
| `src/hooks/useAdicionarFuncionariosPlano.ts` | Replace direct INSERT/UPDATE with loop calling `ativar_funcionario_no_plano` RPC per employee. Report errors properly instead of swallowing them. Invalidate `pendencias-corretora` query too. |

## Implementation detail

```typescript
// For each funcionarioId, call RPC:
const { data, error } = await supabase.rpc('ativar_funcionario_no_plano', {
  p_funcionario_id: funcionarioId,
  p_plano_id: planoId,
});
// Check result.success === false as error
```

Collect successes/failures and report aggregated result. Show error toast if any fail.

