
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Filter, X } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { AuditLogModal } from '@/components/audit/AuditLogModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const AuditoriaPage = () => {
  const {
    logs,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
    page,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious
  } = useAuditLogs();

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (log: any) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedLog(null);
    setIsModalOpen(false);
  };

  const actionTypeOptions = [
    { value: 'CREATE_EMPRESAS', label: 'Empresa Criada' },
    { value: 'UPDATE_EMPRESAS', label: 'Empresa Atualizada' },
    { value: 'DELETE_EMPRESAS', label: 'Empresa Excluída' },
    { value: 'CREATE_CNPJS', label: 'CNPJ Criado' },
    { value: 'UPDATE_CNPJS', label: 'CNPJ Atualizado' },
    { value: 'DELETE_CNPJS', label: 'CNPJ Excluído' },
    { value: 'CREATE_FUNCIONARIOS', label: 'Funcionário Criado' },
    { value: 'UPDATE_FUNCIONARIOS', label: 'Funcionário Atualizado' },
    { value: 'DELETE_FUNCIONARIOS', label: 'Funcionário Excluído' },
    { value: 'CREATE_DADOS_PLANOS', label: 'Plano Criado' },
    { value: 'UPDATE_DADOS_PLANOS', label: 'Plano Atualizado' },
    { value: 'DELETE_DADOS_PLANOS', label: 'Plano Excluído' },
  ];

  const translateActionType = (actionType: string) => {
    const option = actionTypeOptions.find(opt => opt.value === actionType);
    return option ? option.label : actionType;
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

  const getActionBadgeColor = (actionType: string) => {
    if (actionType.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (actionType.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (actionType.includes('DELETE')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erro ao carregar histórico de auditoria: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Auditoria</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe todas as alterações realizadas no sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">Usuário (Email)</Label>
              <Input
                id="user-email"
                placeholder="Email do usuário"
                value={filters.userEmail || ''}
                onChange={(e) => updateFilters({ userEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-type">Tipo de Ação</Label>
              <Select 
                value={filters.actionType || ''} 
                onValueChange={(value) => updateFilters({ actionType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma ação" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => updateFilters({ startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => updateFilters({ endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>ID da Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.user_email}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action_type)}>
                            {translateActionType(log.action_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {translateTableName(log.table_name)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.entity_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal(log)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginação */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Página {page} • {logs.length} registro(s) exibidos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousPage}
                disabled={!canGoPrevious}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={!canGoNext}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <AuditLogModal
        isOpen={isModalOpen}
        onClose={closeModal}
        log={selectedLog}
      />
    </div>
  );
};

export default AuditoriaPage;
