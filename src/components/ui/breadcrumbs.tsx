
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      <Link 
        to="/" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4" />
          {item.href && index < items.length - 1 ? (
            <Link 
              to={item.href}
              className="flex items-center hover:text-foreground transition-colors"
            >
              {item.icon && <item.icon className="h-4 w-4 mr-1" />}
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              "flex items-center",
              index === items.length - 1 && "text-foreground font-medium"
            )}>
              {item.icon && <item.icon className="h-4 w-4 mr-1" />}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
