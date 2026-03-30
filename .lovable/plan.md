

# Fix: Duplicate RPC causing PGRST203 + Add pendencia badges to sidebar

## Problem 1: RPC overload conflict
There are two versions of `get_empresas_com_planos_por_tipo` in the database — the old one returning 3 columns and the new one returning 4 columns (with `total_pendencias`). PostgREST can't disambiguate them, causing `PGRST203` error.

**Fix**: Migration to drop the old function signature, keeping only the new one.

```sql
-- Drop the old function (returns TABLE with 3 columns, no total_pendencias)
DROP FUNCTION IF EXISTS public.get_empresas_com_planos_por_tipo(text, uuid);
```

The new function `(uuid, text)` with `total_pendencias` remains.

## Problem 2: Sidebar needs pendencia badges

The user wants pendencia counts shown next to "Seguros de Vida" and "Planos de Saúde" in the sidebar, for both corretora and empresa roles.

**Corretora sidebar**: Use the existing `usePendenciasDaCorretora` hook (already loaded in Sidebar), filter by `tipo_plano` to split counts between `vida` and `saude`.

**Empresa sidebar**: Use the existing `usePendenciasEmpresa` hook, filter similarly.

| Item | Type | Description |
|------|------|-------------|
| Migration SQL | DB migration | Drop old function overload |
| `src/components/layout/Sidebar.tsx` | Edit | Add pendencia count badges to Seguros de Vida and Planos de Saúde menu items for both corretora and empresa roles |

### Sidebar changes detail

For corretora, derive counts from existing `pendencias` data:
- `vidaCount = pendencias.filter(p => p.tipo_plano === 'vida' && p.status_db === 'pendente').length`  
- `saudeCount = pendencias.filter(p => p.tipo_plano === 'saude' && p.status_db === 'pendente').length`

Note: `usePendenciasDaCorretora` doesn't filter by status='pendente' server-side currently — need to check. Actually looking at the query, it doesn't filter by status at all, so we filter client-side.

For empresa, import `usePendenciasEmpresa` and do the same filtering by `tipo_plano`.

Add badge property to the `corretoraPlanos` and `empresaPlanos` arrays dynamically.

