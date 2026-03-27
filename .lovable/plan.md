

# Auditoria End-to-End: Fluxo Empresa/Corretora - Inclusão e Exclusão de Funcionários

## Problemas Encontrados

### BUG 1 (Crítico): Exclusão não registra `data_exclusao` no funcionário
Quando a corretora aprova a exclusão (clicando "Aprovar exclusão"), o `deleteFuncionario` apenas **remove o registro da tabela `planos_funcionarios`** (DELETE). Ele **não**:
- Atualiza `funcionarios.data_exclusao` com a data atual
- Atualiza `funcionarios.status` para um status de exclusão
- Registra no `historico_funcionarios`

**Resultado:** O relatório de movimentação (`get_relatorio_movimentacao_corretora`) busca exclusões por `f.data_exclusao`, que nunca é preenchido. Por isso fica zerado.

### BUG 2 (Crítico): KPIs não atualizam após exclusão
O dashboard da corretora (`get_corretora_dashboard_metrics`) conta funcionários com `f.status IN ('ativo', 'pendente')`. Como o DELETE em `planos_funcionarios` não altera o status do funcionário na tabela `funcionarios`, o funcionário continua sendo contado nos KPIs.

### BUG 3 (Médio): "Excluir definitivamente" sempre visível para corretora
Na `FuncionarioActionsMenu`, o botão "Excluir definitivamente" aparece **sempre** para a corretora, independente do status. Deveria ter uma separação mais clara ou estar condicionado.

### BUG 4 (Médio): Inclusões no relatório de movimentação filtram `f.status = 'ativo'`
A SQL de inclusões só conta funcionários com `status = 'ativo'`. Funcionários que foram incluídos e depois excluídos no mesmo período não aparecem como inclusão, distorcendo os dados.

### BUG 5 (Menor): Dashboard corretora retorna zeros hardcoded
O `useCorretoraDashboardMetrics` retorna `totalEmpresas: 0, totalFuncionarios: 0` hardcoded (linhas 112-115), ignorando os dados da RPC `get_dashboard_details_corretora`.

---

## Plano de Correção

### Etapa 1: Corrigir o fluxo de exclusão (FuncionarioActionsMenu)
Quando a corretora aprova a exclusão:
1. Atualizar `funcionarios.status = 'inativo'` e `funcionarios.data_exclusao = now()`
2. Inserir registro em `historico_funcionarios`
3. Remover o vínculo de `planos_funcionarios`
4. Invalidar queries de KPIs e movimentação

**Arquivo:** `src/components/empresa/FuncionarioActionsMenu.tsx` - refatorar `handleRemove` para executar os 3 passos.

### Etapa 2: Corrigir SQL do relatório de movimentação
Remover o filtro `AND f.status = 'ativo'` da CTE `inclusoes_mes` -- inclusões devem contar todos os funcionários criados no período, independente do status atual.

**Arquivo:** Nova migration SQL para `get_relatorio_movimentacao_corretora`.

### Etapa 3: Corrigir KPIs do dashboard (hardcoded zeros)
Mapear corretamente os campos retornados pela RPC `get_dashboard_details_corretora` para os KPIs em `useCorretoraDashboardMetrics`, em vez de retornar zeros.

**Arquivo:** `src/hooks/useCorretoraDashboardMetrics.ts`

### Etapa 4: Limpar ações duplicadas no menu
Condicionar "Excluir definitivamente" para não aparecer quando já há "Aprovar exclusão" visível (status `exclusao_solicitada`).

**Arquivo:** `src/components/empresa/FuncionarioActionsMenu.tsx`

---

## Pontos Fortes
- RLS bem estruturada com funções helper (`get_my_role`, `get_my_empresa_id`)
- Separação clara de permissões empresa vs corretora
- Fluxo de solicitação de exclusão com aprovação funciona (RLS recém adicionada)
- Exportação de dados implementada no relatório de movimentação

## Pontos Fracos
- Fluxo de exclusão incompleto (não atualiza o funcionário, só remove vínculo)
- KPIs hardcoded em zeros no dashboard
- Múltiplas RPCs de dashboard (`get_corretora_dashboard_metrics` vs `get_dashboard_details_corretora`) causando confusão
- Sem feedback visual de sucesso/erro claro na solicitação de exclusão pela empresa
- Sem registro de auditoria nas ações de exclusão

## Melhorias Sugeridas (Futuro)
- Notificação automática para corretora quando empresa solicita exclusão
- Tela dedicada de "Solicitações Pendentes" no dashboard da corretora
- Confirmação com motivo obrigatório ao solicitar exclusão
- Dashboard unificar em uma única RPC em vez de múltiplas

---

## Resumo Técnico de Mudanças

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `FuncionarioActionsMenu.tsx` | Edição | Refatorar exclusão para atualizar funcionário + histórico + remover vínculo |
| Nova migration SQL | Criação | Corrigir `get_relatorio_movimentacao_corretora` (remover filtro status) |
| `useCorretoraDashboardMetrics.ts` | Edição | Mapear dados reais da RPC em vez de zeros |
| `FuncionarioActionsMenu.tsx` | Edição | Esconder "Excluir definitivamente" quando em estado `exclusao_solicitada` |

