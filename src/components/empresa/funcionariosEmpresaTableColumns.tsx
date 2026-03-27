import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, User, Briefcase, DollarSign, Heart, Shield, MoreHorizontal, AlertTriangle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';

interface FuncionarioEmpresa {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  idade: number;
  status: string;
  created_at: string;
  cnpj?: {
    razao_social: string;
    cnpj: string;
  };
  planoSaude?: {
    seguradora: string;
    valor_mensal: number;
  };
  planoVida?: {
    seguradora: string;
    valor_mensal: number;
    cobertura_morte: number;
  };
  // Keep legacy field for backward compat
  plano?: {
    seguradora: string;
    valor_mensal: number;
    cobertura_morte: number;
  };
}

export const createFuncionariosEmpresaTableColumns = (
  onViewDetails: (funcionario: FuncionarioEmpresa) => void,
  onSolicitarExclusao?: (funcionario: FuncionarioEmpresa) => void,
  onAtivarFuncionario?: (funcionario: FuncionarioEmpresa) => void,
  onExcluirFuncionario?: (funcionario: FuncionarioEmpresa) => void,
  userRole?: string
): ColumnDef<FuncionarioEmpresa>[] => [
  {
    accessorKey: 'nome',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        <User className="h-4 w-4 mr-2" />
        Nome
      </Button>
    ),
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium">{row.getValue('nome')}</div>
        <div className="text-xs text-muted-foreground">{row.original.cpf}</div>
      </div>
    ),
  },
  {
    accessorKey: 'cargo',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        <Briefcase className="h-4 w-4 mr-2" />
        Cargo
      </Button>
    ),
    cell: ({ row }) => row.getValue('cargo'),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const getStatusVariant = (s: string) => {
        switch (s) {
          case 'ativo': return 'default';
          case 'pendente': return 'secondary';
          case 'desativado':
          case 'exclusao_solicitada': return 'destructive';
          default: return 'outline';
        }
      };
      return (
        <Badge variant={getStatusVariant(status)}>
          {status === 'exclusao_solicitada' ? 'Exclusão Solicitada' : status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'cnpj',
    header: 'CNPJ',
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="text-sm font-medium">{row.original.cnpj?.razao_social}</div>
        <div className="text-xs text-muted-foreground">{row.original.cnpj?.cnpj}</div>
      </div>
    ),
  },
  {
    id: 'planoSaude',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        <Heart className="h-4 w-4 mr-2" />
        Saúde
      </Button>
    ),
    cell: ({ row }) => {
      const ps = row.original.planoSaude;
      if (!ps) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <div className="space-y-0.5">
          <div className="text-sm font-medium">{ps.seguradora}</div>
          <div className="text-xs text-muted-foreground">{formatCurrency(ps.valor_mensal)}/mês</div>
        </div>
      );
    },
  },
  {
    id: 'planoVida',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        <Shield className="h-4 w-4 mr-2" />
        Vida
      </Button>
    ),
    cell: ({ row }) => {
      const pv = row.original.planoVida;
      if (!pv) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <div className="space-y-0.5">
          <div className="text-sm font-medium">{pv.seguradora}</div>
          <div className="text-xs text-muted-foreground">{formatCurrency(pv.valor_mensal)}/mês</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'salario',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        <DollarSign className="h-4 w-4 mr-2" />
        Salário
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.getValue('salario'))}
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const funcionario = row.original;
      const canSolicitarExclusao = funcionario.status === 'ativo' && onSolicitarExclusao;
      const isCorretora = userRole === 'corretora';
      const isEmpresa = userRole === 'empresa';

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(funcionario)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>

            {isEmpresa && canSolicitarExclusao && (
              <DropdownMenuItem
                onClick={() => onSolicitarExclusao!(funcionario)}
                className="text-orange-600"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Solicitar Exclusão
              </DropdownMenuItem>
            )}

            {isCorretora && (
              <>
                {funcionario.status === 'pendente' && onAtivarFuncionario && (
                  <DropdownMenuItem onClick={() => onAtivarFuncionario(funcionario)}>
                    <Shield className="mr-2 h-4 w-4" />
                    Ativar Funcionário
                  </DropdownMenuItem>
                )}
                {funcionario.status === 'ativo' && onExcluirFuncionario && (
                  <DropdownMenuItem
                    onClick={() => onExcluirFuncionario(funcionario)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Funcionário
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
