
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Edit2, Users, ExternalLink, Eye } from 'lucide-react';
import { EmpresaHoverCard } from './EmpresaHoverCard';
import { EnhancedTooltip, EnhancedTooltipContent, EnhancedTooltipTrigger, EnhancedTooltipProvider } from '@/components/ui/enhanced-tooltip';
import { Database } from '@/integrations/supabase/types';

type Empresa = Database['public']['Tables']['empresas']['Row'];

interface EmpresaTableRowProps {
  empresa: Empresa;
  onEdit: (empresa: Empresa) => void;
  funcionariosCount?: number;
}

export const EmpresaTableRow = ({ empresa, onEdit, funcionariosCount = 0 }: EmpresaTableRowProps) => {
  const getStatusBadge = (primeiroAcesso: boolean) => {
    return primeiroAcesso ? (
      <EnhancedTooltipProvider>
        <EnhancedTooltip>
          <EnhancedTooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-help">
              Aguardando Acesso
            </Badge>
          </EnhancedTooltipTrigger>
          <EnhancedTooltipContent variant="warning">
            Esta empresa ainda não realizou o primeiro acesso ao sistema
          </EnhancedTooltipContent>
        </EnhancedTooltip>
      </EnhancedTooltipProvider>
    ) : (
      <EnhancedTooltipProvider>
        <EnhancedTooltip>
          <EnhancedTooltipTrigger asChild>
            <Badge variant="default" className="cursor-help">
              Ativa
            </Badge>
          </EnhancedTooltipTrigger>
          <EnhancedTooltipContent variant="success">
            Empresa ativa no sistema
          </EnhancedTooltipContent>
        </EnhancedTooltip>
      </EnhancedTooltipProvider>
    );
  };

  return (
    <TableRow className="hover:bg-muted/50 transition-colors group">
      <TableCell>
        <EmpresaHoverCard empresa={empresa} funcionariosCount={funcionariosCount}>
          <div className="space-y-1 cursor-pointer">
            <div className="font-medium hover:text-primary transition-colors flex items-center gap-2">
              {empresa.nome}
              <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-sm text-muted-foreground">
              ID: {empresa.id.slice(0, 8)}...
            </div>
          </div>
        </EmpresaHoverCard>
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{empresa.responsavel}</div>
          <div className="text-sm text-muted-foreground">Responsável</div>
        </div>
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          <div className="text-sm">{empresa.email}</div>
          <div className="text-sm text-muted-foreground">{empresa.telefone}</div>
        </div>
      </TableCell>

      <TableCell>
        {getStatusBadge(empresa.primeiro_acesso)}
      </TableCell>

      <TableCell className="text-center">
        <EnhancedTooltipProvider>
          <EnhancedTooltip>
            <EnhancedTooltipTrigger asChild>
              <Link 
                to={`/corretora/empresas/${empresa.id}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline transition-colors"
                aria-label={`Ver ${funcionariosCount} funcionários da empresa ${empresa.nome}`}
              >
                <Users className="h-4 w-4" />
                {funcionariosCount > 0 ? funcionariosCount : 'Ver funcionários'}
              </Link>
            </EnhancedTooltipTrigger>
            <EnhancedTooltipContent variant="info">
              {funcionariosCount > 0 
                ? `Esta empresa possui ${funcionariosCount} funcionário${funcionariosCount !== 1 ? 's' : ''} cadastrado${funcionariosCount !== 1 ? 's' : ''}`
                : 'Visualizar lista de funcionários desta empresa'
              }
            </EnhancedTooltipContent>
          </EnhancedTooltip>
        </EnhancedTooltipProvider>
      </TableCell>

      <TableCell className="text-center">
        <Link 
          to={`/corretora/empresas/${empresa.id}`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline transition-colors"
          aria-label={`Ver detalhes da empresa ${empresa.nome}`}
        >
          Ver detalhes
          <ExternalLink className="h-3 w-3" />
        </Link>
      </TableCell>

      <TableCell className="text-right">
        <EnhancedTooltipProvider>
          <EnhancedTooltip>
            <EnhancedTooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(empresa)}
                aria-label={`Editar empresa ${empresa.nome}`}
                className="hover:bg-primary/10 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </EnhancedTooltipTrigger>
            <EnhancedTooltipContent>
              Editar informações da empresa
            </EnhancedTooltipContent>
          </EnhancedTooltip>
        </EnhancedTooltipProvider>
      </TableCell>
    </TableRow>
  );
};
