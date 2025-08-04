
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LucideIcon, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionPriorityCardProps {
  title: string;
  count: number;
  description: string;
  icon: LucideIcon;
  to: string;
  state?: any;
  priority?: 'high' | 'medium' | 'low';
}

const ActionPriorityCard = ({
  title,
  count,
  description,
  icon: Icon,
  to,
  state,
  priority = 'medium'
}: ActionPriorityCardProps) => {
  const priorityColors = {
    high: 'border-red-200 bg-red-50 hover:bg-red-100',
    medium: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
    low: 'border-blue-200 bg-blue-50 hover:bg-blue-100'
  };

  const badgeColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  if (count === 0) {
    return (
      <Card className="opacity-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">0</div>
          <p className="text-xs text-muted-foreground mt-1">
            Nenhuma ação necessária
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to={to} state={state} className="block">
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer border-2",
        priorityColors[priority]
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          <Badge variant="outline" className={badgeColors[priority]}>
            {count}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{count}</div>
          <p className="text-xs text-muted-foreground mb-3">
            {description}
          </p>
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-3 w-3 mr-2" />
            Ver Detalhes
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ActionPriorityCard;
