import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, CheckCircle } from 'lucide-react';

export const FixFinancialReportFunction = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const fixFinancialReportSQL = `
CREATE OR REPLACE FUNCTION get_relatorio_financeiro_corretora(p_corretora_id uuid)
RETURNS TABLE (
    empresa_id uuid,
    empresa_nome text,
    total_cnpjs_ativos bigint,
    total_funcionarios_segurados bigint,
    custo_total_mensal numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH planos_calculados AS (
        SELECT 
            dp.cnpj_id,
            dp.tipo_seguro,
            CASE 
                -- For health plans with no configured value, calculate based on employees
                WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                    (SELECT COUNT(*) FROM planos_funcionarios pf 
                     WHERE pf.plano_id = dp.id AND pf.status = 'ativo') * 200.0
                -- For health plans with configured value or life insurance plans, use the configured value
                ELSE COALESCE(dp.valor_mensal, 0)
            END as valor_calculado
        FROM dados_planos dp
        INNER JOIN cnpjs c ON dp.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = p_corretora_id
    )
    SELECT 
        e.id as empresa_id,
        e.nome as empresa_nome,
        COUNT(DISTINCT CASE WHEN c.status = 'ativo' AND EXISTS(SELECT 1 FROM planos_calculados pc WHERE pc.cnpj_id = c.id) THEN c.id END) as total_cnpjs_ativos,
        COUNT(DISTINCT CASE WHEN f.status IN ('ativo', 'pendente') THEN f.id END) as total_funcionarios_segurados,
        -- Sum calculated values for both life and health plans
        COALESCE(SUM(DISTINCT CASE 
            WHEN c.status = 'ativo' THEN 
                (SELECT SUM(pc.valor_calculado) FROM planos_calculados pc WHERE pc.cnpj_id = c.id)
            ELSE 0 
        END), 0) as custo_total_mensal
    FROM empresas e
    LEFT JOIN cnpjs c ON c.empresa_id = e.id
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id
    WHERE e.corretora_id = p_corretora_id
    GROUP BY e.id, e.nome
    HAVING COUNT(DISTINCT CASE WHEN c.status = 'ativo' AND EXISTS(SELECT 1 FROM planos_calculados pc WHERE pc.cnpj_id = c.id) THEN c.id END) > 0
    ORDER BY custo_total_mensal DESC;
END;
$$;
  `;

  const handleFixFunction = async () => {
    setIsExecuting(true);

    try {
      console.log('🔧 Executando correção da função de relatório financeiro...');

      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: fixFinancialReportSQL 
      });

      if (error) {
        console.error('❌ Erro ao executar SQL:', error);
        throw error;
      }

      console.log('✅ Função corrigida com sucesso:', data);

      toast({
        title: "Função Corrigida",
        description: "O relatório financeiro agora inclui planos de saúde corretamente",
      });

      // Recarregar a página após sucesso para atualizar os dados
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ Erro ao corrigir função:', error);
      toast({
        title: "Erro",
        description: "Falha ao corrigir a função do relatório financeiro",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Button
      onClick={handleFixFunction}
      disabled={isExecuting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isExecuting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isExecuting ? 'Corrigindo...' : 'Corrigir Relatório Financeiro'}
    </Button>
  );
};
