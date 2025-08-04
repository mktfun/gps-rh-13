
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, UserCheck, Clock } from 'lucide-react';

interface PlanoResumoCardProps {
  plano: {
    total_funcionarios: number;
    funcionarios_ativos: number;
    funcionarios_pendentes: number;
    valor_mensal: number;
  };
}

export const PlanoResumoCard: React.FC<PlanoResumoCardProps> = ({ plano }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const custoTotal = plano.valor_mensal;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Resumo do Plano
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Primeira coluna */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total de Funcionários</span>
              </div>
              <span className="text-lg font-bold">{plano.total_funcionarios}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ativos</span>
              </div>
              <Badge variant="default" className="font-semibold">
                {plano.funcionarios_ativos}
              </Badge>
            </div>
          </div>

          {/* Segunda coluna */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Pendentes</span>
              </div>
              {plano.funcionarios_pendentes > 0 ? (
                <Badge variant="outline" className="font-semibold">
                  {plano.funcionarios_pendentes}
                </Badge>
              ) : (
                <span className="text-lg font-bold text-muted-foreground">0</span>
              )}
            </div>

            <div className="pt-2 border-t">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">Custo Mensal</div>
                <div className="text-xl font-bold">{formatCurrency(custoTotal)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
