# Manual de Teste para Desenvolvedores - Sistema de Gestão de Seguros

## Índice
1. [Arquitetura do Sistema](#arquitetura-do-sistema)
2. [Setup e Configuração](#setup-e-configuração)
3. [Testes de Segurança](#testes-de-segurança)
4. [Testes de Funcionalidade](#testes-de-funcionalidade)
5. [Testes de Integração](#testes-de-integração)
6. [Testes de Performance](#testes-de-performance)
7. [Verificação de Saúde do Sistema](#verificação-de-saúde-do-sistema)
8. [Troubleshooting](#troubleshooting)

---

## Arquitetura do Sistema

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Estado**: TanStack Query (React Query)
- **Roteamento**: React Router v6
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Tempo Real**: Supabase Realtime

### Estrutura de Pastas
```
src/
├── components/           # Componentes React organizados por funcionalidade
├── hooks/               # Custom hooks para lógica de negócio
├── pages/               # Páginas da aplicação
├── integrations/        # Configurações do Supabase
├── utils/              # Utilitários e helpers
└── types/              # Definições de tipos TypeScript
```

---

## Setup e Configuração

### 1. Variáveis de Ambiente
Verifique se as seguintes variáveis estão configuradas:
```bash
# Supabase
VITE_SUPABASE_URL=https://gtufwxxjmnxnqcgsxjah.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Inicialização
```bash
npm install
npm run dev
```

### 3. Verificação Inicial
- [ ] Aplicação carrega sem erros
- [ ] Console sem warnings críticos
- [ ] Supabase conecta corretamente

---

## Testes de Segurança

### 1. Autenticação e Autorização

#### Teste de Login
```typescript
// Testar em: /login
// Credenciais de teste:
Email: corretora@test.com
Senha: senha123

// Verificar:
✅ Login bem-sucedido redireciona para dashboard correto
✅ Credenciais inválidas mostram erro
✅ Sessão persiste após refresh
✅ Token JWT válido é gerado
```

#### Teste de Roles e Permissões
```sql
-- No SQL Editor do Supabase, verificar roles:
SELECT id, email, role, empresa_id FROM profiles;

-- Testar com usuários de diferentes roles:
-- 1. Corretora (role: 'corretora')
-- 2. Empresa (role: 'empresa')
-- 3. Admin (role: 'admin')
```

#### Verificação de RLS (Row Level Security)
```sql
-- Verificar políticas RLS ativas:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Tabelas críticas que DEVEM ter RLS:
-- ✅ empresas
-- ✅ cnpjs  
-- ✅ funcionarios
-- ✅ dados_planos
-- ✅ conversas
-- ✅ mensagens
```

### 2. Teste de Isolamento de Dados

#### Cenário de Teste: Corretora A vs Corretora B
```typescript
// 1. Login como Corretora A
// Navegar para: /corretora/empresas
// Verificar: Só vê empresas da sua carteira

// 2. Login como Corretora B  
// Navegar para: /corretora/empresas
// Verificar: Não vê dados da Corretora A

// 3. Tentar acessar dados via API diretamente:
// Deve retornar erro 403 ou dados vazios
```

#### Teste de SQL Injection
```sql
-- Tentar injeções SQL comuns nos campos de busca:
'; DROP TABLE empresas; --
' OR '1'='1
<script>alert('XSS')</script>

-- Sistema deve escapar corretamente todos os inputs
```

---

## Testes de Funcionalidade

### 1. Gestão de Empresas

#### CRUD Completo
```typescript
// Navegar para: /corretora/empresas

// CREATE - Adicionar Nova Empresa
// ✅ Formulário valida campos obrigatórios
// ✅ CNPJ é validado
// ✅ Email é validado
// ✅ Empresa aparece na listagem após criação

// READ - Listar Empresas
// ✅ Paginação funciona
// ✅ Busca por nome funciona
// ✅ Filtros aplicam corretamente
// ✅ Métricas são calculadas corretamente

// UPDATE - Editar Empresa
// ✅ Dados são pré-preenchidos
// ✅ Validações aplicam na edição
// ✅ Mudanças são salvas corretamente

// DELETE - Excluir Empresa
// ✅ Confirmação é solicitada
// ✅ Cleanup de dados relacionados
// ✅ Empresa removida da listagem
```

### 2. Gestão de CNPJs

#### Testes por Empresa
```typescript
// Navegar para: /empresa/cnpjs

// Adicionar CNPJ
// ✅ Validação de formato CNPJ
// ✅ Verificação de duplicatas
// ✅ Status inicial 'configuracao'

// Configurar Planos
// ✅ Plano de Vida obrigatório
// ✅ Plano de Saúde opcional
// ✅ Validação de valores
// ✅ Status muda para 'ativo' após configuração
```

### 3. Gestão de Funcionários

#### Fluxo Completo de Funcionário
```typescript
// Cenário: Do cadastro ao arquivamento

// 1. INCLUSÃO
// Navegar para: /empresa/funcionarios
// ✅ Formulário de cadastro completo
// ✅ Validação de CPF
// ✅ Status inicial 'pendente'
// ✅ Funcionário aparece na lista de pendentes

// 2. ATIVAÇÃO (Corretora)
// Login como corretora
// Navegar para: /corretora/ativar-funcionario
// ✅ Lista funcionários pendentes
// ✅ Ativação em massa funciona
// ✅ Status muda para 'ativo'

// 3. SOLICITAÇÃO DE EXCLUSÃO (Empresa)
// ✅ Botão de solicitação funciona
// ✅ Status muda para 'exclusao_solicitada'
// ✅ Motivo é obrigatório

// 4. APROVAÇÃO DE EXCLUSÃO (Corretora)
// ✅ Lista exclusões pendentes
// ✅ Pode aprovar ou negar
// ✅ Status final 'arquivado' ou volta para 'ativo'
```

### 4. Planos de Seguro

#### Planos de Vida
```typescript
// Navegar para: /corretora/seguros-vida

// ✅ Listagem por empresas
// ✅ Configuração de valores e coberturas
// ✅ Cálculo automático de custos
// ✅ Histórico de alterações
```

#### Planos de Saúde
```typescript
// Navegar para: /corretora/planos-saude

// ✅ Faixas etárias configuráveis
// ✅ Valores por faixa
// ✅ Cálculo automático baseado na idade dos funcionários
// ✅ Demonstrativos mensais
```

---

## Testes de Integração

### 1. Sistema de Chat

#### Teste de Conversa Empresa-Corretora
```typescript
// 1. Login como Empresa
// ✅ Widget de chat visível
// ✅ Inicia conversa automaticamente
// ✅ Mensagens são enviadas
// ✅ Status de lida funciona

// 2. Login como Corretora
// ✅ Notificações de mensagens novas
// ✅ Lista de conversas atualiza em tempo real
// ✅ Pode responder mensagens
// ✅ Badge de não lidas correto
```

#### Teste de Tempo Real
```typescript
// Com dois navegadores/abas:
// ✅ Mensagem enviada aparece instantaneamente
// ✅ Status de lida atualiza em tempo real
// ✅ Contador de não lidas sincroniza
```

### 2. Upload de Documentos

#### Teste de Storage
```typescript
// Testar uploads em:
// - Logo da empresa (/perfil)
// - Anexos em mensagens
// - Documentos de planos

// ✅ Upload funciona
// ✅ Validação de tipos de arquivo
// ✅ Limite de tamanho respeitado
// ✅ URLs assinadas para acesso seguro
```

### 3. Relatórios

#### Relatórios Financeiros
```typescript
// Navegar para: /corretora/relatorios/financeiro

// ✅ Filtros de data funcionam
// ✅ Cálculos estão corretos
// ✅ Gráficos renderizam corretamente
// ✅ Export funciona (se implementado)
```

#### Relatórios de Funcionários
```typescript
// ✅ Filtros por status, empresa, período
// ✅ Paginação em relatórios grandes
// ✅ Dados consistentes com dashboard
```

---

## Testes de Performance

### 1. Carregamento de Dashboard

#### Métricas Aceitáveis
```typescript
// Corretora Dashboard
// ✅ Carregamento inicial < 3s
// ✅ Métricas carregam < 2s
// ✅ Gráficos renderizam < 1s

// Empresa Dashboard  
// ✅ Carregamento < 2s
// ✅ Dados específicos da empresa < 1s
```

### 2. Listagens Grandes

#### Teste com Volume
```sql
-- Criar dados de teste:
INSERT INTO funcionarios (nome, cpf, cnpj_id, status)
SELECT 
  'Funcionário ' || i,
  lpad(i::text, 11, '0'),
  (SELECT id FROM cnpjs LIMIT 1),
  'ativo'
FROM generate_series(1, 1000) i;
```

```typescript
// Verificar:
// ✅ Paginação funciona com 1000+ registros
// ✅ Busca não trava interface
// ✅ Filtros aplicam rapidamente
```

### 3. Queries do Banco

#### Planos de Execução
```sql
-- Verificar queries lentas:
EXPLAIN ANALYZE SELECT * FROM get_empresas_com_metricas();
EXPLAIN ANALYZE SELECT * FROM get_corretora_dashboard_metrics();

-- Verificar índices necessários:
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

---

## Verificação de Saúde do Sistema

### 1. Monitoramento de Erros

#### Console do Navegador
```typescript
// Verificar se há:
// ❌ Erros JavaScript
// ❌ Warnings de React
// ❌ Requests falhando
// ❌ Memory leaks
```

#### Logs do Supabase
```sql
-- Verificar logs de erro na aba Analytics:
-- ✅ Sem erros de RLS
-- ✅ Sem queries com timeout
-- ✅ Sem violações de constraint
```

### 2. Conectividade

#### Teste de Rede
```typescript
// Simular conexão lenta/instável:
// ✅ Loading states funcionam
// ✅ Retry automático funciona
// ✅ Mensagens de erro apropriadas
```

### 3. Estados da Aplicação

#### Estados de Loading
```typescript
// Verificar em todas as telas:
// ✅ Skeleton loaders aparecem
// ✅ Spinners durante operações
// ✅ Estados vazios bem definidos
```

#### Estados de Erro
```typescript
// ✅ Mensagens de erro claras
// ✅ Botões de retry funcionam
// ✅ Fallbacks apropriados
```

---

## Troubleshooting

### Problemas Comuns

#### 1. Dados Não Aparecem
```sql
-- Verificar RLS:
SELECT auth.uid(); -- Deve retornar UUID do usuário
SELECT * FROM profiles WHERE id = auth.uid();

-- Verificar se usuário tem role correto
-- Verificar se empresa_id está setado (para empresas)
```

#### 2. Erros de Permissão
```sql
-- Verificar políticas RLS da tabela:
\d+ nome_da_tabela

-- Testar política manualmente:
SELECT * FROM tabela WHERE condicao_da_politica;
```

#### 3. Chat Não Funciona
```typescript
// Verificar WebSocket:
// 1. Network tab > WS > Ver se conecta
// 2. Verificar se realtime está habilitado no Supabase
// 3. Verificar permissões nas tabelas de chat
```

#### 4. Upload Falha
```sql
-- Verificar storage policies:
SELECT * FROM storage.objects WHERE bucket_id = 'nome_do_bucket';

-- Verificar permissões de storage:
-- Authentication > Policies > Storage
```

### Comandos Úteis

#### Reset de Dados de Teste
```sql
-- CUIDADO: Só usar em ambiente de desenvolvimento
DELETE FROM mensagens;
DELETE FROM conversas; 
DELETE FROM funcionarios;
DELETE FROM dados_planos;
DELETE FROM cnpjs;
DELETE FROM empresas WHERE id != 'id_da_empresa_principal';
```

#### Verificação de Integridade
```sql
-- Verificar consistência dos dados:
SELECT 
  e.nome,
  COUNT(c.id) as cnpjs,
  COUNT(f.id) as funcionarios,
  COUNT(dp.id) as planos
FROM empresas e
LEFT JOIN cnpjs c ON c.empresa_id = e.id
LEFT JOIN funcionarios f ON f.cnpj_id = c.id  
LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
GROUP BY e.id, e.nome;
```

---

## Checklist Final de Testes

### Segurança ✅
- [ ] Autenticação funciona
- [ ] RLS protege dados
- [ ] Roles são respeitados
- [ ] Inputs são sanitizados

### Funcionalidade ✅  
- [ ] CRUD de empresas
- [ ] CRUD de funcionários
- [ ] Gestão de planos
- [ ] Sistema de aprovações

### Integração ✅
- [ ] Chat tempo real
- [ ] Upload de arquivos
- [ ] Relatórios precisos
- [ ] Sincronização de dados

### Performance ✅
- [ ] Carregamento rápido
- [ ] Queries otimizadas
- [ ] Interface responsiva
- [ ] Estados de loading

### UX/UI ✅
- [ ] Design consistente
- [ ] Estados de erro
- [ ] Feedback visual
- [ ] Navegação intuitiva

---

## Contatos e Recursos

- **Documentação Supabase**: https://supabase.com/docs
- **React Query**: https://tanstack.com/query
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

---

*Manual atualizado em: Janeiro 2025*
*Versão do Sistema: 2.0*