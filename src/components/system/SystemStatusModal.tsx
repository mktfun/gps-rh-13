
import React from 'react';
import { RefreshCw, Wifi, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useAuth } from '@/hooks/useAuth';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemStatusModal = ({ isOpen, onClose }: SystemStatusModalProps) => {
  const { status, isLoading, refreshStatus } = useSystemStatus();
  const { role } = useAuth();

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getConnectionStatusBadge = () => {
    const variant = status.connectionStatus === 'online' ? 'default' : 
                   status.connectionStatus === 'offline' ? 'destructive' : 'secondary';
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {status.connectionStatus === 'online' ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
        {status.connectionStatus === 'online' ? 'Online' : 
         status.connectionStatus === 'offline' ? 'Offline' : 'Verificando...'}
      </Badge>
    );
  };

  const getSystemHealthBadge = () => {
    const variant = status.systemHealth === 'good' ? 'default' :
                   status.systemHealth === 'warning' ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={variant}>
        {status.systemHealth === 'good' ? 'Saudável' :
         status.systemHealth === 'warning' ? 'Atenção' : 'Crítico'}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Status do Sistema
          </DialogTitle>
          <DialogDescription>
            Informações sobre a conexão e status geral do sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status da Conexão */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Conexão</span>
            {getConnectionStatusBadge()}
          </div>

          {/* Saúde do Sistema */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Saúde do Sistema</span>
            {getSystemHealthBadge()}
          </div>

          {/* Última Sincronização */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Última Sincronização
            </span>
            <span className="text-sm text-muted-foreground">
              {formatLastSync(status.lastSync)}
            </span>
          </div>

          <Separator />

          {/* Pendências por Tipo */}
          <div>
            <h4 className="text-sm font-medium mb-2">Pendências</h4>
            <div className="space-y-2">
              {role === 'corretora' ? (
                <>
                  {status.pendingCounts.pendencias_exclusao !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span>Aprovações Rápidas</span>
                      <Badge variant="outline">{status.pendingCounts.pendencias_exclusao}</Badge>
                    </div>
                  )}
                  {status.pendingCounts.funcionarios_pendentes !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span>Funcionários Pendentes</span>
                      <Badge variant="outline">{status.pendingCounts.funcionarios_pendentes}</Badge>
                    </div>
                  )}
                  {status.pendingCounts.configuracao_pendente !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span>CNPJs sem Plano</span>
                      <Badge variant="outline">{status.pendingCounts.configuracao_pendente}</Badge>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {status.pendingCounts.solicitacoes_pendentes !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span>Solicitações Pendentes</span>
                      <Badge variant="outline">{status.pendingCounts.solicitacoes_pendentes}</Badge>
                    </div>
                  )}
                  {status.pendingCounts.funcionarios_travados !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span>Funcionários Travados</span>
                      <Badge variant="outline">{status.pendingCounts.funcionarios_travados}</Badge>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Botão de Atualizar */}
          <div className="flex justify-end pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshStatus}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar Status
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
