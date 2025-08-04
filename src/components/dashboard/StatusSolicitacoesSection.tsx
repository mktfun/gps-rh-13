
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface StatusSolicitacoesSectionProps {
  solicitacoesPendentes: number;
  funcionariosTravados: number;
}

const StatusSolicitacoesSection = ({
  solicitacoesPendentes,
  funcionariosTravados
}: StatusSolicitacoesSectionProps) => {
  const totalPendencias = solicitacoesPendentes + funcionariosTravados;

  if (totalPendencias === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Status das Suas Solicitações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-700 font-medium">
              Todas as solicitações estão em dia
            </span>
          </div>
          <p className="text-green-600 text-sm mt-1">
            Não há pendências que requerem sua atenção no momento.
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
          Status das Suas Solicitações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {solicitacoesPendentes > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-gray-900 font-medium">
                  {solicitacoesPendentes} exclusões aguardando análise da corretora
                </span>
              </div>
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                Pendente
              </Badge>
            </div>
          )}

          {funcionariosTravados > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-gray-900 font-medium">
                  {funcionariosTravados} funcionários travados há mais de 5 dias
                </span>
              </div>
              <Badge variant="outline" className="border-red-300 text-red-700">
                Atenção
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusSolicitacoesSection;
