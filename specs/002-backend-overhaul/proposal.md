# Spec 002 — Backend & Performance Overhaul (Revisão 2 — 30/03)

## Contexto

O sistema GPS RH possui 103 hooks acumulados, muitos com responsabilidades sobrepostas, lógicas de negócio ineficientes, filtragem/paginação no cliente, debug logs em produção e ausência de tratamento centralizado de erros.

Desde a spec anterior (27/03), o usuário adicionou via Lovable:
- **`EnhancedDashboard.tsx`** — novo dashboard avançado da corretora usando `useCorretoraDashboardMetrics` (chama a RPC `get_dashboard_details_corretora`).
- **`SeguroVidaDetalhesPage.tsx`** — nova página de detalhes de seguro de vida para empresa.
- Policies de RLS para exclusão de empresa.

Isso confirma que `useCorretoraDashboardMetrics` **está em uso ativo** e NÃO pode ser simplesmente deletado.

---

## Problemas e Diagnóstico Atual

### P1 — Console.logs em Produção (CRÍTICO)
- **73 hooks** com `console.log` ativo (grep confirmado).
- `src/lib/logger.ts` **já foi criado** na sessão anterior — falta apenas fazer a substituição global nos hooks.
- Expõe dados de usuários no DevTools em produção.

### P2 — Hooks Duplicados do Dashboard da Corretora (ALTO)

Mapa real de uso (auditado agora):

| Hook | RPC chamada | Consumidor |
|---|---|---|
| `useCorretoraDashboard` | `get_corretora_dashboard_metrics` | `Dashboard.tsx` |
| `useCorretoraDashboardData` | `get_corretora_dashboard_metrics` | `Dashboard.tsx` |
| `useCorretoraDashboardMetrics` | `get_dashboard_details_corretora` | `EnhancedDashboard.tsx` |
| `useCorretoraDashboardActionsDetailed` | Supabase queries | `ActionsNeededSection.tsx` |
| `useCorretoraDashboardActions` | (legado, não usado) | — |

**Conclusão atualizada:** 2 hooks distintos (Dashboard vs EnhancedDashboard) são legítimos pois chamam RPCs diferentes. Candidatos à remoção/merge são:
- `useCorretoraDashboard` (duplica `useCorretoraDashboardData` — mesma RPC, mesma queryKey)
- `useCorretoraDashboardActions` (nenhum consumidor encontrado)

### P3 — Filtragem e Paginação no Cliente (ALTO)
- `useEmpresas.ts`: faz `get_empresas_com_metricas` trazendo TODOS os dados → filtra + pagina em JS.
- `usePendenciasDaCorretora.ts`: busca todas as pendências → filtra prioridade/search em JS.
- `useRelatorioCustosEmpresaComSaude.ts`: 3 queries sequenciais, cruzamento de dados feito em JS.

### P4 — N+1 no useAuth (MÉDIO)
- Login dispara 2-3 queries sequenciais (profiles → branding).
- `setIsLoading(false)` é chamado **antes** das promises resolverem → flash de `role = null`.

### P5 — Valores Hardcoded (MÉDIO)
- `useCorretoraDashboardData.ts`: fallback `produtividade_carteira: 75`, `taxa_eficiencia: 82`, `qualidade_dados: 88`.

### P6 — Error Handling e Toast Inconsistentes (MÉDIO)
- Mistura `toast` do Sonner + `useToast` do shadcn em hooks diferentes.
- Sem `handleApiError` centralizado.

---

## O que JÁ EXISTE e será REUTILIZADO

| Recurso | Localização | Status |
|---|---|---|
| `src/lib/logger.ts` | Criado em 27/03 | ✅ Existe, falta usar |
| React Query | `main.tsx` | ✅ Ativo |
| Supabase Client | `src/integrations/supabase/client.ts` | ✅ Ativo |
| Sonner | `src/components/ui/sonner.tsx` | ✅ Ativo |
| `useCorretoraDashboardData` | source-of-truth do Dashboard principal | ✅ Manter |
| `useCorretoraDashboardMetrics` | source-of-truth do EnhancedDashboard | ✅ Manter |
| `useCorretoraDashboardActionsDetailed` | usado em `ActionsNeededSection` | ✅ Manter |

---

## Escopo das Mudanças

### Fase A — Conectar logger.ts nos hooks
- `logger.ts` já existe: basta importar e substituir `console.*` nos hooks.
- **Prioritários:** `useAuth.tsx`, `useFuncionarios.ts`, `useEmpresas.ts`, `useRelatorioCustosEmpresaComSaude.ts`, `useCorretoraDashboard.ts`, `useCorretoraDashboardMetrics.ts`.
- Script node.js para substituição global nos demais (~70 arquivos).

### Fase B — Remover apenas os hooks verdadeiramente mortos
- Deletar `useCorretoraDashboard.ts` (duplicata exata de `useCorretoraDashboardData`, mesma queryKey `corretoraDashboardMetrics` — causa cache collision!).
- Deletar `useCorretoraDashboardActions.ts` (zero consumidores).
- Atualizar `Dashboard.tsx` para usar somente `useCorretoraDashboardData`.

### Fase C — Server-side Filtering (requer Supabase migration)
- **C1:** Atualizar RPC `get_empresas_com_metricas` para aceitar params de filtro/paginação.
- **C2:** Refatorar `useEmpresas.ts` para passar params à RPC.
- **C3:** Mover filtros de `usePendenciasDaCorretora.ts` para server-side (CASE WHEN prioridade, ILIKE search).

### Fase D — Fix useAuth
- Unificar queries profile + branding em uma chamada com join.
- Mover `setIsLoading(false)` para após resolução da query unificada.

### Fase E — Remover Hardcodes
- `useCorretoraDashboardData.ts`: retornar `null` para métricas de eficiência quando RPC não tiver dado.

### Fase F — Centralizar Error + Toast
- Criar `src/lib/errorHandler.ts`.
- Padronizar todos os toasts para Sonner.

---

## Critérios de Aceite

- [ ] Zero `console.log` em build de produção.
- [ ] `useCorretoraDashboard.ts` e `useCorretoraDashboardActions.ts` deletados sem quebrar nada.
- [ ] Busca em `/corretora/empresas` usa paginação server-side (verificável no Network tab).
- [ ] `useAuth` não faz mais de 1 query ao banco no login.
- [ ] Não há valor `75`, `82` ou `88` hardcoded em métricas.
- [ ] Todos os `onError` de hooks usam `handleApiError`.
