
# BRIEFING DE IDENTIDADE VISUAL - Sistema GPS

Baseado no Header atual do sistema e nos padrões estabelecidos, este documento define os padrões de design que devem ser replicados consistentemente em toda a aplicação.

## 1. PALETA DE CORES

### Cores Primárias do Sistema
- **Primary**: `hsl(217 91% 40%)` - Azul corporativo profissional
- **Secondary**: `hsl(142 72% 29%)` - Verde sucesso para ações positivas  
- **Tertiary**: `hsl(25 95% 53%)` - Laranja para alertas e chamadas de atenção

### Cores Estruturais
- **Background**: `hsl(0 0% 100%)` - Fundo principal da aplicação
- **Card**: `hsl(0 0% 100%)` - Fundo de cards e componentes
- **Border**: `hsl(214.3 31.8% 91.4%)` - Bordas padrão
- **Muted**: `hsl(210 40% 96.1%)` - Fundos suaves
- **Muted Foreground**: `hsl(215.4 16.3% 46.9%)` - Textos secundários

### Cores Corporativas Estendidas
- **Corporate Blue**: `hsl(217 91% 40%)` + variante light `hsl(217 91% 85%)`
- **Corporate Green**: `hsl(142 72% 29%)` + variante light `hsl(142 72% 85%)`
- **Corporate Orange**: `hsl(25 95% 53%)` + variante light `hsl(25 95% 85%)`

## 2. TIPOGRAFIA

### Fonte Principal
- **Família**: Inter (sistema: `['Inter', 'system-ui', 'sans-serif']`)
- **Classes Tailwind**: `font-inter` ou `font-sans`

### Hierarquia Tipográfica do Header
- **Título do Sistema**: `text-xl font-semibold` (20px, semi-bold)
- **Texto de Boas-vindas**: `text-sm` (14px, regular)
- **Nome do Usuário**: `font-medium` (14px, medium)
- **Badge de Role**: `text-xs` (12px, regular)

### Tipografia Corporativa
- **Corporate Heading**: `.corporate-heading` - `text-corporate-gray-900 font-semibold`
- **Corporate Subheading**: `.corporate-subheading` - `text-corporate-gray-700 font-medium`
- **Corporate Text**: `.corporate-text` - `text-corporate-gray-600`

## 3. ESTRUTURA DO HEADER

### Dimensões e Layout
- **Altura**: `h-16` (64px)
- **Padding Horizontal**: `px-6` (24px nas laterais)
- **Layout**: `flex items-center justify-between`

### Estilo Visual
- **Background**: `bg-card` (branco no tema claro)
- **Borda**: `border-b border-border` (borda inferior sutil)
- **Não usa efeito liquid glass** - mantém simplicidade

### Estrutura Interna
```
Header
├── Lado Esquerdo (flex items-center gap-4)
│   ├── Botão Menu (Button variant="ghost" size="icon")
│   └── Título do Sistema (h1 text-xl font-semibold)
└── Lado Direito (flex items-center gap-4)
    ├── Área de Boas-vindas (text-sm)
    │   ├── Texto "Bem-vindo," (text-muted-foreground)
    │   ├── Email do Usuário (font-medium)
    │   └── Badge de Role (bg-primary/10 text-primary)
    └── Botão Sair (Button variant="outline" size="sm")
```

## 4. PADRÕES DE COMPONENTES

### Botões do Header
- **Menu**: `variant="ghost" size="icon"` com ícone `Menu` (h-5 w-5)
- **Sair**: `variant="outline" size="sm"` com ícone `LogOut` (h-4 w-4 mr-2)

### Badge de Role
- **Estilo**: `bg-primary/10 text-primary px-2 py-1 rounded-full`
- **Tipografia**: `text-xs`
- **Posicionamento**: `ml-2` após o email do usuário

### Ícones
- **Biblioteca**: Lucide React
- **Tamanhos**: 
  - Header buttons: `h-5 w-5` (menu)
  - Action buttons: `h-4 w-4` (logout)
- **Posicionamento**: `mr-2` para ícones em botões com texto

## 5. SHADOWS E EFEITOS

### Sistema de Sombras Corporativas
- **Corporate Shadow**: `.corporate-shadow` - sombra sutil para elementos
- **Corporate Shadow Large**: `.corporate-shadow-lg` - sombra mais pronunciada

### Gradientes Corporativos
- **Corporate Gradient**: `.corporate-gradient` - gradiente azul para verde
- **Corporate Gradient Subtle**: `.corporate-gradient-subtle` - versão suave

### Transições
- **Padrão**: `transition-colors` para mudanças de cor
- **Duração**: `duration-200` para animações rápidas

## 6. PADRÕES DE INTERAÇÃO

### Estados de Hover
- **Botões Ghost**: `hover:bg-accent hover:text-accent-foreground`
- **Botões Outline**: `hover:bg-accent hover:text-accent-foreground`

### Estados de Foco
- **Ring**: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Outline**: `focus-visible:outline-none`

### Estados Disabled
- **Pointer Events**: `disabled:pointer-events-none`
- **Opacity**: `disabled:opacity-50`

## 7. RESPONSIVIDADE

### Breakpoints
- **Mobile First**: Design pensado para mobile primeiro
- **MD Breakpoint**: `md:` para telas médias (768px+)
- **2XL Container**: Máximo de 1400px

### Comportamentos Responsivos
- **Sidebar**: `hidden md:block` - oculta em mobile
- **Textos**: Manter legibilidade em todas as telas
- **Botões**: Tamanhos adequados para touch

## 8. REGRAS DE IMPLEMENTAÇÃO

### Obrigatório
1. **Sempre usar as variáveis CSS HSL** definidas no index.css
2. **Manter a hierarquia de cores** (primary, secondary, tertiary)
3. **Usar componentes shadcn/ui** como base
4. **Aplicar corporate-shadow** em elementos elevados
5. **Seguir a tipografia Inter** em toda a aplicação

### Proibido
1. **Cores hardcoded** em hex ou rgb
2. **Fontes diferentes** da Inter
3. **Sombras customizadas** fora do padrão corporativo
4. **Hover states** inconsistentes
5. **Quebrar a hierarquia** estabelecida de espaçamentos

## 9. EXAMPLES DE APLICAÇÃO

### Header Completo
```jsx
<header className="border-b border-border bg-card">
  <div className="flex h-16 items-center justify-between px-6">
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon">
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-xl font-semibold">Sistema GPS</h1>
    </div>
    
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <span className="text-muted-foreground">Bem-vindo, </span>
        <span className="font-medium">{user?.email}</span>
        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {role}
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </div>
  </div>
</header>
```

### Card com Padrão Corporativo
```jsx
<div className="bg-card border border-border rounded-lg corporate-shadow p-6">
  <h2 className="text-xl font-semibold corporate-heading">Título</h2>
  <p className="text-sm corporate-text mt-2">Conteúdo</p>
</div>
```

### Botões Corporativos
```jsx
{/* Botão Principal */}
<Button variant="corporate" className="corporate-shadow">
  Ação Principal
</Button>

{/* Botão Secundário */}
<Button variant="success" className="corporate-shadow">
  Salvar
</Button>

{/* Botão de Alerta */}
<Button variant="warning" className="corporate-shadow">
  Atenção
</Button>

{/* Botão Outline */}
<Button variant="outline-primary">
  Ação Secundária
</Button>
```

### Tabela com Padrão Corporativo
```jsx
<div className="border rounded-lg corporate-shadow">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="corporate-subheading">Coluna</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="hover:bg-muted/50">
        <TableCell className="corporate-text">Dados</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

## 10. ESTADOS E FEEDBACK

### Loading States
- **Skeleton**: `bg-muted animate-pulse rounded`
- **Spinner**: Usar componentes de loading do shadcn/ui
- **Shimmer**: Para placeholders de conteúdo

### Estados Vazios
- **Ilustração**: Ícones Lucide React com `h-12 w-12`
- **Texto**: `text-muted-foreground`
- **Ação**: Botão principal para criar/adicionar

### Notificações
- **Toast Success**: Variante success com ícone CheckCircle
- **Toast Error**: Variante destructive com ícone AlertCircle
- **Toast Info**: Variante default com ícone Info

---

**Este briefing serve como fonte única da verdade para a identidade visual do Sistema GPS. Qualquer desvio destes padrões deve ser justificado e documentado.**
