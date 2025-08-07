
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClickableStatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  to?: string;
  onClick?: () => void;
  className?: string;
}

const ClickableStatCard = ({
  title,
  value,
  description,
  icon: Icon,
  to,
  onClick,
  className
}: ClickableStatCardProps) => {
  const cardContent = (
    <Card className={cn(
      "hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/20",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="block">
        {cardContent}
      </div>
    );
  }

  if (to && to !== '#') {
    return (
      <Link to={to} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default ClickableStatCard;
