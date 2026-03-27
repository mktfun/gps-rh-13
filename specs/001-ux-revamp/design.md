# Design: GPS UX/UI Revamp (001-ux-revamp)

## Referências Visuais — O Norte do Projeto

| Referência | O que copiar |
|---|---|
| **Stripe** | Cards com profundidade real (border + shadow sutil), hover elevations, dados densos mas claros, gradiente azul como accent |
| **ElevenLabs** | Sidebar escura e clean, texto com hierarchy marcante, botões com glow sutil, backgrounds com noise/grain leve |
| **Apple (iOS/macOS)** | Radius generoso (16px+), separação por camadas (não por bordas), blur/frosted glass nas overlays, animações spring suaves |

### O que o GPS vai incorporar

1. **Profundidade por sombra, não por borda** — remover `border-width` pesado, usar `shadow-sm` + `ring-1 ring-black/5`
2. **Radius maior** — `--radius: 0.5rem` → `--radius: 0.75rem` globalmente; cards principais → `rounded-2xl`
3. **Sidebar renovada** — fundo levemente cinza escuro (não branco), items ativos com pill highlight colorido
4. **Micro-animações** — `transition-all duration-200 ease-out` em todos os cards e botões; hover faz elevação leve (`hover:-translate-y-0.5`)
5. **Gradiente accent no header** — strip de gradiente sutil no topo ou logo com gradiente
6. **KPI Cards com gradiente de fundo** — cada card de métricas tem um gradient leve relacionado à cor (`blue/5` para ativos, `green/5` para receita etc.)
7. **Status badges pill** — rounded-full com versão transparente da cor de fundo (`bg-emerald-50 text-emerald-700` light / `bg-emerald-950 text-emerald-300` dark)

---

## Stack e Padrões

- **UI Base:** Shadcn UI + Tailwind (já existente — não muda)
- **Tokens de cores:** Seguir `design-brief.md` — azul `hsl(221 83% 53%)`, verde `hsl(160 84% 39%)`, laranja `hsl(25 95% 53%)`
- **Fonte:** Inter (já configurada)
- **Nova JSX volumosa (>200 linhas):** Usar Stitch MCP como gerador base
- **Integração de dados:** Hooks já existentes (Antigravity integra)

---

## Mudanças por Camada

### 0. Design Tokens — `index.css` + `tailwind.config.ts` ← PRIMEIRO A FAZER

**A. Radius global mais generoso:**
```css
/* index.css */
--radius: 0.75rem; /* era 0.5rem */
```

**B. Sombras com profundidade real (inspirado no Stripe):**
```ts
// tailwind.config.ts
boxShadow: {
  'xs':  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
  'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
  'elevator': '0 8px 24px 0 rgb(0 0 0 / 0.12), 0 2px 8px -2px rgb(0 0 0 / 0.08)',
}
```

**C. Keyframes para micro-animações:**
```ts
keyframes: {
  'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
  'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
}
animation: {
  'fade-in': 'fade-in 0.2s ease-out',
  'slide-in-left': 'slide-in-left 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
}
```

---

### 1. Layout Shell — `RootLayout.tsx` + `Sidebar.tsx` + `Header.tsx`

#### Sidebar — Estilo ElevenLabs
```
ANTES: fundo branco, border-r simples, items com bg-primary quando ativo
DEPOIS: fundo slate-950/slate-900 (dark), items pill rounded-xl com bg-blue-600
        logo tem gradient de cor
        separadores removidos — grupos por espaçamento
```

#### Mobile Navigation Drawer
```
Header (mobile)
├── [☰] Hambúrguer → abre Sheet (Shadcn)
│     └── Sheet.Content position="left" com animate-slide-in-left
└── [🔔] Badge notificações
```

#### Header — Estilo Apple/Stripe
```
ANTES: "Bem-vindo, email-longo@... [badge] [Sair]"
DEPOIS: [gradient-logo] GPS | [breadcrumb] | ............ | [🔔] [avatar iniciais]
        altura: h-14, backdrop-blur com border-b
```

---

### 2. KPI Cards — Estilo Stripe Dashboard

```
ANTES: cards brancos com border simples, número em bold
DEPOIS:
┌──────────────────────────────────────┐
│ 🔵 gradient bg-blue-50               │
│ Total Funcionários  ↑ +3 este mês   │
│ 247                                  │ ← texto grande
│ ████████░░ 74% ativos               │ ← progress bar
└──────────────────────────────────────┘
shadow-card, rounded-2xl, hover:shadow-card-hover hover:-translate-y-0.5
transition-all duration-200 ease-out
```

---

### 3. Tabelas — Estilo mais clean

```
ANTES: tabela chapada com borda em todos os lados e header cinza escuro
DEPOIS:
- Header: bg transparente, border-b apenas, texto uppercase xs tracking-wider muted
- Rows: hover:bg-slate-50 (sem border entre linhas, só separação visual por espaço)
- Badges de status: pill rounded-full, bg-color/10 text-color-700 (soft colors)
- Colunas de ação: ícones menores, apparecem apenas no hover da linha
```

---

### 4. Botões — Micro-animações

```css
/* Botão primário */
.btn-primary {
  background: hsl(var(--primary));
  box-shadow: 0 0 0 0 hsl(var(--primary) / 0);
  transition: all 0.15s ease;
}
.btn-primary:hover {
  box-shadow: 0 4px 12px hsl(var(--primary) / 0.35);
  transform: translateY(-1px);
}
.btn-primary:active {
  transform: translateY(0);
}
```

---

### 5. Componentes Novos

#### `EmptyState` (NOVO — ~50 linhas)
Visual rico: ícone grande com fundo em gradiente circular, título bold, subtexto muted, CTA.

#### `MobileNav.tsx` (NOVO — ~30 linhas)  
Wrapper fino usando `Sheet` do Shadcn com conteúdo do `Sidebar`.

#### `InfoBanner` contextual (NOVO — ~20 linhas)
Strip acima de páginas de drill com "Empresa › CNPJ › Plano".

---

## Mapa de Dependências

```
index.css + tailwind.config.ts (MODIFICADOS — tokens visuais)
  └── Todos os componentes herdam automaticamente

Sidebar.tsx (MODIFICADO — dark theme, pill active state)
  └── usePendenciasDaCorretora.ts (badge count)

MobileNav.tsx (NOVO)
  └── Sheet (shadcn/ui existente)
  └── Sidebar.tsx

Header.tsx (MODIFICADO — simplificado, backdrop-blur, avatar)
  └── useNotifications.ts (sino com badge)
  └── UserProfileMenu.tsx (avatar)

KPI Cards (MODIFICADOS — gradiente, sombra, hover)
  └── mesmos hooks existentes

EmptyState (NOVO ~50 linhas)
  └── lucide-react

InfoBanner (NOVO ~20 linhas)
  └── dados já nas queries existentes

Dashboard da Corretora (MODIFICADO — quick-actions reais)
  └── useCorretoraDashboardActions.ts (existente)
```

---

## O que o Stitch MCP vai gerar

Usar Stitch para gerar o visual base de:
1. **Sidebar renovada** (dark, pill items, logo gradient)
2. **KPI Card premium** (gradiente, hover elevation, progress bar)
3. **EmptyState component** (visual rico)
4. **Tabela modernizada** (rows clean, soft badges, hover actions)

Pós-Stitch: Antigravity conecta dados reais via hooks.

## O que o Supabase MCP vai fazer

**Nenhuma mudança de schema** nesta spec. Zero migration necessária.

---

## Verificação

### Browser manual
1. `npm run dev` no projeto
2. Login como corretora
3. Verificar: sidebar dark, cards com sombra, radius maior
4. Reduzir janela para 375px — verificar mobile nav funciona
5. Hover em cards — verificar elevação + transição suave
6. Navegar até empresa → plano — verificar breadcrumb + InfoBanner

### Lint
```bash
npm run lint
```
Zero erros e zero warnings novos.
