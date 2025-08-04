
import React from 'react';
import { AlertTriangle, Clock, FileX, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEmpresaActionsNeeded } from '@/hooks/useEmpresaActionsNeeded';
import { useNavigate } from 'react-router-dom';

const EmpresaActionsNeededSection = () => {
  const { data: actionsNeeded, isLoading } = useEmpresaActionsNeeded();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Ações Necessárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center justify-between animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!actionsNeeded) {
    return null;
  }

  const totalActions = actionsNeeded.solicitacoes_pendentes_count + actionsNeeded.funcionarios_travados_count;

  // Se não há ações necessárias, mostra um card de "tudo ok"
  if (totalActions === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-green-700">
            <Users className="h-5 w-5" />
            Tudo em Ordem!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600">
            Não há ações pendentes no momento. Todos os funcionários estão com status adequado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-orange-700">
          <AlertTriangle className="h-5 w-5" />
          Ações Necessárias
          <Badge variant="destructive" className="ml-2">
            {totalActions}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actionsNeeded.solicitacoes_pendentes_count > 0 && (
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <FileX className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    Solicitações de Exclusão Pendentes
                  </p>
                  <p className="text-sm text-gray-600">
                    {actionsNeeded.solicitacoes_pendentes_count} funcionário(s) aguardando análise da corretora
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/empresa/relatorios/pendencias')}
              >
                Ver Detalhes
              </Button>
            </div>
          )}

          {actionsNeeded.funcionarios_travados_count > 0 && (
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    Funcionários Travados
                  </p>
                  <p className="text-sm text-gray-600">
                    {actionsNeeded.funcionarios_travados_count} funcionário(s) pendente(s) há mais de 5 dias
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/empresa/funcionarios', { state: { filter: 'pendente' } })}
              >
                Verificar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmpresaActionsNeededSection;
