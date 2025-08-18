import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface RepairResult {
  funcionario_id: string;
  funcionario_nome: string;
  pendencia_criada: boolean;
  erro: string | null;
}

export const CorrigirPendenciasButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { empresaId } = useAuth();

  const handleCorrigirPendencias = async () => {
    if (!empresaId) {
      toast({
        title: "Erro",
        description: "Empresa não identificada",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔧 Executando reparo de pendências para empresa:', empresaId);

      const { data: repairResult, error } = await supabase
        .rpc('repair_missing_pendencias_for_empresa', { p_empresa_id: empresaId });

      if (error) {
        console.error('❌ Erro ao executar reparo:', error);
        throw error;
      }

      const results = repairResult as RepairResult[];
      const sucessos = results.filter(r => r.pendencia_criada).length;
      const erros = results.filter(r => !r.pendencia_criada).length;

      console.log('✅ Reparo concluído:', {
        total: results.length,
        sucessos,
        erros,
        detalhes: results
      });

      if (sucessos > 0) {
        toast({
          title: "Pendências Corrigidas",
          description: `${sucessos} pendência(s) criada(s) com sucesso${erros > 0 ? ` e ${erros} erro(s)` : ''}`,
        });
      } else if (results.length === 0) {
        toast({
          title: "Nenhuma Correção Necessária",
          description: "Todas as pendências já estão criadas corretamente",
        });
      } else {
        toast({
          title: "Erro no Reparo",
          description: `${erros} erro(s) encontrado(s) durante o reparo`,
          variant: "destructive",
        });
      }

      // Recarregar a página após sucesso para atualizar os dados
      if (sucessos > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Erro ao corrigir pendências:', error);
      toast({
        title: "Erro",
        description: "Falha ao corrigir pendências. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCorrigirPendencias}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      {isLoading ? 'Corrigindo...' : 'Corrigir Pendências'}
    </Button>
  );
};
