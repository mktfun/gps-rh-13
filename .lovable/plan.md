

# Fix: Funcionários não aparecem na tela da corretora + seguro de vida

## Bug Confirmado: Paginação duplicada no EmpresaDetalhes

Em `src/pages/corretora/EmpresaDetalhes.tsx` (linha 127):
```
page: pagination.pageIndex + 1   // passa 1 quando deveria passar 0
```

Depois em `useFuncionarios.ts` (linha 267):
```
pageNum: page + 1   // converte 1 → 2, pulando a primeira página
```

Resultado: a primeira página de resultados nunca é exibida. O RPC recebe `page_num = 2` quando deveria receber `1`, então o offset pula os primeiros 10 funcionários.

## Bug no Seguro de Vida: funcionário pendente não aparece

Quando `criar_funcionario_com_planos` cria um funcionário com `p_incluir_vida = true`:
- Cria o funcionário com status `ativo`
- Cria uma `pendência` de ativação com `tipo_plano = 'vida'`
- **NÃO** cria registro em `planos_funcionarios`

O RPC `get_funcionarios_por_plano` tem um UNION ALL que busca pendências pendentes. Porém, ele usa `SECURITY INVOKER` (padrão). A empresa precisa ter acesso via RLS para ver as pendências -- isso deveria funcionar com a policy existente. A causa provável é que a RPC `get_funcionarios_por_plano` **não** está como `SECURITY DEFINER`, e o acesso indireto às tabelas via JOINs complexos pode falhar com RLS do invoker.

## Correções

### 1. Arquivo: `src/pages/corretora/EmpresaDetalhes.tsx`
- Mudar `page: pagination.pageIndex + 1` para `page: pagination.pageIndex` (remover o `+ 1`)

### 2. Migration SQL: tornar `get_funcionarios_por_plano` SECURITY DEFINER
- Recriar a função com `SECURITY DEFINER` e `SET search_path TO 'public'` para garantir que tanto corretora quanto empresa consigam ver os funcionários pendentes via pendências

## Resumo

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/pages/corretora/EmpresaDetalhes.tsx` | Edição | Corrigir paginação: remover `+ 1` duplicado |
| Nova migration SQL | Criação | `get_funcionarios_por_plano` como SECURITY DEFINER |

