import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, Building2, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlanoComMetricas {
  plano_id: string;
  cnpj_id: string;
  seguradora: string;
  valor_unitario: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  cnpj_numero: string;
  cnpj_razao_social: string;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
  total_funcionarios: number;
  custo_mensal_real: number;
}

interface PlanoEmpresaLegacy {
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

export const createPlanosTableColumnsUnificadas = (): ColumnDef<PlanoComMetricas>[] => {
  const navigate = useNavigate();

  return [
    {
      accessorKey: 'seguradora',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 hover:bg-muted/50"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Seguradora
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            {row.getValue('seguradora')}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'cnpj_razao_social',
      header: 'CNPJ Vinculado',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{row.original.cnpj_razao_social}</div>
          <div className="text-xs text-muted-foreground font-mono">{row.original.cnpj_numero}</div>
        </div>
      ),
    },
    {
      accessorKey: 'funcionarios_ativos',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 hover:bg-muted/50"
        >
          <Users className="h-4 w-4 mr-2" />
          Funcionários
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center space-y-1">
          <div className="font-semibold text-foreground">{row.original.funcionarios_ativos}</div>
          {row.original.funcionarios_pendentes > 0 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.funcionarios_pendentes} pendentes
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'custo_mensal_real',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 p-0 hover:bg-muted/50 justify-end"
        >
          Custo Mensal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const custoReal = row.original.custo_mensal_real;
        return (
          <div className="text-right space-y-1">
            <div className="font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(custoReal)}
            </div>
            <div className="text-xs text-muted-foreground">
              Custo mensal real
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/empresa/planos/${row.original.plano_id}`)}
            className="h-8 px-3 hover:bg-muted/50 text-base"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        );
      },
    },
  ];
};
