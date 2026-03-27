

# Fix: Botão "Adicionar Funcionários" no Plano de Saúde (Empresa) não abre modal

## Problema
O botão "Adicionar Funcionários" na página `PlanoSaudeDetalhesPage.tsx` define `shouldOpenAddModal = true`, mas **nenhum modal é renderizado**. O `SelecionarFuncionariosModal` nunca é importado nem utilizado.

## Solução

### Arquivo: `src/pages/empresa/PlanoSaudeDetalhesPage.tsx`

1. Importar `SelecionarFuncionariosModal` de `@/components/planos/SelecionarFuncionariosModal`
2. Importar `useQueryClient` de `@tanstack/react-query`
3. Renderizar o modal antes do fechamento do componente, usando:
   - `isOpen={shouldOpenAddModal}`
   - `onClose={() => setShouldOpenAddModal(false)}`
   - `cnpjId={plano.cnpj_id}`
   - `planoId={plano.id}`
   - `onFuncionariosAdicionados` para invalidar queries (`planoFuncionarios`, `planoFuncionariosStats`)

Mudança de ~10 linhas. O modal `SelecionarFuncionariosModal` já existe e funciona -- apenas precisa ser conectado.

