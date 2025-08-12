
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Building, FileText, Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendenciaQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendencia: {
    protocolo: string;
    funcionario_nome: string;
    funcionario_cpf: string;
    razao_social: string;
    cnpj: string;
    descricao: string;
    data_criacao: string;
    data_vencimento: string;
    status_prioridade: 'critica' | 'urgente' | 'normal';
    dias_em_aberto: number;
    tipo: 'documentacao' | 'ativacao' | 'alteracao' | 'cancelamento';
  };
}

export const PendenciaQuickViewModal: React.FC<PendenciaQuickViewModalProps> = ({
  isOpen,
  onClose,
  pendencia
}) => {
  const diasRestantes = Math.ceil(
    (new Date(pendencia.data_vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
        return <Badge variant="destructive">Crítica</Badge>;
      case 'urgente':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Urgente</Badge>;
      case 'normal':
        return <Badge variant="default">Normal</Badge>;
      default:
        return <Badge variant="outline">{prioridade}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const tipos = {
      documentacao: { label: 'Documentação', color: 'bg-blue-100 text-blue-800' },
      ativacao: { label: 'Ativação', color: 'bg-green-100 text-green-800' },
      alteracao: { label: 'Alteração', color: 'bg-yellow-100 text-yellow-800' },
      cancelamento: { label: 'Cancelamento', color: 'bg-red-100 text-red-800' }
    };

    const tipoConfig = tipos[tipo as keyof typeof tipos] || { label: tipo, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="outline" className={tipoConfig.color}>
        {tipoConfig.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resumo da Pendência - {pendencia.protocolo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Tipo */}
          <div className="flex items-center gap-4">
            {getPrioridadeBadge(pendencia.status_prioridade)}
            {getTipoBadge(pendencia.tipo)}
          </div>

          {/* Informações do Funcionário */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              Funcionário
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="font-medium">{pendencia.funcionario_nome}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CPF</p>
                <p className="font-medium font-mono">{pendencia.funcionario_cpf}</p>
              </div>
            </div>
          </div>

          {/* Informações da Empresa */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Building className="h-4 w-4" />
              Empresa
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                <p className="font-medium">{pendencia.razao_social}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                <p className="font-medium font-mono">{pendencia.cnpj}</p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Descrição
            </h3>
            <p className="text-sm">{pendencia.descricao}</p>
          </div>

          {/* Datas e Prazos */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" />
              Prazos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Criação</p>
                <p className="font-medium">
                  {format(new Date(pendencia.data_criacao), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prazo</p>
                <p className="font-medium">
                  {format(new Date(pendencia.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dias em Aberto</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {pendencia.dias_em_aberto} {pendencia.dias_em_aberto === 1 ? 'dia' : 'dias'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status do Prazo</p>
                <p className={`font-medium flex items-center gap-2 ${
                  diasRestantes < 0 ? 'text-red-600' : 
                  diasRestantes <= 7 ? 'text-orange-600' : 
                  'text-green-600'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                  {diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias vencido` :
                   diasRestantes === 0 ? 'Vence hoje' :
                   `${diasRestantes} dias restantes`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
