

# Fix: Ativação de funcionário pelo corretor não funciona de verdade

## Problema

Existem **3 lugares** que ativam funcionários, mas **2 deles fazem errado** -- apenas mudam `funcionarios.status` para `'ativo'` via UPDATE direto, sem:
- Criar o vínculo em `planos_funcionarios`
- Resolver a pendência correspondente

A RPC `ativar_funcionario_no_plano` já faz tudo corretamente (cria vínculo, resolve pendência, atualiza status). Precisa apenas fazer todos os fluxos usarem essa RPC.

## Correções

### 1. `src/components/funcionarios/BulkActivationModal.tsx`
A mutation `bulkActivationMutation` (linhas 93-121) faz `supabase.from('funcionarios').update({ status: 'ativo' })`.

**Corrigir para:** chamar `supabase.rpc('ativar_funcionario_no_plano', { p_funcionario_id: id, p_plano_id: plano.id })` para cada funcionário. Verificar o retorno `result.success` para detectar erros.

### 2. `src/components/funcionarios/AtivarFuncionarioForm.tsx`
A mutation (linhas 63-72) faz `supabase.from('funcionarios').update({ status: 'ativo' })`.

**Corrigir para:** chamar a RPC `ativar_funcionario_no_plano`. Precisa receber o `planoId` como prop ou permitir selecionar o plano. Como o componente já recebe `planos[]`, adicionar um select para o usuário escolher o plano e usar a RPC.

### 3. Invalidação de queries
Ambos os componentes devem invalidar as mesmas queries que `useAtivarFuncionarioPlano.ts` já invalida: `planoFuncionarios`, `planoFuncionariosStats`, `funcionarios`, `pendencias-corretora`.

## Resumo

| Arquivo | Descrição |
|---------|-----------|
| `src/components/funcionarios/BulkActivationModal.tsx` | Trocar UPDATE direto pela RPC `ativar_funcionario_no_plano` |
| `src/components/funcionarios/AtivarFuncionarioForm.tsx` | Trocar UPDATE direto pela RPC + adicionar seleção de plano |

