import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare } from "lucide-react";
import { TipoPendenciaBadge, PrioridadePendenciaBadge } from "./PendenciasBadges";
import { PendenciaCommentsModal } from "./PendenciaCommentsModal";
import { useState } from "react";

interface TabelaPendencias {
  id: string;
  protocolo: string;
  tipo: 'documentacao' | 'ativacao' | 'alteracao' | 'cancelamento';
  funcionario_nome: string;
  funcionario_cpf: string;
  cnpj: string;
  razao_social: string;
  descricao: string;
  data_criacao: string;
  data_vencimento: string;
  status_prioridade: 'critica' | 'urgente' | 'normal';
  dias_em_aberto: number;
  comentarios_count: number;
}

export const createPendenciasTableColumns = (): ColumnDef<TabelaPendencias>[] => [
  {
    accessorKey: 'protocolo',
    header: 'Protocolo',
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue('protocolo')}
      </Badge>
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.getValue('tipo') as 'documentacao' | 'ativacao' | 'alteracao' | 'cancelamento';
      return <TipoPendenciaBadge tipo={tipo} />;
    },
  },
  {
    accessorKey: 'funcionario_nome',
    header: 'Funcionário',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue('funcionario_nome')}</div>
        <div className="text-sm text-gray-500">{row.original.funcionario_cpf}</div>
      </div>
    ),
  },
  {
    accessorKey: 'razao_social',
    header: 'CNPJ/Empresa',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue('razao_social')}</div>
        <div className="text-sm text-gray-500 font-mono">{row.original.cnpj}</div>
      </div>
    ),
  },
  {
    accessorKey: 'descricao',
    header: 'Descrição',
    cell: ({ row }) => (
      <div className="max-w-xs">
        <p className="truncate" title={row.getValue('descricao')}>
          {row.getValue('descricao')}
        </p>
      </div>
    ),
  },
  {
    accessorKey: 'data_criacao',
    header: 'Data Criação',
    cell: ({ row }) => (
      <div className="text-sm">
        {format(new Date(row.getValue('data_criacao')), 'dd/MM/yyyy', { locale: ptBR })}
      </div>
    ),
  },
  {
    accessorKey: 'data_vencimento',
    header: 'Prazo',
    cell: ({ row }) => {
      const dataVencimento = new Date(row.getValue('data_vencimento'));
      const hoje = new Date();
      const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      return (
        <div className="text-sm">
          <div>{format(dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}</div>
          <div className={`text-xs ${
            diasRestantes < 0 ? 'text-red-600' : 
            diasRestantes <= 7 ? 'text-orange-600' : 
            'text-gray-500'
          }`}>
            {diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias vencido` :
             diasRestantes === 0 ? 'Vence hoje' :
             `${diasRestantes} dias restantes`}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status_prioridade',
    header: 'Status',
    cell: ({ row }) => {
      const prioridade = row.getValue('status_prioridade') as 'critica' | 'urgente' | 'normal';
      return <PrioridadePendenciaBadge prioridade={prioridade} />;
    },
  },
  {
    accessorKey: 'dias_em_aberto',
    header: 'Dias em Aberto',
    cell: ({ row }) => (
      <div className="text-center">
        <span className="text-sm font-medium">{row.getValue('dias_em_aberto')}</span>
      </div>
    ),
  },
  {
    id: 'acoes',
    header: 'Ações',
    cell: ({ row }) => {
      const [isCommentsOpen, setIsCommentsOpen] = useState(false);
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Ver detalhes:', row.original.id)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCommentsOpen(true)}
            className="h-8 w-8 p-0 relative"
          >
            <MessageSquare className="h-4 w-4" />
            {row.original.comentarios_count > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {row.original.comentarios_count}
              </Badge>
            )}
          </Button>
          
          <PendenciaCommentsModal
            isOpen={isCommentsOpen}
            onClose={() => setIsCommentsOpen(false)}
            pendencia={{
              id: row.original.id,
              protocolo: row.original.protocolo,
              funcionario_nome: row.original.funcionario_nome,
              cpf: row.original.funcionario_cpf,
              cargo: 'N/A', // This field might not be available in this context
              status: row.original.status_prioridade, // Using status_prioridade as status
              cnpj_razao_social: row.original.razao_social,
              data_solicitacao: row.original.data_criacao,
              motivo: row.original.descricao, // Using description as motivo
              descricao: row.original.descricao,
              comentarios_count: row.original.comentarios_count
            }}
          />
        </div>
      );
    },
  },
];
