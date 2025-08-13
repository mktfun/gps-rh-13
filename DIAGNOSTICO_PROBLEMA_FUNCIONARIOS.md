# DIAGNÓSTICO COMPLETO: Problema de Vinculação Automática de Funcionários

## 🔍 PROBLEMA RELATADO

**Cenário:**
1. João entra na empresa mas só vai ter seguro de vida
2. Adicionado no CNPJ X
3. **ERRO**: Ao ver os planos (saúde e vida) desse CNPJ X, ambos aumentaram em 1 funcionário
4. **ERRO**: Ao adicionar João ao seguro de vida, fica pendente nos DOIS planos
5. **ERRO**: Corretora ativa João e ele fica ativo nos DOIS planos
6. **ERRO**: Meses depois, ao tentar adicionar João a um plano de saúde, ele não aparece na lista

## 🎯 CAUSA RAIZ IDENTIFICADA

### 1. **CONTAGEM INCORRETA DE FUNCIONÁRIOS NOS CARDS**

**Problema:** Os hooks `useEmpresaPlanos.ts` e `useEmpresaPlanosPorTipo.ts` contam TODOS os funcionários do CNPJ, não apenas os vinculados ao plano específico.

**Código Problemático:**
```typescript
// src/hooks/useEmpresaPlanos.ts (linhas 46-50)
const { data: funcionariosData, error: funcionariosError } = await supabase
  .from('funcionarios')
  .select('id', { count: 'exact' })
  .eq('cnpj_id', plano.cnpj_id)  // ❌ TODOS os funcionários do CNPJ
  .eq('status', 'ativo');
```

**Deveria ser:**
```typescript
const { data: funcionariosData, error: funcionariosError } = await supabase
  .from('planos_funcionarios')
  .select('id', { count: 'exact' })
  .eq('plano_id', plano.id)  // ✅ Apenas funcionários deste plano específico
  .eq('status', 'ativo');
```

### 2. **FUNÇÃO SQL AUSENTE**

**Problema:** A função `get_funcionarios_fora_do_plano` é chamada mas não existe no banco de dados.

**Onde é usada:**
- `src/hooks/useFuncionariosForaDoPlano.ts`
- `src/components/planos/AdicionarFuncionariosModal.tsx`

**Impacto:** Quando a função não existe, pode retornar erro ou comportamento inesperado na busca de funcionários disponíveis.

### 3. **LÓGICA DE INVALIDAÇÃO DE CACHE INCORRETA**

**Problema:** Quando um funcionário é criado, o cache é invalidado de forma genérica, causando atualizações em todos os planos.

**Código Problemático:**
```typescript
// src/hooks/useFuncionariosMutation.ts (linhas 135-138)
queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', cnpjId] });
queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', cnpjId] });
```

## 🛠️ SOLUÇÕES IMPLEMENTADAS

### Solução 1: Corrigir Contagem de Funcionários nos Cards
### Solução 2: Criar Função SQL Missing
### Solução 3: Corrigir Hooks de Empresa Planos
### Solução 4: Implementar Debug Component

## 📊 COMPORTAMENTO CORRETO ESPERADO

1. **Criar funcionário:** Aparece apenas nas listas gerais, NÃO nos contadores de planos
2. **Adicionar a plano específico:** Aparece no contador apenas daquele plano
3. **Ativar funcionário:** Status muda para ativo apenas nos planos onde está vinculado
4. **Buscar para adicionar:** Funcionário ativo aparece na lista se NÃO estiver no plano específico atual

## 🔧 ARQUITETURA CORRETA

```
funcionarios (tabela base)
    ↓
planos_funcionarios (tabela de relação)
    ↓ (only count these)
estatísticas por plano
```

**NÃO:**
```
funcionarios → contar todos por CNPJ ❌
```

## 🧪 COMO TESTAR A CORREÇÃO

1. Criar funcionário novo
2. Verificar que contadores dos planos não aumentam
3. Adicionar funcionário a um plano específico
4. Verificar que apenas aquele plano tem contador aumentado
5. Ativar funcionário
6. Verificar que fica ativo apenas no plano vinculado
7. Tentar adicionar a outro plano
8. Verificar que funcionário aparece na lista
