import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Search, AlertTriangle, CheckCircle } from 'lucide-react';

export const InvestigarPendenciaEspecifica = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const { toast } = useToast();
  const { user, empresaId } = useAuth();

  const investigarPendencia = async () => {
    if (!user?.id || !empresaId) {
      toast({
        title: "Erro",
        description: "Usuário ou empresa não identificado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDebugResults(null);

    try {
      console.log('🔍 Investigando pendência específica para empresa:', empresaId);

      // 1. Buscar funcionários com status pendente da empresa
      const { data: funcionariosPendentes, error: funcError } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          cpf,
          status,
          cnpj_id,
          created_at,
          cnpjs!inner (
            id,
            razao_social,
            cnpj,
            empresa_id
          )
        `)
        .eq('status', 'pendente')
        .eq('cnpjs.empresa_id', empresaId);

      if (funcError) {
        console.error('❌ Erro ao buscar funcionários pendentes:', funcError);
        throw funcError;
      }

      console.log('👥 Funcionários pendentes encontrados:', funcionariosPendentes);

      // 2. Para cada funcionário pendente, verificar se existe pendência
      const investigacao = [];
      for (const func of funcionariosPendentes || []) {
        // Buscar pendência existente para este funcionário
        const { data: pendenciaExistente, error: pendError } = await supabase
          .from('pendencias')
          .select('*')
          .eq('funcionario_id', func.id)
          .eq('tipo', 'ativacao');

        // Buscar empresa e corretora
        const { data: empresaData, error: empError } = await supabase
          .from('empresas')
          .select('corretora_id')
          .eq('id', empresaId)
          .single();

        investigacao.push({
          funcionario: func,
          pendencia_existente: pendenciaExistente,
          empresa_corretora_id: empresaData?.corretora_id,
          problemas: {
            sem_pendencia: !pendenciaExistente || pendenciaExistente.length === 0,
            corretora_incorreta: pendenciaExistente?.some(p => p.corretora_id !== empresaData?.corretora_id),
            status_incorreto: pendenciaExistente?.some(p => p.status !== 'pendente'),
          }
        });
      }

      // 3. Tentar criar pendência faltante se necessário
      const resultados = [];
      for (const item of investigacao) {
        if (item.problemas.sem_pendencia) {
          try {
            console.log('🔧 Criando pendência para funcionário:', item.funcionario.nome);
            
            const protocolo = `ACT-${Date.now()}-${item.funcionario.id.substring(0, 8)}`;
            const dataVencimento = new Date();
            dataVencimento.setDate(dataVencimento.getDate() + 7); // 7 dias para vencer

            const { data: novaPendencia, error: createError } = await supabase
              .from('pendencias')
              .insert({
                protocolo,
                tipo: 'ativacao',
                descricao: `Ativação pendente para ${item.funcionario.nome}`,
                funcionario_id: item.funcionario.id,
                cnpj_id: item.funcionario.cnpj_id,
                corretora_id: item.empresa_corretora_id,
                status: 'pendente',
                data_vencimento: dataVencimento.toISOString().split('T')[0]
              })
              .select()
              .single();

            if (createError) {
              console.error('❌ Erro ao criar pendência:', createError);
              resultados.push({
                funcionario: item.funcionario.nome,
                acao: 'criar_pendencia',
                sucesso: false,
                erro: createError.message
              });
            } else {
              console.log('✅ Pendência criada:', novaPendencia);
              resultados.push({
                funcionario: item.funcionario.nome,
                acao: 'criar_pendencia',
                sucesso: true,
                pendencia_id: novaPendencia.id
              });
            }
          } catch (error: any) {
            resultados.push({
              funcionario: item.funcionario.nome,
              acao: 'criar_pendencia',
              sucesso: false,
              erro: error.message
            });
          }
        }
      }

      setDebugResults({
        funcionariosPendentes: funcionariosPendentes?.length || 0,
        investigacao,
        resultados,
        empresaId,
        userId: user.id
      });

      const sucessos = resultados.filter(r => r.sucesso).length;
      if (sucessos > 0) {
        toast({
          title: "Pendências Criadas",
          description: `${sucessos} pendência(s) criada(s) com sucesso`,
        });
        
        // Aguardar um pouco e recarregar
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else if (funcionariosPendentes?.length === 0) {
        toast({
          title: "Nenhum Funcionário Pendente",
          description: "Não há funcionários com status pendente nesta empresa",
        });
      } else {
        toast({
          title: "Investigação Concluída",
          description: "Verifique os detalhes abaixo",
        });
      }

    } catch (error) {
      console.error('❌ Erro na investigação:', error);
      toast({
        title: "Erro",
        description: "Falha ao investigar pendências",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Investigar Pendência Específica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Esta ferramenta investiga funcionários pendentes e cria as pendências faltantes.
        </p>
        
        <Button
          onClick={investigarPendencia}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Investigando...' : 'Investigar e Corrigir'}
        </Button>

        {debugResults && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded">
                <div className="font-medium">Funcionários Pendentes</div>
                <div className="text-lg font-bold text-blue-600">
                  {debugResults.funcionariosPendentes}
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded">
                <div className="font-medium">Pendências Criadas</div>
                <div className="text-lg font-bold text-green-600">
                  {debugResults.resultados?.filter((r: any) => r.sucesso).length || 0}
                </div>
              </div>
            </div>

            {debugResults.investigacao?.map((item: any, index: number) => (
              <div key={index} className="p-3 border rounded">
                <div className="font-medium">{item.funcionario.nome}</div>
                <div className="text-xs text-muted-foreground">
                  CPF: {item.funcionario.cpf} | CNPJ: {item.funcionario.cnpjs.razao_social}
                </div>
                
                <div className="mt-2 flex gap-2">
                  {item.problemas.sem_pendencia && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                      Sem pendência
                    </span>
                  )}
                  {item.problemas.corretora_incorreta && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                      Corretora incorreta
                    </span>
                  )}
                  {item.problemas.status_incorreto && (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                      Status incorreto
                    </span>
                  )}
                </div>
              </div>
            ))}

            {debugResults.resultados?.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium">Resultados das Correções:</div>
                {debugResults.resultados.map((result: any, index: number) => (
                  <div key={index} className={`p-2 rounded text-xs ${
                    result.sucesso ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      {result.sucesso ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      <span>{result.funcionario}: {result.acao}</span>
                    </div>
                    {result.erro && (
                      <div className="mt-1 text-xs opacity-75">{result.erro}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Ver dados completos</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(debugResults, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
