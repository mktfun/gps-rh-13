# Tasks: GPS UX/UI Revamp (001-ux-revamp)

> Ordem de execução: seguir exatamente esta sequência. Visual Foundation primeiro — ela afeta tudo.

---

## Bloco 0 — Visual Foundation (tokens, shadows, radius) ← FAZER PRIMEIRO

- [ ] **0.1** — `index.css`: Aumentar `--radius` de `0.5rem` para `0.75rem`
- [ ] **0.2** — `tailwind.config.ts`: Substituir sombras corporativas fracas pelas novas (`shadow-card`, `shadow-card-hover`, `shadow-elevator`)
- [ ] **0.3** — `tailwind.config.ts`: Adicionar keyframes `fade-in` e `slide-in-left` com as animações spring definidas no `design.md`
- [ ] **0.4** — `index.css`: Adicionar utilitários de botão com glow/hover elevation (`.btn-glow`, `.card-hover`)

---

## Bloco A — Sidebar + Header + Mobile Nav

- [ ] **A1** — `Sidebar.tsx`: Mudar fundo para `slate-950` (dark), remover separadores visuais entre grupos, usar pill `rounded-xl` no item ativo com cor `bg-primary`
- [ ] **A2** — `Sidebar.tsx`: Logo GPS ganha gradient `from-blue-500 to-indigo-600`
- [ ] **A3** — `Sidebar.tsx`: Badge numérico de pendências no item "Pendências" usando `usePendenciasDaCorretora`
- [ ] **A4** — `Header.tsx`: Simplificar — remover email longo, mostrar avatar com iniciais + nome curto, backdrop-blur com `border-b`
- [ ] **A5** — `Header.tsx`: Adicionar ícone 🔔 com Badge usando `useNotifications`
- [ ] **A6** — `MobileNav.tsx` (NOVO): Usar `Sheet` do Shadcn com `animate-slide-in-left`, mostrar apenas em `< md:`
- [ ] **A7** — `RootLayout.tsx`: Integrar `MobileNav` e remover padding fixo inconsistente

---

## Bloco B — KPI Cards + Dashboard

- [ ] **B1** — KPI cards da corretora: Adicionar `shadow-card`, `rounded-2xl`, `hover:shadow-card-hover hover:-translate-y-0.5 transition-all`, fundo gradient leve por tipo de métrica
- [ ] **B2** — KPI cards da empresa: mesma lógica do B1
- [ ] **B3** — Card "Ações Necessárias" da Corretora: Auditar e corrigir links de ação pendente (usar `useCorretoraDashboardActions` existente)
- [ ] **B4** — KPI cards: clicar navega para seção correspondente

---

## Bloco C — Tabelas + Status Badges

- [ ] **C1** — Tabelas: Header transparente com só `border-b`, texto `uppercase text-xs tracking-wider text-muted-foreground`
- [ ] **C2** — Tabelas: Rows com `hover:bg-slate-50 dark:hover:bg-slate-900`, sem borda entre linhas
- [ ] **C3** — Status badges: padronizar todos como pill `rounded-full bg-color/10 text-color-700` (Ativo=green, Pendente=amber, Desativado=gray, Exclusão Solicitada=red)
- [ ] **C4** — Ações de tabela: aparecem somente no hover da linha (`opacity-0 group-hover:opacity-100`)

---

## Bloco D — Breadcrumbs + Contexto nas Drills

- [ ] **D1** — `SmartBreadcrumbs.tsx`: Corrigir todos os paths onde nome de empresa/cnpj não aparece
- [ ] **D2** — `SegurosVidaPlanoPage` + `PlanosSaudePlanoPage`: Adicionar `InfoBanner` no topo com "Empresa › CNPJ › Plano"

---

## Bloco E — EmptyState Padronizado

- [ ] **E1** — Criar `src/components/ui/empty-state.tsx` (~50 linhas — ícone grande com fundo circular gradient, título, subtexto, CTA)
- [ ] **E2** — Usar EmptyState em: `EmpresaFuncionarios`, `SegurosVidaPlanoPage`, `Empresas`, `RelatorioPendenciasCorretoraPage`

---

## Bloco F — Verificação Final

- [ ] **F1** — `npm run dev` → testar fluxo corretora no browser (login → dashboard → empresa → ativar)
- [ ] **F2** — Testar em 375px de largura (mobile): hambúrguer abre drawer, todos os menus acessíveis
- [ ] **F3** — Verificar hover elevations nos cards e buttons
- [ ] **F4** — Verificar breadcrumbs em todos os routes de drill
- [ ] **F5** — `npm run lint` → 0 erros novos

---

## Prioridade de Execução

```
🔴 Crítico (base de tudo):    0.1, 0.2, 0.3, A1, A2, A6, A7
🟡 Alto valor:                A3, A4, A5, B1, B2, B3, C1, C2, C3
🟢 Qualidade e polish:        C4, D1, D2, E1, E2, F1-F5
```
