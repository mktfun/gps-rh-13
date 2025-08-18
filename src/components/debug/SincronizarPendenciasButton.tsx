import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react';

interface SyncResult {
  pendencia_id: string;
  funcionario_nome: string;
  status_anterior: string;
  status_novo: string;
  sincronizada: boolean;
  erro?: string;
}

export const SincronizarPendenciasButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSincronizar = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 Sincronizando status de pendências...');

      // 1. Buscar pendências ativas que podem estar desatualizadas
      const { data: pendenciasDesatualizadas, error: pendError } = await supabase
        .from('pendencias')
        .select(`
          id,
          tipo,
          status,
          funcionario_id,
          funcionarios!inner (
            id,
            nome,
            status,
            cnpj_id,
            cnpjs!inner (
              empresa_id,
              empresas!inner (
                corretora_id
              )
            )
          )
        `)
        .eq('status', 'pendente')
        .eq('funcionarios.cnpjs.empresas.corretora_id', user.id);

      if (pendError) {
        console.error('❌ Erro ao buscar pendências:', pendError);
        throw pendError;
      }

      if (!pendenciasDesatualizadas || pendenciasDesatualizadas.length === 0) {
        toast({
          title: "Nada para Sincronizar",
          description: "Todas as pendências estão sincronizadas",
        });
        return;
      }

      const results: SyncResult[] = [];

      // 2. Verificar cada pendência e sincronizar se necessário
      for (const pendencia of pendenciasDesatualizadas) {
        const funcionario = pendencia.funcionarios as any;
        
        try {
          let novoStatus = pendencia.status;
          let precisaSincronizar = false;

          // Regras de sincronização
          if (pendencia.tipo === 'ativacao' && funcionario.status === 'ativo') {
            // Se pendência é de ativação mas funcionário já está ativo, marcar como concluída
            novoStatus = 'concluida';
            precisaSincronizar = true;
          } else if (pendencia.tipo === 'cancelamento' && funcionario.status === 'desativado') {
            // Se pendência é de cancelamento mas funcionário já está desativado, marcar como concluída
            novoStatus = 'concluida';
            precisaSincronizar = true;
          }

          if (precisaSincronizar) {
            const { error: updateError } = await supabase
              .from('pendencias')
              .update({ 
                status: novoStatus,
                data_conclusao: new Date().toISOString()
              })
              .eq('id', pendencia.id);

            if (updateError) {
              results.push({
                pendencia_id: pendencia.id,
                funcionario_nome: funcionario.nome,
                status_anterior: pendencia.status,
                status_novo: novoStatus,
                sincronizada: false,
                erro: updateError.message
              });
            } else {
              results.push({
                pendencia_id: pendencia.id,
                funcionario_nome: funcionario.nome,
                status_anterior: pendencia.status,
                status_novo: novoStatus,
                sincronizada: true
              });
            }
          }
        } catch (error: any) {
          results.push({
            pendencia_id: pendencia.id,
            funcionario_nome: funcionario.nome,
            status_anterior: pendencia.status,
            status_novo: 'erro',
            sincronizada: false,
            erro: error.message
          });
        }
      }

      const sucessos = results.filter(r => r.sincronizada).length;
      const erros = results.filter(r => !r.sincronizada).length;

      console.log('✅ Sincronização concluída:', {
        total: results.length,
        sucessos,
        erros,
        detalhes: results
      });

      if (sucessos > 0) {
        toast({
          title: "Pendências Sincronizadas",
          description: `${sucessos} pendência(s) sincronizada(s)${erros > 0 ? ` e ${erros} erro(s)` : ''}`,
        });
        
        // Recarregar após sincronização
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (results.length === 0) {
        toast({
          title: "Nada para Sincronizar",
          description: "Todas as pendências já estão atualizadas",
        });
      } else {
        toast({
          title: "Erro na Sincronização",
          description: `${erros} erro(s) durante a sincronização`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Erro ao sincronizar pendências:', error);
      toast({
        title: "Erro",
        description: "Falha ao sincronizar pendências. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSincronizar}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {isLoading ? 'Sincronizando...' : 'Sincronizar Pendências'}
    </Button>
  );
};
