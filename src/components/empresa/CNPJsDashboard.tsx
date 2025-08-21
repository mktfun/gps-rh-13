import React from 'react';
import { Building2, Users, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CnpjComPlano } from '@/hooks/useCnpjsComPlanos';

interface CNPJsDashboardProps {
  cnpjs: CnpjComPlano[];
}

export const CNPJsDashboard: React.FC<CNPJsDashboardProps> = ({ cnpjs }) => {
  // Calcular métricas
  const totalCnpjs = cnpjs.length;
  const cnpjsAtivos = cnpjs.filter(c => c.status === 'ativo').length;
  const cnpjsComPlano = cnpjs.filter(c => c.temPlano).length;
  const cnpjsComPendencias = cnpjs.filter(c => c.totalPendencias > 0).length;
  
  const totalFuncionarios = cnpjs.reduce((acc, c) => acc + c.totalFuncionarios, 0);
  const totalFuncionariosAtivos = cnpjs.reduce((acc, c) => acc + c.funcionariosAtivos, 0);
  const totalPendencias = cnpjs.reduce((acc, c) => acc + c.totalPendencias, 0);
  
  const valorMensalTotal = cnpjs.reduce((acc, c) => acc + (c.valor_mensal || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total de CNPJs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de CNPJs</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCnpjs}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="default" className="text-xs">
              {cnpjsAtivos} ativos
            </Badge>
            {totalCnpjs > cnpjsAtivos && (
              <Badge variant="secondary" className="text-xs">
                {totalCnpjs - cnpjsAtivos} inativos
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CNPJs com Plano */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CNPJs com Plano</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cnpjsComPlano}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-sm text-muted-foreground">
              {getPercentage(cnpjsComPlano, totalCnpjs)}% do total
            </div>
            {cnpjsComPlano > 0 && (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                Coberto
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total de Funcionários */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFuncionarios}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              {totalFuncionariosAtivos} ativos
            </Badge>
            {totalFuncionarios > totalFuncionariosAtivos && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                {totalFuncionarios - totalFuncionariosAtivos} pendentes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Valor Mensal Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Mensal Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(valorMensalTotal)}</div>
          <div className="flex items-center gap-2 mt-2">
            {cnpjsComPlano > 0 && (
              <div className="text-sm text-muted-foreground">
                {formatCurrency(valorMensalTotal / cnpjsComPlano)} por CNPJ
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertas e Pendências - Card que ocupa 2 colunas */}
      {(totalPendencias > 0 || cnpjsComPendencias > 0) && (
        <div className="md:col-span-2 lg:col-span-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Atenção Necessária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-yellow-700">CNPJs com Pendências</div>
                  <div className="text-2xl font-bold text-yellow-800">{cnpjsComPendencias}</div>
                  <div className="text-xs text-yellow-600">
                    {getPercentage(cnpjsComPendencias, totalCnpjs)}% do total
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-yellow-700">Total de Pendências</div>
                  <div className="text-2xl font-bold text-yellow-800">{totalPendencias}</div>
                  <div className="text-xs text-yellow-600">
                    Requerem regularização
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-yellow-700">CNPJs sem Plano</div>
                  <div className="text-2xl font-bold text-yellow-800">{totalCnpjs - cnpjsComPlano}</div>
                  <div className="text-xs text-yellow-600">
                    Precisam de configuração
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status dos CNPJs - Card informativo quando tudo está ok */}
      {totalPendencias === 0 && cnpjsComPendencias === 0 && totalCnpjs > 0 && (
        <div className="md:col-span-2 lg:col-span-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Situação Regular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-green-700">
                Todos os CNPJs estão em situação regular, sem pendências identificadas.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
