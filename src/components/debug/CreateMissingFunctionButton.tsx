import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';

export const CreateMissingFunctionButton = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const createFunction = async () => {
    setIsCreating(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🔧 Criando função get_pendencias_empresa...');

      const functionSQL = `
        -- Create function to get pendencias from pendencias table for empresa context
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

        -- Grant execute permissions
        GRANT EXECUTE ON FUNCTION public.get_pendencias_empresa(UUID) TO authenticated;

        -- Add comment
        COMMENT ON FUNCTION public.get_pendencias_empresa(UUID) IS 
        'Returns all pending pendencias for a specific empresa from the pendencias table';
      `;

      const { error } = await supabase.rpc('exec_sql', {
        sql: functionSQL
      });

      if (error) {
        // Try alternative approach using raw SQL
        const { error: sqlError } = await supabase
          .from('pendencias')
          .select('*')
          .limit(0);
        
        if (sqlError) {
          throw new Error(`Erro ao executar SQL: ${error.message}`);
        }

        // Since we can't execute DDL directly, we'll show instructions
        setStatus('error');
        setMessage('Não foi possível criar a função automaticamente. Por favor, execute o SQL manualmente no painel do Supabase.');
        console.error('❌ Erro ao criar função:', error);
      } else {
        setStatus('success');
        setMessage('Função get_pendencias_empresa criada com sucesso!');
        console.log('✅ Função criada com sucesso');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error('❌ Erro ao criar função:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const testFunction = async () => {
    try {
      console.log('🧪 Testando função get_pendencias_empresa...');
      
      const { data, error } = await supabase.rpc('get_pendencias_empresa', {
        p_empresa_id: '00000000-0000-0000-0000-000000000000' // Test UUID
      });

      if (error) {
        setStatus('error');
        setMessage(`Função não existe ou erro: ${error.message}`);
      } else {
        setStatus('success');
        setMessage('Função existe e está funcionando!');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Criar Função get_pendencias_empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={createFunction}
            disabled={isCreating}
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            {isCreating ? 'Criando...' : 'Criar Função'}
          </Button>
          
          <Button
            onClick={testFunction}
            variant="outline"
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Testar Função
          </Button>
        </div>

        {status !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-md ${
            status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{message}</span>
          </div>
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">SQL para execução manual:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`CREATE OR REPLACE FUNCTION public.get_pendencias_empresa(p_empresa_id UUID)
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

GRANT EXECUTE ON FUNCTION public.get_pendencias_empresa(UUID) TO authenticated;`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
