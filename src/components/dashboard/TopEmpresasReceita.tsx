
import React from 'react';
import { useTopEmpresasReceita } from '@/hooks/useTopEmpresasReceita';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

const TopEmpresasReceita = () => {
  const { data: empresas, isLoading } = useTopEmpresasReceita();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!empresas || empresas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Top Empresas por Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhuma empresa com receita cadastrada
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Top Empresas por Receita
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {empresas.map((empresa, index) => (
            <div
              key={empresa.id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-medium">{empresa.nome}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {empresa.funcionarios_ativos} funcionários ativos
                    {empresa.pendencias > 0 && (
                      <>
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span className="text-orange-500">{empresa.pendencias} pendências</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {formatCurrency(empresa.receita_mensal)}
                </div>
                <div className="text-xs text-muted-foreground">valor do plano</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/corretora/empresas/${empresa.id}`)}
                className="ml-4"
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopEmpresasReceita;
