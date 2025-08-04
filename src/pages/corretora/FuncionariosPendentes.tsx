
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const FuncionariosPendentes = () => {
  const { user } = useAuth();

  const { data: funcionarios, isLoading } = useQuery({
    queryKey: ['funcionariosPendentes', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          cpf,
          cargo,
          created_at,
          cnpjs!inner(
            id,
            razao_social,
            empresas!inner(id, nome)
          )
        `)
        .eq('cnpjs.empresas.corretora_id', user.id)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

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
                <UserPlus className="h-8 w-8 text-blue-600" />
                Funcionários Pendentes
              </h1>
              <p className="text-muted-foreground">
                Novos funcionários aguardando ativação
              </p>
            </div>
          </div>
        </div>

        {!funcionarios || funcionarios.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum funcionário pendente
              </h3>
              <p className="text-gray-600">
                Todos os funcionários foram ativados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {funcionarios.map((funcionario) => (
              <Card key={funcionario.id} className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold">{funcionario.nome}</div>
                      <div className="text-sm font-normal text-gray-600">
                        {(funcionario.cnpjs as any).empresas.nome} - {(funcionario.cnpjs as any).razao_social}
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      Pendente
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
                      <span className="text-sm font-medium text-gray-500">Data de Cadastro:</span>
                      <div className="text-sm">
                        {new Date(funcionario.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
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

export default FuncionariosPendentes;
