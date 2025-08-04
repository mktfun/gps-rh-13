
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useResolverExclusao } from '@/hooks/useResolverExclusao';

const PendenciasExclusao = () => {
  const { user } = useAuth();
  const { mutate: resolverExclusao, isPending } = useResolverExclusao();

  const { data: pendencias, isLoading } = useQuery({
    queryKey: ['pendenciasExclusao', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          cpf,
          cargo,
          data_solicitacao_exclusao,
          motivo_exclusao,
          cnpjs!inner(
            id,
            razao_social,
            empresas!inner(id, nome)
          )
        `)
        .eq('cnpjs.empresas.corretora_id', user.id)
        .eq('status', 'exclusao_solicitada')
        .order('data_solicitacao_exclusao', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const handleResolverExclusao = (funcionarioId: string, acao: 'aprovar' | 'negar') => {
    resolverExclusao({ funcionarioId, acao });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/corretora">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                Pendências de Exclusão
              </h1>
              <p className="text-muted-foreground">
                Solicitações de exclusão aguardando sua análise
              </p>
            </div>
          </div>
        </div>

        {!pendencias || pendencias.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma pendência de exclusão
              </h3>
              <p className="text-gray-600">
                Todas as solicitações de exclusão foram processadas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendencias.map((funcionario) => (
              <Card key={funcionario.id} className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold">{funcionario.nome}</div>
                      <div className="text-sm font-normal text-gray-600">
                        {(funcionario.cnpjs as any).empresas.nome} - {(funcionario.cnpjs as any).razao_social}
                      </div>
                    </div>
                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                      Exclusão Solicitada
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">CPF:</span>
                      <div className="text-sm">{funcionario.cpf}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Cargo:</span>
                      <div className="text-sm">{funcionario.cargo}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Data da Solicitação:</span>
                      <div className="text-sm">
                        {funcionario.data_solicitacao_exclusao 
                          ? new Date(funcionario.data_solicitacao_exclusao).toLocaleDateString('pt-BR')
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {funcionario.motivo_exclusao && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-500">Motivo:</span>
                      <div className="text-sm bg-gray-50 p-2 rounded mt-1">
                        {funcionario.motivo_exclusao}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleResolverExclusao(funcionario.id, 'aprovar')}
                      disabled={isPending}
                    >
                      Aprovar Exclusão
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolverExclusao(funcionario.id, 'negar')}
                      disabled={isPending}
                    >
                      Negar Exclusão
                    </Button>
                    <Link to={`/corretora/empresas/${(funcionario.cnpjs as any).empresas.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Empresa
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendenciasExclusao;
