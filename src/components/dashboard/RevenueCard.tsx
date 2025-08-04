
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';

interface RevenueCardProps {
  title: string;
  value: number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const RevenueCard = ({ title, value, description, trend }: RevenueCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          {formatCurrency(value)}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`text-xs flex items-center gap-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
            {trend.isPositive ? '+' : ''}{trend.value}% em relação ao mês anterior
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueCard;
