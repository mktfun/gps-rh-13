
import React from 'react';
import { AlertTriangle, Clock, UserX, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlanoAlertasProps {
  funcionarios: any[];
  plano: any;
}

export const PlanoAlertas: React.FC<PlanoAlertasProps> = ({ funcionarios, plano }) => {
  const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente');
  const funcionariosExclusaoSolicitada = funcionarios.filter(f => f.status === 'exclusao_solicitada');
  const funcionariosInativos = funcionarios.filter(f => f.status === 'desativado');
  
  // Calcular tendências (simulado - pode ser expandido com dados reais)
  const crescimentoMensal = ((funcionarios.length - funcionariosInativos.length) / funcionarios.length) * 100;
  const alertas = [];

  // Alertas críticos
  if (funcionariosPendentes.length > 0) {
    alertas.push({
      tipo: 'critico',
      icone: Clock,
      titulo: 'Funcionários Pendentes',
      descricao: `${funcionariosPendentes.length} funcionário(s) aguardando ativação`,
      cor: 'border-red-500 bg-red-50',
      badge: 'destructive'
    });
  }

  if (funcionariosExclusaoSolicitada.length > 0) {
    alertas.push({
      tipo: 'critico',
      icone: UserX,
      titulo: 'Exclusões Solicitadas',
      descricao: `${funcionariosExclusaoSolicitada.length} funcionário(s) com exclusão solicitada`,
      cor: 'border-orange-500 bg-orange-50',
      badge: 'secondary'
    });
  }

  // Alertas de performance
  if (crescimentoMensal < 0) {
    alertas.push({
      tipo: 'aviso',
      icone: TrendingDown,
      titulo: 'Redução na Carteira',
      descricao: `Redução de ${Math.abs(crescimentoMensal).toFixed(1)}% na carteira`,
      cor: 'border-yellow-500 bg-yellow-50',
      badge: 'secondary'
    });
  }

  if (alertas.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">Tudo em Ordem</h3>
              <p className="text-sm text-green-600">Não há alertas críticos para este plano</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h3 className="font-semibold text-red-700">Alertas Críticos</h3>
      </div>
      
      {alertas.map((alerta, index) => (
        <Alert key={index} className={alerta.cor}>
          <alerta.icone className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{alerta.titulo}</span>
                <p className="text-sm mt-1">{alerta.descricao}</p>
              </div>
              <Badge variant={alerta.badge as any} className="ml-2">
                {alerta.tipo === 'critico' ? 'Crítico' : 'Aviso'}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
