

# Fix: Pendencias showing zero across corretora and empresa screens

## Root Cause Analysis

There are **3 separate problems** causing pendencias to show as zero:

### Problem 1: Corretora Empresas list has no pendencia data
The `EmpresaComPlano` interface only has `{ id, nome, total_planos_ativos }`. The RPC `get_empresas_com_planos_por_tipo` does **not return pendencia counts at all**. The `EmpresasCardView` component doesn't display pendencias either.

### Problem 2: Corretora CNPJs list -- RPC filters out valid pendencias
The RPC `get_cnpjs_com_metricas_por_tipo` counts `pendentes_no_plano` from the `pendencias` table but **excludes rows where the employee is already `ativo`**. This is the "ghost count" filter from a previous fix, but it's too aggressive: if an employee was activated without resolving the pendencia (which happened before the RPC fix), the pendencia stays `pendente` in the DB but is hidden from the count.

Current data confirms: 1 pendencia with `status='pendente'` exists, but the linked employee has `status='ativo'` -- so the RPC returns 0.

Additionally, `totalPendencias` in the frontend is calculated as `pendentes_no_plano + exclusao_solicitada_no_plano`, which only counts pendencias of type `ativacao` -- missing other types like `documentacao`, `alteracao`, `cancelamento`.

### Problem 3: Empresa side -- `usePendenciasEmpresa` uses a missing RPC
The empresa pendencias page calls `get_pendencias_empresa` RPC. If this function doesn't exist in the DB, it silently returns `[]`. The empresa planos page doesn't show pendencia counts at all.

## Fix Plan

### 1. Fix the database: resolve orphaned pendencias
Create a migration to resolve pendencias where the employee is already `ativo` but the pendencia is still `pendente`.

```sql
UPDATE pendencias 
SET status = 'resolvida', updated_at = now()
WHERE status = 'pendente' 
  AND tipo = 'ativacao'
  AND funcionario_id IN (
    SELECT id FROM funcionarios WHERE status = 'ativo'
  );
```

### 2. Update RPC `get_cnpjs_com_metricas_por_tipo` to count ALL pendencia types
Change the `pendentes_no_plano` subquery to count all `pendencias` with `status = 'pendente'` for the CNPJ and matching `tipo_plano`, not just `tipo = 'ativacao'`.

### 3. Add pendencia counts to `get_empresas_com_planos_por_tipo` RPC
Add a `total_pendencias` column to the return type so the empresas list page can show a badge.

### 4. Update frontend `EmpresaComPlano` interface and card view
- Add `total_pendencias` to `EmpresaComPlano` interface
- Show pendencia badge in `EmpresasCardView` and `EmpresasListView`

### 5. Create or fix `get_pendencias_empresa` RPC for empresa-side
Create the RPC if it doesn't exist, returning all pendencias for the empresa's CNPJs with proper fields.

## Files

| Item | Type | Description |
|------|------|-------------|
| Migration SQL | DB migration | Resolve orphaned pendencias + update/create RPCs |
| `src/hooks/useEmpresasComPlanos.ts` | Edit | Add `total_pendencias` to interface and mapping |
| `src/components/seguros-vida/EmpresasCardView.tsx` | Edit | Show pendencia badge on empresa cards |
| `src/components/seguros-vida/EmpresasListView.tsx` | Edit | Show pendencia badge on empresa list rows |

