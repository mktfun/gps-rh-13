

# Melhorias no Tratamento de Erros do Cadastro de Funcionários

## Situação Atual

O código **já possui** as correções implementadas na rodada anterior:
- Schema Zod com `salario: z.number().min(0.01)` -- impede salário zero
- Verificação de CPF duplicado no `onBlur` buscando na mesma empresa
- Mensagens de erro traduzidas no hook `useCriarFuncionarioComPlanos`

O erro que aparece nos logs é de **antes** da última implantação. No entanto, há um problema residual: o `defaultValues.salario` é `0`, o que pode confundir o usuário pois o campo inicia com "0" visível.

## Melhorias Adicionais

### 1. Corrigir valor default do salário
Mudar `defaultValues.salario` de `0` para `undefined` e o placeholder para "Ex: 2500.00", para que o campo fique vazio e o Zod rejeite se o usuário não preencher.

### 2. Máscara de CPF automática
Adicionar formatação automática no campo CPF (000.000.000-00) conforme o usuário digita, usando um handler `onChange` que aplica a máscara.

### 3. Melhorar a checagem de CPF duplicado
- Adicionar indicador de loading (spinner) durante a verificação
- Mostrar feedback positivo ("CPF disponível") quando não há duplicata
- Garantir que a query filtra apenas funcionários com status ativo/pendente (já faz isso)

### 4. Bloquear submit durante verificação de CPF
Se `isCheckingCpf` estiver true, desabilitar o botão de submit.

## Resumo de Arquivos

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/empresa/AdicionarFuncionarioModal.tsx` | Edição | Default salary vazio, máscara CPF, loading no check, bloquear submit durante check |

