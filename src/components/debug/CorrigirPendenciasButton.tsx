import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { criarPendenciasPendentesEmFalta } from '@/utils/criarPendenciasPendentes';
import { criarPendenciaSimplesDebug } from '@/utils/criarPendenciasSimplesDebug';

interface CorrigirPendenciasButtonProps {
  className?: string;
}

export const CorrigirPendenciasButton: React.FC<CorrigirPendenciasButtonProps> = ({ 
  className 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    created: number;
    message: string;
  } | null>(null);

  const handleCorrigirPendencias = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('🔧 Iniciando teste de criação de pendência...');
      const resultado = await criarPendenciaSimplesDebug();
      
      setResult(resultado);
      
      if (resultado.success) {
        if (resultado.created > 0) {
          toast.success(`${resultado.created} pendências criadas com sucesso!`);
        } else {
          toast.info(resultado.message);
        }
      } else {
        console.error('Detalhes do erro:', resultado);
        toast.error(`Erro: ${resultado.message}`);
      }
    } catch (error) {
      console.error('❌ Erro ao corrigir pendências:', error);
      toast.error('Erro inesperado ao corrigir pendências');
      setResult({
        success: false,
        created: 0,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
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
        
        {result && (
          <Badge 
            variant={result.success ? 'default' : 'destructive'}
            className="gap-1"
          >
            {result.success ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {result.created > 0 ? `${result.created} criadas` : result.message}
          </Badge>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground max-w-md">
        <p>
          <strong>🔧 Debug Tool:</strong> Cria pendências em falta para funcionários 
          que estão com status "pendente" em planos mas não possuem pendências 
          correspondentes na tabela de pendências.
        </p>
        {result && result.success && result.created > 0 && (
          <p className="mt-1 text-green-600">
            ✅ Pendências criadas! Recarregue a página de relatórios para ver as atualizações.
          </p>
        )}
      </div>
    </div>
  );
};
