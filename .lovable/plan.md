

# Fix: Pendencias not being created on exclusion requests

## Root Cause

The exclusion trigger `trg_criar_pendencia_exclusao` fires on `funcionarios` table updates, but the actual exclusion flow updates `planos_funcionarios.status` to `exclusao_solicitada` instead (due to an RLS workaround -- empresa users can't update `funcionarios` directly). The `funcionarios` update is "best-effort" and silently fails for empresa users, so the trigger never fires and no pendencia is created.

## Database state

All 7 pendencias in the database have `status = 'resolvida'`. Zero pending items exist, which is why nothing shows anywhere.

## Fix

### 1. New trigger on `planos_funcionarios` AFTER UPDATE

Create `trg_criar_pendencia_exclusao_pf` on `planos_funcionarios` that fires when `status` changes to `exclusao_solicitada`. The trigger function will:

- Look up the funcionario's `cnpj_id` and `nome` from `funcionarios`
- Look up `corretora_id` via cnpjs -> empresas join
- Look up `tipo_seguro` from `dados_planos` for the linked plan
- Check for duplicate pendencias
- Insert a `cancelamento` pendencia with `tipo_plano` set correctly

This mirrors the logic in `fn_criar_pendencia_exclusao` but is triggered from `planos_funcionarios` where the actual status change happens.

### 2. No frontend changes needed

The `archiveFuncionario` mutation and `handleStatusChange` already update `planos_funcionarios` and invalidate pendencia queries. Once the trigger creates pendencias correctly, everything downstream (sidebar badges, empresa pendencias list, corretora views) will work automatically.

| Item | Type | Description |
|------|------|-------------|
| Migration SQL | DB migration | Add trigger on `planos_funcionarios` AFTER UPDATE to create cancelamento pendencias when status changes to `exclusao_solicitada` |

