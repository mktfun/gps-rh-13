
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const CreateMissingFunctionButton = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createFunction = async () => {
    setIsCreating(true);
    setResult(null);
    setError(null);

    try {
      console.log('🔧 Tentando criar função get_pendencias_empresa...');

      const functionSQL = `
        CREATE OR REPLACE FUNCTION public.get_pendencias_empresa(p_empresa_id UUID)
        RETURNS TABLE (
          id UUID,
          protocolo TEXT,
          tipo TEXT,
          funcionario_nome TEXT,
          funcionario_cpf TEXT,
          cnpj TEXT,
          razao_social TEXT,
          descricao TEXT,
          data_criacao TIMESTAMPTZ,
          data_vencimento DATE,
          status TEXT,
          dias_em_aberto INTEGER,
          comentarios_count INTEGER
        )
        LANGUAGE SQL
        SECURITY DEFINER
        AS $$
          SELECT 
            p.id,
            p.protocolo,
            p.tipo,
            f.nome as funcionario_nome,
            f.cpf as funcionario_cpf,
            c.cnpj,
            c.razao_social,
            p.descricao,
            p.data_criacao,
            p.data_vencimento,
            p.status,
            EXTRACT(DAY FROM NOW() - p.data_criacao)::INTEGER as dias_em_aberto,
            p.comentarios_count
          FROM pendencias p
          INNER JOIN funcionarios f ON p.funcionario_id = f.id
          INNER JOIN cnpjs c ON p.cnpj_id = c.id
          WHERE c.empresa_id = p_empresa_id
            AND p.status = 'pendente'
          ORDER BY p.data_criacao DESC;
        $$;

        GRANT EXECUTE ON FUNCTION public.get_pendencias_empresa(UUID) TO authenticated;
      `;

      // Try using rpc call with type assertion for functions that may not exist
      const { data, error } = await supabase.rpc('exec_sql' as any, {
        sql: functionSQL
      });

      if (error) {
        console.log('⚠️ exec_sql não funcionou, função pode não existir:', error);
        setResult({ success: false, message: 'Função SQL deve ser criada manualmente no painel do Supabase.' });
      } else {
        console.log('✅ Função criada com sucesso');
        setResult({ success: true, message: 'Função criada com sucesso!' });
      }

    } catch (err: any) {
      console.error('❌ Erro ao criar função:', err);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setIsCreating(false);
    }
  };

  const testFunction = async () => {
    try {
      console.log('🧪 Testando função get_pendencias_empresa...');
      
      const { data, error } = await supabase.rpc('get_pendencias_empresa' as any, {
        p_empresa_id: '00000000-0000-0000-0000-000000000000'
      });

      if (error) {
        setError(`Erro ao testar função: ${error.message}`);
      } else {
        setResult({ 
          success: true, 
          message: `Função funcionando! Retornou ${Array.isArray(data) ? data.length : 0} pendências` 
        });
      }

    } catch (err: any) {
      console.error('❌ Erro ao testar função:', err);
      setError(err.message || 'Erro no teste');
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          🔧 Function Creator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-blue-700">
          Clique para criar a função SQL ausente ou testar se ela já existe.
        </p>
        
        <div className="flex gap-2">
          <Button 
            onClick={createFunction} 
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? 'Criando...' : 'Criar Função'}
          </Button>
          
          <Button 
            onClick={testFunction} 
            variant="outline"
            className="flex-1"
          >
            Testar Função
          </Button>
        </div>

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
