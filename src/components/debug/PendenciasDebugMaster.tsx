import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { usePendenciasEmpresa } from '@/hooks/usePendenciasEmpresa';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, UserCheck, Building2, AlertTriangle } from 'lucide-react';

interface RawPendencia {
  id: string;
  protocolo: string;
  tipo: string;
  funcionario_id: string;
  cnpj_id: string;
  corretora_id: string;
  status: string;
  data_criacao: string;
  data_vencimento: string;
  descricao: string;
}

interface PendenciaComJoins {
  id: string;
  protocolo: string;
  tipo: string;
  funcionario_id: string;
  cnpj_id: string;
  corretora_id: string;
  status: string;
  funcionarios?: {
    nome: string;
    cpf: string;
  };
  cnpjs?: {
    cnpj: string;
    razao_social: string;
    empresa_id: string;
  };
}

export const PendenciasDebugMaster = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [rawPendencias, setRawPendencias] = useState<RawPendencia[]>([]);
  const [pendenciasComJoins, setPendenciasComJoins] = useState<PendenciaComJoins[]>([]);
  const { toast } = useToast();
  const { user, role, empresaId: authEmpresaId } = useAuth();
  const { data: empresaIdFromHook, isLoading: isLoadingEmpresa } = useEmpresaId();
  const { data: pendenciasFromRPC, isLoading: isLoadingRPC } = usePendenciasEmpresa();

  const debugPendencias = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 INICIANDO DEBUG COMPLETO DE PENDÊNCIAS');
      console.log('📋 Dados do usuário:', {
        userId: user.id,
        userEmail: user.email,
        role,
        authEmpresaId,
        empresaIdFromHook
      });

      // 1. Buscar todas as pendências raw da tabela
      console.log('📊 1. Buscando pendências raw...');
      const { data: rawData, error: rawError } = await supabase
        .from('pendencias')
        .select('*')
        .eq('status', 'pendente');

      if (rawError) {
        console.error('�� Erro ao buscar pendências raw:', rawError);
        throw rawError;
      }

      console.log(`✅ ${rawData?.length || 0} pendências raw encontradas`);
      setRawPendencias(rawData || []);

      // 2. Buscar pendências com joins (simular o que a RPC faz)
      console.log('🔗 2. Buscando pendências com joins...');
      const { data: joinData, error: joinError } = await supabase
        .from('pendencias')
        .select(`
          *,
          funcionarios(nome, cpf),
          cnpjs(cnpj, razao_social, empresa_id)
        `)
        .eq('status', 'pendente');

      if (joinError) {
        console.error('❌ Erro ao buscar pendências com joins:', joinError);
        throw joinError;
      }

      console.log(`✅ ${joinData?.length || 0} pendências com joins encontradas`);
      setPendenciasComJoins(joinData || []);

      // 3. Filtrar por empresa_id se necessário
      const empresaId = empresaIdFromHook || authEmpresaId;
      if (empresaId && role === 'empresa') {
        const filtradas = joinData?.filter(p => 
          (p.cnpjs as any)?.empresa_id === empresaId
        ) || [];
        console.log(`🎯 Após filtro por empresa (${empresaId}): ${filtradas.length} pendências`);
      }

      // 4. Comparar com resultado da RPC
      console.log('🔄 4. Comparando com resultado da RPC function...');
      console.log(`📈 RPC function retornou: ${pendenciasFromRPC?.length || 0} pendências`);

      toast({
        title: "Debug Concluído",
        description: `Encontradas ${rawData?.length || 0} pendências raw, ${joinData?.length || 0} com joins`,
      });

    } catch (error) {
      console.error('💥 Erro no debug:', error);
      toast({
        title: "Erro no Debug",
        description: "Falha ao executar debug. Verifique o console.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const empresaId = empresaIdFromHook || authEmpresaId;
  const pendenciasFiltradas = pendenciasComJoins.filter(p => 
    !empresaId || role !== 'empresa' || (p.cnpjs as any)?.empresa_id === empresaId
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Debug Master de Pendências
        </CardTitle>
        <CardDescription>
          Diagnóstico completo do sistema de pendências
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Usuário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Usuário Logado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs">
                <strong>ID:</strong> {user?.id || 'N/A'}
              </div>
              <div className="text-xs">
                <strong>Email:</strong> {user?.email || 'N/A'}
              </div>
              <div className="text-xs">
                <strong>Role:</strong> <Badge variant="outline">{role || 'N/A'}</Badge>
              </div>
              <div className="text-xs">
                <strong>Empresa ID (Auth):</strong> {authEmpresaId || 'N/A'}
              </div>
              <div className="text-xs">
                <strong>Empresa ID (Hook):</strong> {isLoadingEmpresa ? 'Carregando...' : empresaIdFromHook || 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Resultados RPC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs">
                <strong>Status RPC:</strong> {isLoadingRPC ? 'Carregando...' : 'Concluído'}
              </div>
              <div className="text-xs">
                <strong>Pendências RPC:</strong> {pendenciasFromRPC?.length || 0}
              </div>
              {pendenciasFromRPC && pendenciasFromRPC.length > 0 && (
                <div className="text-xs">
                  <strong>Exemplo RPC:</strong>
                  <div className="mt-1 p-2 bg-muted rounded text-xs">
                    {pendenciasFromRPC[0].protocolo} - {pendenciasFromRPC[0].tipo}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Botões de Debug */}
        <div className="text-center space-y-4">
          <Button
            onClick={debugPendencias}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {isLoading ? 'Executando Debug...' : 'Executar Debug Completo'}
          </Button>

          {role === 'empresa' && (
            <div>
              <Button
                variant="outline"
                onClick={() => window.open('/empresa/relatorios/pendencias', '_blank')}
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                Abrir Relatório de Pendências
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Abre o relatório oficial de pendências da empresa
              </p>
            </div>
          )}
        </div>

        {/* Resultados do Debug */}
        {(rawPendencias.length > 0 || pendenciasComJoins.length > 0) && (
          <>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pendências Raw */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    Pendências Raw ({rawPendencias.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Direto da tabela pendencias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {rawPendencias.slice(0, 5).map((p) => (
                      <div key={p.id} className="p-2 bg-muted rounded text-xs">
                        <div><strong>Protocolo:</strong> {p.protocolo}</div>
                        <div><strong>Tipo:</strong> {p.tipo}</div>
                        <div><strong>CNPJ ID:</strong> {p.cnpj_id}</div>
                        <div><strong>Corretora ID:</strong> {p.corretora_id}</div>
                        <div><strong>Funcionário ID:</strong> {p.funcionario_id || 'NULL'}</div>
                      </div>
                    ))}
                    {rawPendencias.length > 5 && (
                      <div className="text-center text-xs text-muted-foreground">
                        ... e mais {rawPendencias.length - 5}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pendências com Joins */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    Com Joins ({pendenciasFiltradas.length}/{pendenciasComJoins.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Com dados de funcionários e CNPJs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pendenciasFiltradas.slice(0, 5).map((p) => (
                      <div key={p.id} className="p-2 bg-muted rounded text-xs">
                        <div><strong>Protocolo:</strong> {p.protocolo}</div>
                        <div><strong>Funcionário:</strong> {(p.funcionarios as any)?.nome || 'N/A'}</div>
                        <div><strong>Empresa:</strong> {(p.cnpjs as any)?.razao_social || 'N/A'}</div>
                        <div><strong>CNPJ:</strong> {(p.cnpjs as any)?.cnpj || 'N/A'}</div>
                        <div><strong>Empresa ID:</strong> {(p.cnpjs as any)?.empresa_id || 'N/A'}</div>
                      </div>
                    ))}
                    {pendenciasFiltradas.length > 5 && (
                      <div className="text-center text-xs text-muted-foreground">
                        ... e mais {pendenciasFiltradas.length - 5}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
