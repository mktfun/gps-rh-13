
import React from 'react';
import { useCorretoraDashboardActionsDetailed } from '@/hooks/useCorretoraDashboardActionsDetailed';
import { Clock, UserPlus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const ActionsNeededSection = () => {
  const { data: actions, isLoading } = useCorretoraDashboardActionsDetailed();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!actions || (
    actions.pendencias_exclusao.length === 0 && 
    actions.novos_funcionarios.length === 0 && 
    actions.configuracao_pendente.length === 0
  )) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma ação necessária no momento! 🎉</p>
      </div>
    );
  }

  const handleNavigateToEmployees = (empresaId: string, filtroStatus: string) => {
    navigate(`/corretora/empresas/${empresaId}?filtroStatus=${filtroStatus}`);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {actions.pendencias_exclusao.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Pendências de Exclusão</CardTitle>
            </div>
            <CardDescription>
              {actions.pendencias_exclusao.reduce((sum, item) => sum + item.count, 0)} funcionários aguardando aprovação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {actions.pendencias_exclusao.map((item) => (
              <div key={item.empresa_id} className="flex items-center justify-between">
                <span className="text-sm">{item.empresa_nome}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{item.count}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleNavigateToEmployees(item.empresa_id, 'exclusao_solicitada')}
                  >
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {actions.novos_funcionarios.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Novos Funcionários</CardTitle>
            </div>
            <CardDescription>
              {actions.novos_funcionarios.reduce((sum, item) => sum + item.count, 0)} funcionários pendentes de ativação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {actions.novos_funcionarios.map((item) => (
              <div key={item.empresa_id} className="flex items-center justify-between">
                <span className="text-sm">{item.empresa_nome}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{item.count}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleNavigateToEmployees(item.empresa_id, 'pendente')}
                  >
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {actions.configuracao_pendente.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Configuração Pendente</CardTitle>
            </div>
            <CardDescription>
              {actions.configuracao_pendente.reduce((sum, item) => sum + item.count, 0)} CNPJs em configuração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {actions.configuracao_pendente.map((item) => (
              <div key={item.empresa_id} className="flex items-center justify-between">
                <span className="text-sm">{item.empresa_nome}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.count}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/corretora/empresas/${item.empresa_id}`)}
                  >
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActionsNeededSection;
