
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CustoTotalCardProps {
  valor: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const CustoTotalCard = ({ valor, trend }: CustoTotalCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-green-800">
          Custo Mensal Total
        </CardTitle>
        <DollarSign className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-700">
          {formatCurrency(valor)}
        </div>
        <p className="text-xs text-green-600 mt-1">
          Valor total dos seguros ativos
        </p>
        {trend && (
          <div className={`text-xs flex items-center gap-1 mt-2 ${
            trend.isPositive ? 'text-red-600' : 'text-green-600'
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.isPositive ? '+' : ''}{trend.value}% em relação ao mês anterior
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustoTotalCard;
