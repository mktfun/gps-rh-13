

# Fix: Botão "Adicionar Funcionários" na tela de Seguro de Vida (Empresa)

## Problema
Na página `SeguroVidaDetalhesPage.tsx` (visão empresa), o botão "Adicionar Funcionários" define `shouldOpenAddModal = true` mas **nenhum modal é renderizado**. O `AddFuncionarioModal` é um stub vazio ("em desenvolvimento").

Na página da corretora (`SegurosVidaPlanoPage.tsx`), o mesmo botão funciona corretamente usando o `SelecionarFuncionariosModal`.

## Solução

Conectar o `SelecionarFuncionariosModal` (já existente e funcional) na página da empresa, usando o `cnpj_id` que já vem do `usePlanoDetalhes`.

### Arquivo: `src/pages/empresa/SeguroVidaDetalhesPage.tsx`

1. Importar `SelecionarFuncionariosModal` e `useQueryClient`
2. Renderizar o modal no final do componente, passando `plano.cnpj_id` e `plano.id`
3. No callback `onFuncionariosAdicionados`, invalidar as queries relevantes (`planoFuncionarios`, `planoFuncionariosStats`)

Mudança mínima -- apenas adicionar ~15 linhas para importar e renderizar o modal que já existe.

