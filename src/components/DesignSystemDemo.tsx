
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function DesignSystemDemo() {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold corporate-heading">GPS V2.0 - Design System</h1>
        <p className="text-lg corporate-text">Sistema de Gestão de Seguros Corporativos</p>
        <p className="corporate-text-muted">Demonstração da identidade visual RH/Enterprise</p>
      </div>

      {/* Color Palette */}
      <Card className="corporate-shadow">
        <CardHeader>
          <CardTitle className="corporate-heading">Paleta de Cores Corporativas</CardTitle>
          <CardDescription>Cores principais do sistema GPS V2.0</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-corporate-blue rounded-lg mx-auto corporate-shadow"></div>
              <p className="text-sm font-medium">Azul Corporativo</p>
              <p className="text-xs corporate-text-muted">Primária</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-corporate-green rounded-lg mx-auto corporate-shadow"></div>
              <p className="text-sm font-medium">Verde Sucesso</p>
              <p className="text-xs corporate-text-muted">Secundária</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-corporate-orange rounded-lg mx-auto corporate-shadow"></div>
              <p className="text-sm font-medium">Laranja Alerta</p>
              <p className="text-xs corporate-text-muted">Terciária</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card className="corporate-shadow">
        <CardHeader>
          <CardTitle className="corporate-heading">Componentes de Botão</CardTitle>
          <CardDescription>Variantes corporativas do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="info">Botão Primário</Button>
            <Button variant="success">Sucesso</Button>
            <Button variant="warning">Alerta</Button>
            <Button variant="corporate">Corporativo</Button>
            <Button variant="outline-primary">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="info" size="sm">Pequeno</Button>
            <Button variant="success" size="default">Padrão</Button>
            <Button variant="warning" size="lg">Grande</Button>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="corporate-shadow">
        <CardHeader>
          <CardTitle className="corporate-heading">Tipografia</CardTitle>
          <CardDescription>Hierarquia de texto do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl corporate-heading">Título Principal (H1)</h1>
            <h2 className="text-2xl corporate-subheading">Subtítulo (H2)</h2>
            <h3 className="text-xl corporate-subheading">Seção (H3)</h3>
            <p className="corporate-text">Texto padrão do sistema. Esta é a tipografia principal para conteúdo.</p>
            <p className="corporate-text-muted">Texto secundário ou complementar, usado para informações auxiliares.</p>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="corporate-shadow">
        <CardHeader>
          <CardTitle className="corporate-heading">Status e Badges</CardTitle>
          <CardDescription>Indicadores visuais de estado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Ativo</Badge>
            <Badge variant="secondary">Pendente</Badge>
            <Badge variant="destructive">Inativo</Badge>
            <Badge variant="outline">Arquivado</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Gradient Examples */}
      <Card className="corporate-shadow">
        <CardHeader>
          <CardTitle className="corporate-heading">Gradientes Corporativos</CardTitle>
          <CardDescription>Elementos visuais com gradientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-corporate-gradient rounded-lg flex items-center justify-center">
              <p className="text-white font-medium">Gradiente Principal</p>
            </div>
            <div className="h-24 bg-corporate-gradient-subtle rounded-lg flex items-center justify-center">
              <p className="text-corporate-blue font-medium">Gradiente Sutil</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
