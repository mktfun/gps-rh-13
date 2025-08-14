
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const SqlExecutor = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const executeSqlFix = async () => {
    setIsExecuting(true);
    setResult(null);
    setError(null);

    try {
      const sqlFix = `
        CREATE OR REPLACE FUNCTION get_relatorio_custos_empresa(
          p_empresa_id UUID,
          p_page_size INTEGER DEFAULT 10,
          p_page_offset INTEGER DEFAULT 0
        )
        RETURNS TABLE (
          cnpj_razao_social TEXT,
          funcionario_nome TEXT,
          funcionario_cpf TEXT,
          valor_individual NUMERIC,
          status TEXT,
          total_cnpj NUMERIC,
          total_count BIGINT,
          total_funcionarios_ativos BIGINT,
          total_cnpjs_com_plano BIGINT,
          total_geral NUMERIC,
          custo_medio_por_cnpj NUMERIC
        ) 
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          v_total_funcionarios_ativos BIGINT;
          v_total_cnpjs_com_plano BIGINT;
          v_total_geral NUMERIC;
          v_custo_medio_por_cnpj NUMERIC;
          v_total_count BIGINT;
        BEGIN
          -- Calcular totais globais corretamente
          WITH dados_agregados AS (
            SELECT 
              COUNT(DISTINCT CASE WHEN f.status = 'ativo' THEN f.id END) as funcionarios_ativos,
              COUNT(DISTINCT CASE WHEN dp.valor_mensal > 0 THEN c.id END) as cnpjs_com_plano,
              SUM(DISTINCT CASE WHEN dp.valor_mensal > 0 THEN dp.valor_mensal ELSE 0 END) as total_planos
            FROM cnpjs c
            LEFT JOIN funcionarios f ON f.cnpj_id = c.id
            LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
            WHERE c.empresa_id = p_empresa_id
          )
          SELECT 
            funcionarios_ativos,
            cnpjs_com_plano,
            total_planos,
            CASE 
              WHEN cnpjs_com_plano > 0 
              THEN total_planos / cnpjs_com_plano
              ELSE 0 
            END
          INTO 
            v_total_funcionarios_ativos,
            v_total_cnpjs_com_plano,
            v_total_geral,
            v_custo_medio_por_cnpj
          FROM dados_agregados;

          -- Contar total de funcionários únicos para paginação
          SELECT COUNT(DISTINCT f.id)
          INTO v_total_count
          FROM cnpjs c
          INNER JOIN funcionarios f ON f.cnpj_id = c.id
          WHERE c.empresa_id = p_empresa_id;

          -- Retornar dados paginados com valores corretos
          RETURN QUERY
          WITH funcionarios_com_dados AS (
            SELECT DISTINCT
              c.id as cnpj_id,
              c.razao_social,
              c.cnpj,
              f.id as funcionario_id,
              f.nome as funcionario_nome,
              f.cpf as funcionario_cpf,
              f.status,
              -- Pegar o valor do plano de vida (não saúde)
              COALESCE((
                SELECT dp.valor_mensal 
                FROM dados_planos dp 
                WHERE dp.cnpj_id = c.id 
                AND dp.tipo_seguro = 'vida' 
                AND dp.valor_mensal > 0
                LIMIT 1
              ), 0) as valor_plano_total,
              -- Contar funcionários ativos neste CNPJ
              (SELECT COUNT(*) FROM funcionarios f2 WHERE f2.cnpj_id = c.id AND f2.status = 'ativo') as funcionarios_ativos_cnpj
            FROM cnpjs c
            INNER JOIN funcionarios f ON f.cnpj_id = c.id
            WHERE c.empresa_id = p_empresa_id
            ORDER BY c.razao_social, f.nome
          )
          SELECT 
            fcd.razao_social as cnpj_razao_social,
            fcd.funcionario_nome,
            fcd.funcionario_cpf,
            -- Valor individual = valor do plano dividido pelo número de funcionários ativos do CNPJ
            CASE 
              WHEN fcd.funcionarios_ativos_cnpj > 0 AND fcd.status = 'ativo' AND fcd.valor_plano_total > 0
              THEN ROUND(fcd.valor_plano_total / fcd.funcionarios_ativos_cnpj, 2)
              ELSE 0
            END as valor_individual,
            fcd.status::TEXT,
            fcd.valor_plano_total as total_cnpj, -- Total do plano para o CNPJ
            v_total_count as total_count,
            v_total_funcionarios_ativos as total_funcionarios_ativos,
            v_total_cnpjs_com_plano as total_cnpjs_com_plano,
            v_total_geral as total_geral,
            v_custo_medio_por_cnpj as custo_medio_por_cnpj
          FROM funcionarios_com_dados fcd
          LIMIT p_page_size OFFSET p_page_offset;
        END;
        $$;
      `;

      console.log('🔧 Executando correção SQL...');
      const { data, error } = await supabase.rpc('exec_sql' as any, { sql: sqlFix });
      
      if (error) {
        throw error;
      }

      setResult({ success: true, message: 'Função SQL corrigida com sucesso!' });
      console.log('✅ Função SQL atualizada');

    } catch (err: any) {
      console.error('❌ Erro ao executar SQL:', err);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          🔧 SQL Fix Executor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-blue-700">
          Clique no botão abaixo para corrigir a função SQL que calcula os totais dos custos.
        </p>
        
        <Button 
          onClick={executeSqlFix} 
          disabled={isExecuting}
          className="w-full"
        >
          {isExecuting ? 'Executando...' : 'Corrigir Função SQL'}
        </Button>

        {result && (
          <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-200 rounded">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-800 text-sm">{result.message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-200 rounded">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
