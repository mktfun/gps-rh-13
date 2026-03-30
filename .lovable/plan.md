

# Fix: Pendencias not being generated for key employee events

## Problem

Pendencias are only created in ONE place: the `criar_funcionario_com_planos` RPC, and only when the user explicitly checks "incluir saúde" or "incluir vida". No pendencias are created for:

1. **Exclusion requests** — empresa solicits exclusion, status changes to `exclusao_solicitada`, but no pendencia record is created
2. **Adding employees to existing plans** — `useAdicionarFuncionariosPlano` calls `ativar_funcionario_no_plano` which resolves pendencias but doesn't create new ones if the employee was added without going through `criar_funcionario_com_planos`
3. **Status changes** — no database trigger creates pendencias when employee status changes

## Solution

Create a database trigger on `funcionarios` that automatically creates pendencias for key status changes, plus a trigger on `planos_funcionarios` for new plan associations.

### Database migration

**Trigger 1: `trg_criar_pendencia_exclusao`** on `funcionarios` AFTER UPDATE OF status
- When status changes TO `exclusao_solicitada`: create a pendencia of tipo `cancelamento` for each plan the employee is linked to
- Looks up `corretora_id` via cnpjs → empresas join
- Sets `tipo_plano` based on the `dados_planos.tipo_seguro` of each linked plan

**Trigger 2: `trg_criar_pendencia_novo_vinculo`** on `planos_funcionarios` AFTER INSERT
- When a new plan link is inserted with status `pendente`: create a pendencia of tipo `ativacao`
- Skips if a pendencia already exists for this funcionario+cnpj+tipo combination (to avoid duplicates from `criar_funcionario_com_planos` which already creates them)

This ensures pendencias are always generated regardless of which code path creates/modifies employees.

### Frontend changes

**`src/hooks/useFuncionarios.ts`** — in the `solicitarExclusao` mutation's `onSuccess`, also invalidate `pendencias-empresa` query key so the empresa dashboard refreshes.

**`src/components/empresa/FuncionarioActionsMenu.tsx`** — in `handleSolicitarExclusao` and `handleAprovarExclusao`, invalidate `pendencias-corretora` and `pendencias-empresa` query keys.

| Item | Type | Description |
|------|------|-------------|
| Migration SQL | DB migration | Create two triggers for auto-generating pendencias on exclusion request and new plan links |
| `src/hooks/useFuncionarios.ts` | Edit | Add `pendencias-empresa` invalidation to exclusion mutation |
| `src/components/empresa/FuncionarioActionsMenu.tsx` | Edit | Add pendencias query invalidation to exclusion actions |

