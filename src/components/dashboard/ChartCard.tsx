
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const ChartCard = ({ title, description, children }: ChartCardProps) => {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-gray-600 text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
