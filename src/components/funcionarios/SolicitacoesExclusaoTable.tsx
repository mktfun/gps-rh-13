
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, AlertTriangle, User, Building } from 'lucide-react';
import { useResolverExclusao } from '@/hooks/useResolverExclusao';
import { toast } from 'sonner';

interface SolicitacaoExclusao {
  funcionario_id: string;
  nome: string;
  cpf: string;
  cargo: string;
  empresa_nome: string;
  cnpj_razao_social: string;
  data_solicitacao: string;
  motivo_exclusao?: string;
}

interface SolicitacoesExclusaoTableProps {
  solicitacoes: SolicitacaoExclusao[];
  isLoading: boolean;
}

export const SolicitacoesExclusaoTable = ({ 
  solicitacoes, 
  isLoading 
}: SolicitacoesExclusaoTableProps) => {
  const { mutate: resolverExclusao, isPending } = useResolverExclusao();

  const handleAprovarExclusao = (funcionarioId: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja APROVAR a exclusão do funcionário "${nome}"?`)) {
      resolverExclusao({ 
        funcionarioId, 
        acao: 'aprovar' 
      });
    }
  };

  const handleNegarExclusao = (funcionarioId: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja NEGAR a exclusão do funcionário "${nome}"? Ele será reativado.`)) {
      resolverExclusao({ 
        funcionarioId, 
        acao: 'negar' 
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="rounded-md border bg-card">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold">
          Solicitações de Exclusão Pendentes ({solicitacoes.length})
        </h3>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Funcionário</TableHead>
              <TableHead className="font-semibold">Empresa</TableHead>
              <TableHead className="font-semibold">CNPJ</TableHead>
              <TableHead className="font-semibold">Data Solicitação</TableHead>
              <TableHead className="font-semibold">Motivo</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="space-y-2">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-lg">
                      Nenhuma solicitação de exclusão pendente
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Quando as empresas solicitarem exclusões, elas aparecerão aqui
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              solicitacoes.map((solicitacao) => (
                <TableRow key={solicitacao.funcionario_id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{solicitacao.nome}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        CPF: {solicitacao.cpf}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cargo: {solicitacao.cargo}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{solicitacao.empresa_nome}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {solicitacao.cnpj_razao_social}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      {formatDate(solicitacao.data_solicitacao)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-xs truncate">
                      {solicitacao.motivo_exclusao || 'Não informado'}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleAprovarExclusao(solicitacao.funcionario_id, solicitacao.nome)}
                        disabled={isPending}
                        title="Aprovar exclusão"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleNegarExclusao(solicitacao.funcionario_id, solicitacao.nome)}
                        disabled={isPending}
                        title="Negar exclusão e reativar funcionário"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Negar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {solicitacoes.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-orange-800">
                Como funciona o processo de exclusão:
              </h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• <strong>Aprovar:</strong> Remove permanentemente o funcionário do sistema</li>
                <li>• <strong>Negar:</strong> Reativa o funcionário e cancela a solicitação</li>
                <li>• As empresas serão notificadas automaticamente sobre sua decisão</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
