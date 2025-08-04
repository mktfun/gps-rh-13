
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, DollarSign } from 'lucide-react';

interface RankingItem {
  id: string;
  nome: string;
  funcionarios_count: number;
  receita_mensal: number;
}

interface RankingCardProps {
  title: string;
  items: RankingItem[];
}

const RankingCard = ({ title, items }: RankingCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Trophy className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Trophy className="h-4 w-4 text-amber-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted text-xs flex items-center justify-center">{index + 1}</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma empresa encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {getRankIcon(index)}
                  <div>
                    <h4 className="font-medium">{item.nome}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {item.funcionarios_count} funcionários
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(item.receita_mensal)}/mês
                      </div>
                    </div>
                  </div>
                </div>
                <Badge variant={index < 3 ? "default" : "secondary"}>
                  #{index + 1}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingCard;
