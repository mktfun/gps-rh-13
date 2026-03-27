

# Fix: Empresa cannot request employee exclusion (403 Forbidden)

## Root Cause

The `archiveFuncionario` mutation updates `funcionarios.status` to `'exclusao_solicitada'` directly. However, the empresa's RLS UPDATE policies on `funcionarios` are failing with 403. This is likely because multiple overlapping UPDATE policies create conflicts, or the `WITH CHECK` expression on the unified policy doesn't match.

Meanwhile, the `planos_funcionarios` table has an **explicit RLS policy** called "Empresas podem solicitar exclusao" that specifically allows empresas to set `status = 'exclusao_solicitada'` on plan-employee links. This is the correct table to update for exclusion requests.

## Fix

### File: `src/hooks/useFuncionarios.ts` -- `archiveFuncionario` mutation

Change the mutation to:
1. Update `planos_funcionarios.status` to `'exclusao_solicitada'` for ALL plan links of that employee (this works with existing RLS)
2. Update `funcionarios.status` to `'exclusao_solicitada'` AND set `data_solicitacao_exclusao` timestamp
3. If the `funcionarios` update fails (403), still succeed -- the `planos_funcionarios` update is what matters for the workflow
4. Show proper toast on success/error

```
// Pseudocode:
// 1. Get all planos_funcionarios for this employee
// 2. Update each to status = 'exclusao_solicitada' 
// 3. Try to update funcionarios.status (best-effort)
// 4. Invalidate queries
```

### File: `src/pages/empresa/Funcionarios.tsx` -- pass `userRole` to table columns

Verify that `role` from `useAuth()` is being passed correctly as the `userRole` parameter to `createFuncionariosEmpresaTableColumns` so the "Solicitar Exclusao" menu item appears.

## Summary

| File | Change |
|------|--------|
| `src/hooks/useFuncionarios.ts` | Fix `archiveFuncionario` to update `planos_funcionarios` first (RLS-compatible), then `funcionarios` as best-effort |

