
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: {
    id: string;
    user_email: string;
    action_type: string;
    entity_id: string;
    table_name: string;
    details: any;
    created_at: string;
  } | null;
}

const translateActionType = (actionType: string) => {
  const translations: { [key: string]: string } = {
    'CREATE_EMPRESAS': 'Empresa Criada',
    'UPDATE_EMPRESAS': 'Empresa Atualizada',
    'DELETE_EMPRESAS': 'Empresa Excluída',
    'CREATE_CNPJS': 'CNPJ Criado',
    'UPDATE_CNPJS': 'CNPJ Atualizado',
    'DELETE_CNPJS': 'CNPJ Excluído',
    'CREATE_FUNCIONARIOS': 'Funcionário Criado',
    'UPDATE_FUNCIONARIOS': 'Funcionário Atualizado',
    'DELETE_FUNCIONARIOS': 'Funcionário Excluído',
    'CREATE_DADOS_PLANOS': 'Plano Criado',
    'UPDATE_DADOS_PLANOS': 'Plano Atualizado',
    'DELETE_DADOS_PLANOS': 'Plano Excluído',
  };
  return translations[actionType] || actionType;
};

const translateTableName = (tableName: string) => {
  const translations: { [key: string]: string } = {
    'empresas': 'Empresas',
    'cnpjs': 'CNPJs',
    'funcionarios': 'Funcionários',
    'dados_planos': 'Dados dos Planos',
  };
  return translations[tableName] || tableName;
};

const formatFieldValue = (value: any) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'string' && value.includes('T')) {
    try {
      return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return value;
    }
  }
  return String(value);
};

const CompareField = ({ label, oldValue, newValue }: { label: string; oldValue: any; newValue: any }) => {
  const hasChanged = oldValue !== newValue;
  
  return (
    <div className="grid grid-cols-2 gap-4 p-2 border rounded">
      <div className="text-sm">
        <span className="font-medium text-gray-600">{label}:</span>
        <div className={`mt-1 p-2 rounded ${hasChanged ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
          {formatFieldValue(oldValue)}
        </div>
      </div>
      <div className="text-sm">
        <span className="font-medium text-gray-600">{label}:</span>
        <div className={`mt-1 p-2 rounded ${hasChanged ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
          {formatFieldValue(newValue)}
        </div>
      </div>
    </div>
  );
};

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  const { details, action_type } = log;
  const oldData = details?.old_data;
  const newData = details?.new_data;

  const renderCreateAction = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600">Dados Criados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {newData && Object.entries(newData).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1 border-b">
              <span className="font-medium">{key}:</span>
              <span className="text-gray-600">{formatFieldValue(value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderDeleteAction = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">Dados Excluídos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {oldData && Object.entries(oldData).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1 border-b">
              <span className="font-medium">{key}:</span>
              <span className="text-gray-600">{formatFieldValue(value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderUpdateAction = () => {
    if (!oldData || !newData) return null;

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="text-red-600 font-medium">ANTES</div>
          <div className="text-green-600 font-medium">DEPOIS</div>
        </div>
        
        <div className="space-y-3">
          {Array.from(allKeys).map(key => (
            <CompareField
              key={key}
              label={key}
              oldValue={oldData[key]}
              newValue={newData[key]}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes da Alteração
            <Badge variant="outline">
              {translateActionType(action_type)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2 mt-4">
              <div><strong>Usuário:</strong> {log.user_email}</div>
              <div><strong>Data/Hora:</strong> {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</div>
              <div><strong>Tabela:</strong> {translateTableName(log.table_name)}</div>
              <div><strong>ID da Entidade:</strong> {log.entity_id}</div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {action_type.includes('CREATE') && renderCreateAction()}
          {action_type.includes('DELETE') && renderDeleteAction()}
          {action_type.includes('UPDATE') && renderUpdateAction()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
