
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  to: string;
  variant?: 'default' | 'warning' | 'urgent';
}

const ActionCard = ({
  title,
  value,
  description,
  icon: Icon,
  to,
  variant = 'default'
}: ActionCardProps) => {
  const variantStyles = {
    default: "border-blue-200 hover:border-blue-300 bg-blue-50/50 hover:bg-blue-100/50",
    warning: "border-orange-200 hover:border-orange-300 bg-orange-50/50 hover:bg-orange-100/50",
    urgent: "border-red-200 hover:border-red-300 bg-red-50/50 hover:bg-red-100/50"
  };

  const iconColors = {
    default: "text-blue-600",
    warning: "text-orange-600", 
    urgent: "text-red-600"
  };

  const valueColors = {
    default: "text-blue-900",
    warning: "text-orange-900",
    urgent: "text-red-900"
  };

  return (
    <Link to={to} className="block">
      <Card className={cn(
        "hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-2",
        variantStyles[variant]
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            {title}
          </CardTitle>
          <Icon className={cn("h-5 w-5", iconColors[variant])} />
        </CardHeader>
        <CardContent>
          <div className={cn("text-3xl font-bold mb-1", valueColors[variant])}>
            {value}
          </div>
          <p className="text-xs text-gray-600">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ActionCard;
