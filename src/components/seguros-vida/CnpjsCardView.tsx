
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Users, Upload, ArrowRight } from 'lucide-react';
import { CnpjStatusBadges } from './CnpjStatusBadges';

interface CnpjsCardViewProps {
  cnpjs: any[];
  isLoading: boolean;
  onCnpjClick: (cnpj: any) => void;
  onImportClick: (cnpj: any) => void;
}

export const CnpjsCardView: React.FC<CnpjsCardViewProps> = ({
  cnpjs,
  isLoading,
  onCnpjClick,
  onImportClick
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-64">
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (cnpjs.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhuma empresa encontrada</h3>
        <p className="text-muted-foreground">
          Nenhuma empresa corresponde aos critérios de busca.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cnpjs.map((cnpj) => (
        <Card key={cnpj.id} className="hover:shadow-lg transition-all duration-200 group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                  {cnpj.razao_social}
                </CardTitle>
                <p className="text-sm text-muted-foreground font-mono">
                  {cnpj.cnpj}
                </p>
              </div>
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{cnpj.totalFuncionarios || 0} funcionários</span>
            </div>

            <CnpjStatusBadges 
              temPlano={cnpj.temPlano}
              funcionariosAtivos={cnpj.totalFuncionarios || 0}
              totalFuncionarios={cnpj.totalFuncionarios || 0}
              totalPendencias={cnpj.totalPendencias}
              funcionariosPendentes={cnpj.funcionariosPendentes}
              funcionariosExclusaoSolicitada={cnpj.funcionariosExclusaoSolicitada}
            />

            {cnpj.seguradora && (
              <div className="text-sm">
                <span className="text-muted-foreground">Seguradora: </span>
                <span className="font-medium">{cnpj.seguradora}</span>
              </div>
            )}

            {cnpj.valor_mensal && (
              <div className="text-sm">
                <span className="text-muted-foreground">Valor mensal: </span>
                <span className="font-medium text-green-600">
                  R$ {cnpj.valor_mensal.toFixed(2)}
                </span>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-4 space-y-2">
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onImportClick(cnpj);
                }}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onCnpjClick(cnpj);
                }}
                size="sm"
                className="flex-1"
              >
                <span>Gerenciar</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
