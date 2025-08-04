
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Upload, ArrowRight } from 'lucide-react';
import { CnpjStatusBadges } from './CnpjStatusBadges';

interface CnpjsListViewProps {
  cnpjs: any[];
  isLoading: boolean;
  onCnpjClick: (cnpj: any) => void;
  onImportClick: (cnpj: any) => void;
}

export const CnpjsListView: React.FC<CnpjsListViewProps> = ({
  cnpjs,
  isLoading,
  onCnpjClick,
  onImportClick
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (cnpjs.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhuma empresa encontrada</h3>
        <p className="text-muted-foreground">
          Nenhuma empresa corresponde aos critérios de busca.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Funcionários</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Seguradora</TableHead>
            <TableHead>Valor Mensal</TableHead>
            <TableHead className="w-[200px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cnpjs.map((cnpj) => (
            <TableRow key={cnpj.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold">{cnpj.razao_social}</div>
                  {cnpj.nome_fantasia && (
                    <div className="text-sm text-muted-foreground">{cnpj.nome_fantasia}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {cnpj.cnpj}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{cnpj.totalFuncionarios || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                <CnpjStatusBadges 
                  temPlano={cnpj.temPlano}
                  funcionariosAtivos={cnpj.totalFuncionarios || 0}
                  totalFuncionarios={cnpj.totalFuncionarios || 0}
                  totalPendencias={cnpj.totalPendencias}
                  funcionariosPendentes={cnpj.funcionariosPendentes}
                  funcionariosExclusaoSolicitada={cnpj.funcionariosExclusaoSolicitada}
                />
              </TableCell>
              <TableCell>
                {cnpj.seguradora ? (
                  <span className="text-sm">{cnpj.seguradora}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {cnpj.valor_mensal ? (
                  <span className="font-medium text-green-600">
                    R$ {cnpj.valor_mensal.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImportClick(cnpj);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Importar
                  </Button>
                  
                  <Button
                    onClick={() => onCnpjClick(cnpj)}
                    size="sm"
                  >
                    <span>Gerenciar</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
