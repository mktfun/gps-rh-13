

# Fix Build Errors

Two issues causing build failures:

## 1. `src/hooks/useEmpresas.ts` — corrupted/truncated `useQuery` call

Lines 36-46 are missing the `queryKey`, `queryFn`, and proper syntax. The destructuring opens but the query config is incomplete. Fix by reconstructing the full `useQuery` call using the `get_empresas_com_metricas` RPC (matches the interface and invalidation keys already in the file).

```typescript
const {
  data: result,
  isLoading,
  error
} = useQuery({
  queryKey: ['empresas-com-metricas', search, page, pageSize, orderBy, orderDirection],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('get_empresas_com_metricas');
    if (error) throw error;

    let filtered = data || [];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(e => e.nome?.toLowerCase().includes(s) || e.email?.toLowerCase().includes(s) || e.responsavel?.toLowerCase().includes(s));
    }

    if (orderBy) {
      filtered.sort((a: any, b: any) => {
        const va = a[orderBy] ?? '';
        const vb = b[orderBy] ?? '';
        return orderDirection === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
    }

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const start = (page - 1) * pageSize;
    const empresas = filtered.slice(start, start + pageSize);

    return { empresas, totalCount, totalPages };
  },
  enabled: !!user?.id,
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  refetchOnWindowFocus: false,
});
```

## 2. `supabase/functions/bulk-import-funcionarios-v2/index.ts` — `error` is `unknown`

Lines 467, 477, 509, 510 access `.message` and `.stack` on a catch variable typed as `unknown`. Fix by adding `error instanceof Error` checks or casting.

Line ~467: `reason: (error instanceof Error ? error.message : 'Erro desconhecido')`
Line ~477: `message: (error instanceof Error ? error.message : 'Erro desconhecido')`
Lines 509-510:
```typescript
error: (error instanceof Error ? error.message : 'Erro interno do servidor'),
details: (error instanceof Error ? error.stack : undefined)
```

| File | Change |
|------|--------|
| `src/hooks/useEmpresas.ts` | Reconstruct full `useQuery` call (lines 36-46) |
| `supabase/functions/bulk-import-funcionarios-v2/index.ts` | Add `instanceof Error` guards on 4 lines |

