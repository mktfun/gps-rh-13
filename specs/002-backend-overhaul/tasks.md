# Tasks — Backend & Performance Overhaul (002 — Rev 2)

## Fase A — Logger nos Hooks (logger.ts já existe)
- [ ] A1: Script node para substituir `console.log/error/warn` por `logger.*` em todos os hooks
- [ ] A2: Verificar manualmente os 4 hooks prioritários após o script:
  - `useAuth.tsx`
  - `useFuncionarios.ts`
  - `useEmpresas.ts`
  - `useRelatorioCustosEmpresaComSaude.ts`
- [ ] A3: Remover console.logs restantes em `src/pages/`

## Fase B — Remover Hooks Mortos/Duplicados
- [ ] B1: Confirmar imports de `useCorretoraDashboard` em `Dashboard.tsx` e migrar para `useCorretoraDashboardData`
- [ ] B2: Deletar `useCorretoraDashboard.ts` (collision de queryKey com `useCorretoraDashboardData`)
- [ ] B3: Confirmar zero importações de `useCorretoraDashboardActions.ts`
- [ ] B4: Deletar `useCorretoraDashboardActions.ts`

## Fase C — Server-side Filtering (Supabase Migrations)
- [ ] C1: Migration — adicionar params `p_search`, `p_page`, `p_page_size`, `p_order_by` à RPC `get_empresas_com_metricas`
- [ ] C2: Refatorar `useEmpresas.ts` — passar params à RPC, remover filter/sort/paginate em JS (~80 linhas)
- [ ] C3: Refatorar `usePendenciasDaCorretora.ts` — mover cálculo de prioridade e search para query server-side

## Fase D — Fix useAuth (N+1 + Race Condition)
- [ ] D1: Unificar `getUserProfile` + `getBrandingData` em uma única query com embed inline
- [ ] D2: Mover `setIsLoading(false)` para após resolução completa
- [ ] D3: Smoke test: login como `empresa`, `corretora` e `admin` sem flash de tela branca

## Fase E — Remover Hardcodes
- [ ] E1: `useCorretoraDashboardData.ts` — retornar `null` para métricas de eficiência sem dado real

## Fase F — Centralizar Errors + Toast
- [ ] F1: Criar `src/lib/errorHandler.ts` com `handleApiError(error, context)`
- [ ] F2: Substituir `onError` verbosos nos hooks por `handleApiError`
- [ ] F3: Padronizar toasts para Sonner (remover uso de `useToast` nos hooks)
