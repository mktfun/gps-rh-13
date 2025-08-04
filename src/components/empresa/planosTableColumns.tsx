
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, Building2 } from 'lucide-react';

interface PlanoEmpresa {
  id: string;
  seguradora: string;
  valor_mensal: number;
  cnpj_numero: string;
  cnpj_razao_social: string;
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  cnpj_id: string;
}

export const createPlanosTableColumns = (
  onViewDetails: (plano: PlanoEmpresa) => void
): ColumnDef<PlanoEmpresa>[] => [
  {
    accessorKey: 'seguradora',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        <Building2 className="h-4 w-4 mr-2" />
        Seguradora
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{row.getValue('seguradora')}</Badge>
      </div>
    ),
  },
  {
    accessorKey: 'cnpj_razao_social',
    header: 'CNPJ Vinculado',
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium text-sm">{row.original.cnpj_razao_social}</div>
        <div className="text-xs text-muted-foreground">{row.original.cnpj_numero}</div>
      </div>
    ),
  },
  {
    accessorKey: 'funcionarios_ativos',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        <Users className="h-4 w-4 mr-2" />
        Funcionários
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center space-y-1">
        <div className="font-semibold text-green-600">{row.original.funcionarios_ativos}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.funcionarios_pendentes > 0 && (
            <span className="text-orange-600">
              +{row.original.funcionarios_pendentes} pendentes
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'valor_mensal',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        Custo do Plano
      </Button>
    ),
    cell: ({ row }) => {
      // Valor fixo por plano/CNPJ (não multiplicar por funcionários)
      const custoPlano = row.original.valor_mensal;
      return (
        <div className="text-right space-y-1">
          <div className="font-semibold text-green-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(custoPlano)}
          </div>
          <div className="text-xs text-muted-foreground">
            Valor fixo por CNPJ
          </div>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewDetails(row.original)}
        className="h-8 px-2"
      >
        <Eye className="h-4 w-4 mr-2" />
        Ver Detalhes
      </Button>
    ),
  },
];
