

# Fix: Pendencias not showing on empresa side

## Problem

The `usePendenciasEmpresa` hook calls a RPC `get_pendencias_empresa` that doesn't exist in the database. When the RPC fails, the hook silently returns `[]` (empty array), so pendencias never appear.

The empresa user already has RLS SELECT access on the `pendencias` table (policy: "Empresas podem ver suas pendências"). So we don't need an RPC at all -- we can query `pendencias` directly with joins.

## Fix

### 1. Rewrite `usePendenciasEmpresa` to query directly (no RPC)

Replace the RPC call with a direct query on the `pendencias` table, joining `funcionarios` and `cnpjs` to get names/CPFs. RLS will automatically filter to only the empresa's data.

| File | Change |
|------|--------|
| `src/hooks/usePendenciasEmpresa.ts` | Replace RPC call with direct Supabase query on `pendencias` table with select + joins. Remove the `createMissingFunction` import and fallback logic. |

```typescript
// Query pendencias directly -- RLS handles filtering
const { data, error } = await supabase
  .from('pendencias')
  .select(`
    id, protocolo, tipo, descricao, status,
    data_criacao, data_vencimento, comentarios_count,
    corretora_id, tipo_plano, cnpj_id,
    funcionarios!inner(nome, cpf),
    cnpjs!inner(cnpj, razao_social)
  `)
  .eq('status', 'pendente')
  .order('data_criacao', { ascending: false });
```

Map the joined data to match the existing `PendenciaEmpresa` interface (funcionario_nome, funcionario_cpf, cnpj, razao_social, dias_em_aberto calculated from data_criacao).

### 2. Add pendencia count to planos de saude cards (empresa side)

The planos listing page (`EmpresaPlanosSaudePage.tsx`) shows no pendencia info. Add a small badge showing pending count per plan, queried from the same `pendencias` table.

| File | Change |
|------|--------|
| `src/pages/empresa/EmpresaPlanosSaudePage.tsx` | Add a pendencias count badge on each plan card using data from `usePendenciasEmpresa` filtered by cnpj_id |

