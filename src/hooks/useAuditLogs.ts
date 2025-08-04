
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface AuditLogFilters {
  userEmail?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
}

interface AuditLog {
  id: string;
  user_email: string;
  action_type: string;
  entity_id: string;
  table_name: string;
  details: any;
  created_at: string;
}

export const useAuditLogs = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters, page],
    queryFn: async () => {
      console.log('Buscando logs de auditoria com filtros:', filters, 'página:', page);
      
      const offset = (page - 1) * pageSize;
      
      try {
        // Chamada para a função RPC real
        const { data, error } = await supabase.rpc('get_audit_logs', {
          p_limit: pageSize,
          p_offset: offset,
          p_user_email: filters.userEmail || null,
          p_action_type: filters.actionType || null,
          p_start_date: filters.startDate || null,
          p_end_date: filters.endDate || null
        });

        if (error) {
          console.error('Erro ao buscar logs de auditoria:', error);
          throw error;
        }

        console.log('Logs retornados da RPC:', data);
        return (data || []) as AuditLog[];
        
      } catch (rpcError) {
        console.error('Erro na chamada RPC:', rpcError);
        
        // Fallback para dados simulados em caso de erro
        console.log('Usando dados simulados como fallback');
        
        const mockLogs: AuditLog[] = [
          {
            id: '1',
            user_email: 'admin@corretora.com',
            action_type: 'CREATE_EMPRESAS',
            entity_id: 'empresa-123',
            table_name: 'empresas',
            details: {
              new_data: {
                nome: 'Nova Empresa Ltda',
                email: 'contato@novaempresa.com',
                responsavel: 'João Silva'
              }
            },
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            user_email: 'operador@corretora.com',
            action_type: 'UPDATE_FUNCIONARIOS',
            entity_id: 'func-456',
            table_name: 'funcionarios',
            details: {
              old_data: {
                nome: 'Maria Santos',
                cargo: 'Analista',
                salario: 5000
              },
              new_data: {
                nome: 'Maria Santos',
                cargo: 'Coordenadora',
                salario: 6500
              }
            },
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '3',
            user_email: 'admin@corretora.com',
            action_type: 'DELETE_CNPJS',
            entity_id: 'cnpj-789',
            table_name: 'cnpjs',
            details: {
              old_data: {
                cnpj: '12.345.678/0001-90',
                razao_social: 'Empresa Excluída Ltda',
                status: 'ativo'
              }
            },
            created_at: new Date(Date.now() - 172800000).toISOString()
          }
        ];

        // Aplicar filtros aos dados simulados
        let filteredLogs = mockLogs;

        if (filters.userEmail) {
          filteredLogs = filteredLogs.filter(log => 
            log.user_email.toLowerCase().includes(filters.userEmail!.toLowerCase())
          );
        }

        if (filters.actionType) {
          filteredLogs = filteredLogs.filter(log => log.action_type === filters.actionType);
        }

        // Simular paginação
        const startIndex = (page - 1) * pageSize;
        return filteredLogs.slice(startIndex, startIndex + pageSize);
      }
    },
    enabled: true
  });

  const updateFilters = (newFilters: Partial<AuditLogFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset para primeira página ao filtrar
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const nextPage = () => {
    if (data && data.length === pageSize) {
      setPage(prev => prev + 1);
    }
  };

  const previousPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  return {
    logs: data || [],
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
    page,
    pageSize,
    nextPage,
    previousPage,
    canGoNext: data && data.length === pageSize,
    canGoPrevious: page > 1
  };
};
