
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronRight, Users } from 'lucide-react';
import { EmpresaComPlano } from '@/hooks/useEmpresasComPlanos';
import { DashboardLoadingState } from '@/components/ui/loading-state';

interface EmpresasListViewProps {
  empresas: EmpresaComPlano[];
  isLoading: boolean;
  onEmpresaClick: (empresa: EmpresaComPlano) => void;
}

export const EmpresasListView: React.FC<EmpresasListViewProps> = ({
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
    <div className="space-y-4">
      {empresas.map((empresa) => (
        <div
          key={empresa.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div>
              <h3 className="font-medium">{empresa.nome}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {empresa.total_planos_ativos} planos ativos
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {empresa.total_planos_ativos} planos
            </Badge>
            <Button 
              onClick={() => onEmpresaClick(empresa)}
              variant="outline"
              size="sm"
            >
              Gerenciar
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
