
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Eye,
  Stethoscope
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanoFuncionario } from '@/hooks/usePlanoFuncionarios';

interface FuncionariosPlanoSaudeDataTableProps {
  data: PlanoFuncionario[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onAtivarFuncionario: (funcionarioId: string) => void;
  onRemoverFuncionario: (funcionarioId: string) => void;
  isUpdating: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ativo':
      return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
    case 'pendente':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    case 'inativo':
      return <Badge variant="outline" className="bg-red-100 text-red-800">Inativo</Badge>;
    case 'exclusao_solicitada':
      return <Badge variant="destructive" className="bg-orange-100 text-orange-800">Exclusão Solicitada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const formatCPF = (cpf: string) => {
  if (!cpf) return '';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const FuncionariosPlanoSaudeDataTable: React.FC<FuncionariosPlanoSaudeDataTableProps> = ({
  data,
  isLoading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onAtivarFuncionario,
  onRemoverFuncionario,
  isUpdating
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Carregando funcionários...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              Nenhum funcionário encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Não há funcionários vinculados a este plano de saúde.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((funcionario) => (
                <TableRow key={funcionario.id}>
                  <TableCell className="font-medium">{funcionario.nome}</TableCell>
                  <TableCell>{formatCPF(funcionario.cpf)}</TableCell>
                  <TableCell>{funcionario.idade} anos</TableCell>
                  <TableCell>{funcionario.email || '-'}</TableCell>
                  <TableCell>{getStatusBadge(funcionario.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => console.log('Ver detalhes:', funcionario.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        
                        {funcionario.status !== 'ativo' && (
                          <DropdownMenuItem
                            onClick={() => onAtivarFuncionario(funcionario.funcionario_id)}
                            disabled={isUpdating}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Ativar no Plano
                          </DropdownMenuItem>
                        )}
                        
                        {funcionario.status === 'ativo' && (
                          <DropdownMenuItem
                            onClick={() => onRemoverFuncionario(funcionario.funcionario_id)}
                            disabled={isUpdating}
                            className="text-red-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Remover do Plano
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {currentPage * pageSize + 1} a {Math.min((currentPage + 1) * pageSize, totalCount)} de {totalCount} funcionários
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
