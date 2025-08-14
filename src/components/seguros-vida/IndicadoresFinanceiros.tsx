import React from 'react';
import { DollarSign, TrendingUp, Target, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface IndicadoresFinanceirosProps {
  funcionarios: any[];
  plano: any;
}

export const IndicadoresFinanceiros: React.FC<IndicadoresFinanceirosProps> = ({ funcionarios, plano }) => {
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo');
  const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente');

  // Para planos de saúde, multiplicar por funcionários ativos
  // Para seguros de vida, usar valor fixo
  const receitaTotal = plano.tipo_seguro === 'saude'
    ? plano.valor_mensal * funcionariosAtivos.length
    : plano.valor_mensal;

  const ticketMedio = plano.valor_mensal;

  // Simulação de comissão (5% da receita total)
  const comissaoEstimada = receitaTotal * 0.05;

  const indicadores = [
    {
      titulo: 'Receita do Plano',
      valor: formatCurrency(receitaTotal),
      descricao: plano.tipo_seguro === 'saude'
        ? `${formatCurrency(plano.valor_mensal)} × ${funcionariosAtivos.length} funcionários`
        : 'Valor fixo mensal do plano',
      icone: DollarSign,
      cor: 'text-green-600',
      bgCor: 'bg-green-50'
    },
    {
      titulo: 'Funcionários Cobertos',
      valor: `${funcionariosAtivos.length}`,
      descricao: `${funcionarios.length} funcionários no total`,
      icone: Target,
      cor: 'text-blue-600',
      bgCor: 'bg-blue-50'
    },
    {
      titulo: 'Funcionários Pendentes',
      valor: `${funcionariosPendentes.length}`,
      descricao: 'Aguardando ativação no plano',
      icone: TrendingUp,
      cor: 'text-orange-600',
      bgCor: 'bg-orange-50'
    },
    {
      titulo: 'Comissão Estimada',
      valor: formatCurrency(comissaoEstimada),
      descricao: '5% da receita do plano',
      icone: Calculator,
      cor: 'text-purple-600',
      bgCor: 'bg-purple-50'
    }
  ];

  const eficiencia = funcionarios.length > 0 ? (funcionariosAtivos.length / funcionarios.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Indicadores Financeiros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {indicadores.map((indicador, index) => (
            <div key={index} className={`p-4 rounded-lg border ${indicador.bgCor}`}>
              <div className="flex items-center justify-between mb-2">
                <indicador.icone className={`h-5 w-5 ${indicador.cor}`} />
                <span className={`text-2xl font-bold ${indicador.cor}`}>
                  {indicador.valor}
                </span>
              </div>
              <h4 className="font-medium text-gray-900">{indicador.titulo}</h4>
              <p className="text-sm text-gray-600">{indicador.descricao}</p>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Eficiência da Carteira</h4>
              <p className="text-sm text-muted-foreground">
                Percentual de funcionários ativos vs. totais
              </p>
            </div>
            <div className="text-right">
              <Badge variant={eficiencia >= 90 ? 'default' : eficiencia >= 70 ? 'secondary' : 'destructive'}>
                {eficiencia.toFixed(1)}%
              </Badge>
            </div>
          </div>
          
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                eficiencia >= 90 ? 'bg-green-500' : 
                eficiencia >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${eficiencia}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
