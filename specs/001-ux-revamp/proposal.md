# Proposta: GPS UX/UI — Revamp Gradual (001-ux-revamp)

## Contexto e Problema

O sistema GPS está funcionando, mas a experiência de uso é dor de cabeça:

- **Navegação engessada:** Fluxos de 3-4 cliques para chegar em uma ação básica (ex.: ativar funcionário exige navegar: Dashboard → Empresas → Empresa → CNPJ → Plano → Funcionário → Ativar).
- **Sem mobile:** Sidebar só aparece em `md:`, em mobile o sistema fica sem navegação.
- **Telas redundantes:** Existem páginas separadas para cada etapa de drill-down (ex.: `SegurosVidaEmpresasPage` → `SegurosVidaCnpjsPage` → `SegurosVidaPlanoPage`), mas sem contexto entre elas (breadcrumb não funciona corretamente em todos os casos).
- **Dashboard inútil:** O dashboard existe mas não dispara ação — é só leitura, sem quick-actions funcionais.
- **Header verboso:** Mostra "Bem-vindo, email@..." com email longo que fica visualmente poluído.
- **Sem estados de empty bem tratados:** Telas com listas vazias ficam sem orientação para o usuário.
- **Inconsistência visual entre páginas:** Algumas telas usam `corporate-shadow`, outras não. Espaçamentos variam.
- **Sem atalhos para pendências:** Uma das funções mais críticas (pendências) exige navegar ao menu lateral.

## Objetivo

Fazer um revamp incremental — mexendo nas beiradas sem reescrever do zero — que torne o sistema:
1. **Rápido**: ações comuns em ≤ 2 cliques
2. **Claro**: o usuário sabe onde está, o que tem para fazer e qual é o próximo passo
3. **Mobile-friendly**: funciona no celular sem menus escondidos
4. **Consistente**: mesmos padrões visuais em todas as telas

---

## O que JÁ EXISTE e será REUTILIZADO

| Elemento | Onde existe | Como será usado |
|---|---|---|
| `Sidebar.tsx` | `src/components/layout/Sidebar.tsx` | Refatorado para suportar mobile drawer + badges de notificação |
| `RootLayout.tsx` | `src/components/layout/RootLayout.tsx` | Adaptado para incluir mobile nav |
| `SmartBreadcrumbs.tsx` | `src/components/layout/SmartBreadcrumbs.tsx` | Corrigido para funcionar em todos os contextos de drill-down |
| `Header.tsx` | `src/components/layout/Header.tsx` | Simplificado — remover email verboso, adicionar ícone de notificação |
| `useNotifications.ts` | `src/hooks/useNotifications.ts` | Ligar ao badge do sino no Header |
| `usePendenciasDaCorretora.ts` | `src/hooks/usePendenciasDaCorretora.ts` | Alimentar contador de pendências no Sidebar |
| `useCorretoraDashboardActions.ts` | `src/hooks/useCorretoraDashboardActions.ts` | Alimentar painel de quick-actions no Dashboard |
| `useQuickActions.ts` | `src/hooks/useQuickActions.ts` | Quick-action bar nas páginas principais |
| Shadcn UI (`Sheet`, `Badge`, `Button`) | `src/components/ui/` | Base de todos os novos componentes visuais |
| Design tokens | `design-brief.md` + `index.css` | Fonte única da verdade de cores/tipografia |

## O que precisa ser CRIADO

| Novo elemento | Justificativa |
|---|---|
| Mobile nav drawer (usando `Sheet` do Shadcn que já existe) | Sidebar fica `hidden` em mobile — ninguém consegue navegar |
| Componente `PendenciasBanner` (alerta flutuante) | Avisar corretora de pendências urgentes sem precisar navegar |
| Melhorias no `QuickActionsCard` do Dashboard da Corretora | Dashboard atual é inerte — precisa de actions reais |
| Padronização de `EmptyState` component | Estado vazio inconsistente entre páginas |
| Sticky "contexto ativo" no topo dos drills (tabs sem re-navegação) | Usuário perde contexto ao navegar entre planos de uma mesma empresa |

---

## User Stories Prioritizadas

### 🔴 Crítico (faz diferença imediata)

**US-01:** Como corretora, quero ver quantas pendências tenho abertas SEM navegar para a página de pendências, para não perder ações urgentes.
> Critério: Badge numérico de pendências visível no sidebar e no header, atualizado em tempo real.

**US-02:** Como usuário mobile, quero acessar qualquer seção do menu pelo celular, para usar o sistema fora do escritório.
> Critério: Botão de hambúrguer no header mobile → abre drawer com todo o menu (Sheet do Shadcn).

**US-03:** Como corretora, quero ativar um funcionário diretamente do Dashboard (em ≤ 2 cliques), sem ter que navegar pela hierarquia empresa → cnpj → plano.
> Critério: Card de "Ações Necessárias" no Dashboard com links diretos para ativar/resolver cada pendência.

**US-04:** Como qualquer usuário, quero saber onde estou no sistema através de breadcrumbs funcionais em 100% das páginas.
> Critério: SmartBreadcrumbs trabalha corretamente em todos os routes de drill-down.

### 🟡 Alto Valor (próximo passo natural)

**US-05:** Como empresa, quero um feedback visual claro quando meu cadastro de funcionário foi enviado para aprovação da corretora, sem confusion de status.
> Critério: Estado "Pendente" mostra mensagem explicativa com o próximo passo esperado.

**US-06:** Como qualquer usuário, quero que telas sem dados me digam o que fazer, em vez de mostrar uma tabela vazia sem orientação.
> Critério: Componente `EmptyState` padronizado em todas as listagens.

**US-07:** Como corretora, quero ver os dados de empresa/CNPJ enquanto navego pelos planos, sem ter que voltar para encontrá-los.
> Critério: Header contextual fixo nas páginas de detalhe do plano mostrando Empresa + CNPJ.

### 🟢 Qualidade de Vida

**US-08:** Header limpo sem email completo — mostrar apenas nome/role em versão curta.

**US-09:** Consistência visual: todas as cards usam `corporate-shadow`, todos os botões primários têm o mesmo estilo.

---

## Critérios de Aceite Gerais

- [ ] Sistema funciona 100% em mobile (375px+)
- [ ] Breadcrumbs corretos em todos os routes
- [ ] Pendências visíveis sem sair da tela atual
- [ ] 0 telas com estado vazio sem orientação
- [ ] Todas as páginas passam no lint sem `any` novo
- [ ] Nenhum hook novo duplicado (usar os 103 existentes)
