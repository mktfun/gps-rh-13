import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSmartActions } from '@/hooks/useSmartActions';
import { useEmpresaActionsNeeded } from '@/hooks/useEmpresaActionsNeeded';

export interface SystemStatus {
  connectionStatus: 'online' | 'offline' | 'checking';
  lastSync: Date | null;
  pendingCounts: {
    notifications: number;
    pendencias_exclusao?: number;
    funcionarios_pendentes?: number;
    configuracao_pendente?: number;
    solicitacoes_pendentes?: number;
    funcionarios_travados?: number;
  };
  systemHealth: 'good' | 'warning' | 'error';
}

export const useSystemStatus = () => {
  const { user, role } = useAuth();
  const [status, setStatus] = useState<SystemStatus>({
    connectionStatus: 'checking',
    lastSync: null,
    pendingCounts: {
      notifications: 0,
    },
    systemHealth: 'good',
  });

  // Hooks condicionais baseados no role
  const smartActionsQuery = useSmartActions();
  const empresaActionsQuery = useEmpresaActionsNeeded();

  useEffect(() => {
    let isSubscribed = true;

    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        
        if (isSubscribed) {
          setStatus(prev => ({
            ...prev,
            connectionStatus: error ? 'offline' : 'online',
            lastSync: new Date(),
          }));
        }
      } catch {
        if (isSubscribed) {
          setStatus(prev => ({
            ...prev,
            connectionStatus: 'offline',
          }));
        }
      }
    };

    // Check initial connection
    checkConnection();

    // Set up periodic checks
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // Update pending counts based on role
  useEffect(() => {
    if (role === 'corretora' && smartActionsQuery.data) {
      const smartData = smartActionsQuery.data;
      // funcionarios_travados is a subset of ativacoes_pendentes (those pending for >5 days)
      // So we only count: aprovacoes_rapidas + ativacoes_pendentes (without double counting)
      const totalPendencias = smartData.aprovacoes_rapidas + smartData.ativacoes_pendentes;

      setStatus(prev => ({
        ...prev,
        pendingCounts: {
          notifications: totalPendencias,
          pendencias_exclusao: smartData.aprovacoes_rapidas,
          funcionarios_pendentes: smartData.ativacoes_pendentes,
          configuracao_pendente: smartData.cnpjs_sem_plano,
          funcionarios_travados: smartData.funcionarios_travados,
        },
        systemHealth: totalPendencias > 10 ? 'warning' : totalPendencias > 20 ? 'error' : 'good',
      }));
    } else if (role === 'empresa' && empresaActionsQuery.data) {
      const empresaData = empresaActionsQuery.data;
      const totalPendencias = empresaData.solicitacoes_pendentes_count + empresaData.funcionarios_travados_count;
      
      setStatus(prev => ({
        ...prev,
        pendingCounts: {
          notifications: totalPendencias,
          solicitacoes_pendentes: empresaData.solicitacoes_pendentes_count,
          funcionarios_travados: empresaData.funcionarios_travados_count,
        },
        systemHealth: totalPendencias > 5 ? 'warning' : totalPendencias > 10 ? 'error' : 'good',
      }));
    }
  }, [role, smartActionsQuery.data, empresaActionsQuery.data]);

  const refreshStatus = () => {
    smartActionsQuery.refetch();
    if (role === 'empresa') {
      empresaActionsQuery.refetch();
    }
  };

  return {
    status,
    isLoading: smartActionsQuery.isLoading || empresaActionsQuery.isLoading,
    refreshStatus,
  };
};
