import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronRight, Users, AlertTriangle, Stethoscope, Shield } from 'lucide-react';
import { EmpresaComPlano } from '@/hooks/useEmpresasComPlanos';
import { DashboardLoadingState } from '@/components/ui/loading-state';

interface EmpresasCardViewProps {
  empresas: EmpresaComPlano[];
  isLoading: boolean;
  onEmpresaClick: (empresa: EmpresaComPlano) => void;
}

export const EmpresasCardView: React.FC<EmpresasCardViewProps> = ({
  empresas,
  isLoading,
  onEmpresaClick,
}) => {
  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (empresas.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Nenhuma empresa encontrada</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Não há empresas com planos ativos do tipo selecionado.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {empresas.map((empresa) => (
        <Card key={empresa.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              {empresa.nome}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan type indicator based on current page context */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Determine plan type from current URL or props */}
                {window.location.pathname.includes('planos-de-saude') ? (
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Planos de Saúde</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Seguros de Vida</span>
                  </div>
                )}
              </div>
              <Badge variant="secondary">
                {empresa.total_planos_ativos} plano(s)
              </Badge>
            </div>

            {/* Additional info placeholder - can be enhanced with real data */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Funcionários: calculando...</div>
              <div>• Pendências: verificando...</div>
            </div>

            <Button
              onClick={() => onEmpresaClick(empresa)}
              className="w-full"
              variant="outline"
            >
              Gerenciar Planos
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
