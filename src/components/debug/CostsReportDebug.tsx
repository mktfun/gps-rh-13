import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CostsReportDebugProps {
  data: any;
  title: string;
}

export const CostsReportDebug = ({ data, title }: CostsReportDebugProps) => {
  if (!data) return null;

  const getDataType = (value: any) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (typeof value === 'object') return 'object';
    return typeof value;
  };

  const renderValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          🐛 Debug: {title}
          <Badge variant="outline" className="text-xs">
            {getDataType(data)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs overflow-auto max-h-64 bg-white p-2 rounded border">
          {renderValue(data)}
        </pre>
      </CardContent>
    </Card>
  );
};
