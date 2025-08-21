import React from 'react';
import { Building2, Users, Clock, Edit, Trash2, MoreHorizontal, Eye, MapPin } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { CnpjComPlano } from '@/hooks/useCnpjsComPlanos';

interface CNPJsCardViewProps {
  cnpjs: CnpjComPlano[];
  onEdit: (cnpj: CnpjComPlano) => void;
  onDelete: (cnpjId: string) => void;
}

export const CNPJsCardView: React.FC<CNPJsCardViewProps> = ({ cnpjs, onEdit }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'configuracao':
        return 'secondary';
      case 'inativo':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'configuracao':
        return 'Em Configuração';
      case 'inativo':
        return 'Inativo';
      default:
        return status;
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleViewFuncionarios = (cnpj: CnpjComPlano) => {
    navigate(`/empresa/funcionarios?cnpj=${cnpj.id}`);
  };

  const handleDelete = (cnpj: CnpjComPlano) => {
    // TODO: Implementar confirmação e exclusão
    console.log('Excluir CNPJ:', cnpj.id);
  };

  if (cnpjs.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhum CNPJ encontrado</h3>
        <p className="text-muted-foreground">
          Não há CNPJs que correspondem aos critérios de busca.
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
                  {formatCNPJ(cnpj.cnpj)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(cnpj.status)}>
                  {getStatusLabel(cnpj.status)}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleViewFuncionarios(cnpj)}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Funcionários
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onEdit(cnpj)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(cnpj)}
                      className="cursor-pointer text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Funcionários */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span>Funcionários ativos:</span>
                </div>
                <span className="font-medium">{cnpj.funcionariosAtivos}</span>
              </div>

              {cnpj.funcionariosPendentes > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span>Pendentes:</span>
                  </div>
                  <span className="font-medium text-orange-600">{cnpj.funcionariosPendentes}</span>
                </div>
              )}

              <div className="pt-1 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{cnpj.totalFuncionarios}</span>
                </div>
              </div>
            </div>

            {/* Planos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status do Plano:</span>
                <Badge variant={cnpj.temPlano ? 'default' : 'secondary'}>
                  {cnpj.temPlano ? 'Com Plano' : 'Sem Plano'}
                </Badge>
              </div>

              {cnpj.temPlano && (
                <>
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
                        {formatCurrency(cnpj.valor_mensal)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pendências */}
            {cnpj.totalPendencias > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm font-medium text-yellow-800">
                    {cnpj.totalPendencias} pendência{cnpj.totalPendencias > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Requer atenção para regularização
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-4">
            <Button
              onClick={() => handleViewFuncionarios(cnpj)}
              className="w-full"
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Funcionários
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
