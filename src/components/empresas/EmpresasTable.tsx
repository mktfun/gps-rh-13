import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Edit2, Users, AlertTriangle, Trash2 } from 'lucide-react';
import { EmpresaTableSkeleton } from './EmpresaTableSkeleton';
import { EmpresaErrorState } from './EmpresaErrorState';
import { PulseLoader } from '@/components/ui/enhanced-loading';
import { type EmpresaComMetricas } from '@/hooks/useEmpresas';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { EmpresaTableActions } from './EmpresaTableActions';

interface EmpresasTableProps {
  empresas: EmpresaComMetricas[];
  isLoading: boolean;
  onEdit: (empresa: EmpresaComMetricas) => void;
  onDelete: (id: string) => void;
}

export const EmpresasTable = ({ empresas, isLoading, onEdit, onDelete }: EmpresasTableProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['empresas'] });
  };

  const handleEditEmpresa = (empresa: EmpresaComMetricas) => {
    toast.info(`Editar dados da empresa ${empresa.nome}...`);
    onEdit(empresa);
  };

  const handleDeleteEmpresa = async (empresaId: string) => {
    setDeletingId(empresaId);
    try {
      await onDelete(empresaId);
      const empresa = empresas.find(e => e.id === empresaId);
      toast.success(`Empresa "${empresa?.nome}" excluída com sucesso`);
    } catch (error) {
      const empresa = empresas.find(e => e.id === empresaId);
      toast.error(`Erro ao excluir empresa "${empresa?.nome}"`);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (statusGeral: string) => {
    if (statusGeral === 'Configuração Pendente') {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          Configuração Pendente
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
        Ativo
      </Badge>
    );
  };

  const getFuncionariosLink = (empresa: EmpresaComMetricas) => {
    // ✅ CORREÇÃO: Verificação defensiva para evitar erros com valores undefined/null
    const total = empresa?.total_funcionarios || 0;
    
    if (total === 0) {
      return (
        <div className="flex items-center justify-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">{total}</span>
        </div>
      );
    }
    
    return (
      <Link 
        to={`/corretora/empresas/${empresa.id}?filtroStatus=ativo`}
        className="flex items-center justify-center gap-1 hover:text-primary transition-colors"
      >
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium hover:underline">{total}</span>
      </Link>
    );
  };

  // ✅ CORREÇÃO: Filtrar empresas válidas antes de renderizar
  const empresasValidas = empresas.filter(empresa => {
    if (!empresa || typeof empresa !== 'object') {
      console.warn('🚨 EmpresasTable - Empresa inválida detectada:', empresa);
      return false;
    }

    if (!empresa.id || !empresa.nome || !empresa.responsavel || !empresa.email) {
      console.warn('🚨 EmpresasTable - Empresa com campos obrigatórios ausentes:', empresa);
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Empresas
          {isLoading && <PulseLoader size="sm" />}
        </h2>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Empresa</TableHead>
              <TableHead className="font-semibold">Responsável</TableHead>
              <TableHead className="font-semibold">Contato</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-center font-semibold">Nº Funcionários</TableHead>
              <TableHead className="text-center font-semibold">Pendências</TableHead>
              <TableHead className="text-right font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <EmpresaTableSkeleton rows={6} />
          ) : (
            <TableBody>
              {empresasValidas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-lg">
                        Nenhuma empresa cadastrada
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Comece adicionando sua primeira empresa
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                empresasValidas.map((empresa) => (
                  <TableRow key={empresa.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="space-y-1">
                        <Link 
                          to={`/corretora/empresas/${empresa.id}`}
                          className="font-medium text-primary hover:underline transition-colors"
                        >
                          {empresa.nome}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          ID: {empresa.id.slice(0, 8)}...
                        </div>
                      </div>
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
                        <div className="text-sm text-muted-foreground">{empresa.telefone || '-'}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(empresa.status_geral)}
                    </TableCell>

                    <TableCell className="text-center">
                      {getFuncionariosLink(empresa)}
                    </TableCell>

                    <TableCell className="text-center">
                      <EmpresaTableActions 
                        empresa={empresa}
                        onEdit={handleEditEmpresa}
                        onDelete={handleDeleteEmpresa}
                        deletingId={deletingId}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
        <div>
          Total: <strong>{empresasValidas.length}</strong> empresa{empresasValidas.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="h-3 w-3 p-0 rounded-full bg-green-500"></Badge>
            <span>Ativas</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-3 w-3 p-0 rounded-full bg-yellow-500"></Badge>
            <span>Configuração Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="h-3 w-3 p-0 rounded-full"></Badge>
            <span>Com Pendências</span>
          </div>
        </div>
      </div>
    </div>
  );
};
