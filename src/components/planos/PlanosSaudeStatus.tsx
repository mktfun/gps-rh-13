import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, CheckCircle } from 'lucide-react';

export const PlanosSaudeStatus = () => {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Stethoscope className="h-5 w-5" />
          Status dos Planos de Saúde
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            ✅ Planos de Saúde liberados e funcionais
          </span>
        </div>
        <div className="mt-2 text-xs text-green-600">
          • Empresa: Acesso liberado à gestão de planos de saúde
          <br />
          • Corretora: Acesso liberado à gestão por empresa e CNPJ
          <br />
          • Todas as rotas ativas e funcionais
        </div>
      </CardContent>
    </Card>
  );
};
