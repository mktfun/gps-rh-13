import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const NavigationTest = () => {
  const { role } = useAuth();

  const empresaRoutes = [
    { path: '/empresa/planos-de-saude', label: 'Planos de Saúde (Empresa)' },
    { path: '/empresa/planos-saude/exemplo-id', label: 'Detalhes Plano Saúde' },
  ];

  const corretoraRoutes = [
    { path: '/corretora/planos-de-saude/empresas', label: 'Planos de Saúde - Empresas' },
    { path: '/corretora/planos-de-saude/exemplo-empresa-id', label: 'Planos - CNPJs' },
    { path: '/corretora/planos-de-saude/exemplo-empresa/cnpj/exemplo-cnpj', label: 'Detalhes Plano' },
  ];

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">
          🧪 Teste de Navegação - Planos de Saúde
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-blue-700">
          <strong>Role atual:</strong> {role}
        </div>

        {role === 'empresa' && (
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Rotas da Empresa:</h4>
            <div className="space-y-2">
              {empresaRoutes.map((route) => (
                <Button
                  key={route.path}
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start"
                >
                  <Link to={route.path}>
                    <ExternalLink className="h-3 w-3 mr-2" />
                    {route.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        {role === 'corretora' && (
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Rotas da Corretora:</h4>
            <div className="space-y-2">
              {corretoraRoutes.map((route) => (
                <Button
                  key={route.path}
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start"
                >
                  <Link to={route.path}>
                    <ExternalLink className="h-3 w-3 mr-2" />
                    {route.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-blue-600 pt-2 border-t border-blue-200">
          <strong>Status:</strong> Todos os links acima devem funcionar corretamente
        </div>
      </CardContent>
    </Card>
  );
};
