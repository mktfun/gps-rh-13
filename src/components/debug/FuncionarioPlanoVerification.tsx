import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VerificationResult {
  funcionario: any;
  planosVinculados: any[];
  planosDisponiveis: any[];
  estatisticasPlanos: any[];
  error?: string;
}

export const FuncionarioPlanoVerification: React.FC = () => {
  const [funcionarioId, setFuncionarioId] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runVerification = async () => {
    if (!funcionarioId.trim()) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      const verificationResult: VerificationResult = {
        funcionario: null,
        planosVinculados: [],
        planosDisponiveis: [],
        estatisticasPlanos: []
      };

      // 1. Buscar dados do funcionário
      const { data: funcionario, error: funcionarioError } = await supabase
        .from('funcionarios')
        .select(`
          *,
          cnpj:cnpjs!inner(
            id,
            cnpj,
            razao_social
          )
        `)
        .eq('id', funcionarioId)
        .single();

      if (funcionarioError) {
        throw new Error(`Funcionário não encontrado: ${funcionarioError.message}`);
      }

      verificationResult.funcionario = funcionario;

      // 2. Buscar planos onde o funcionário está vinculado
      const { data: planosVinculados, error: planosVinculadosError } = await supabase
        .from('planos_funcionarios')
        .select(`
          *,
          plano:dados_planos(
            id,
            seguradora,
            tipo_seguro,
            valor_mensal
          )
        `)
        .eq('funcionario_id', funcionarioId);

      if (planosVinculadosError) {
        console.error('Erro ao buscar planos vinculados:', planosVinculadosError);
      }

      verificationResult.planosVinculados = planosVinculados || [];

      // 3. Buscar todos os planos disponíveis no CNPJ
      const { data: planosDisponiveis, error: planosDisponiveisError } = await supabase
        .from('dados_planos')
        .select('*')
        .eq('cnpj_id', funcionario.cnpj_id);

      if (planosDisponiveisError) {
        console.error('Erro ao buscar planos disponíveis:', planosDisponiveisError);
      }

      verificationResult.planosDisponiveis = planosDisponiveis || [];

      // 4. Verificar estatísticas dos planos (contagem de funcionários)
      const estatisticasPromises = planosDisponiveis?.map(async (plano) => {
        const { data: funcionariosNoPlano, error } = await supabase
          .from('planos_funcionarios')
          .select('id', { count: 'exact' })
          .eq('plano_id', plano.id)
          .eq('status', 'ativo');

        return {
          planoId: plano.id,
          seguradora: plano.seguradora,
          tipo: plano.tipo_seguro,
          funcionariosAtivos: funcionariosNoPlano?.length || 0,
          error: error?.message
        };
      }) || [];

      verificationResult.estatisticasPlanos = await Promise.all(estatisticasPromises);

      setResult(verificationResult);
    } catch (error) {
      setResult({
        funcionario: null,
        planosVinculados: [],
        planosDisponiveis: [],
        estatisticasPlanos: [],
        error: String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Verificação de Funcionário vs Planos</CardTitle>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor="funcionarioId">ID do Funcionário</Label>
            <Input
              id="funcionarioId"
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              placeholder="UUID do funcionário"
            />
          </div>
          <Button onClick={runVerification} disabled={isLoading || !funcionarioId.trim()}>
            {isLoading ? 'Verificando...' : 'Verificar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-6">
            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h3 className="font-semibold text-red-800">Erro</h3>
                <p className="text-red-600">{result.error}</p>
              </div>
            )}

            {result.funcionario && (
              <div>
                <h3 className="font-semibold mb-2">Dados do Funcionário</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p><strong>Nome:</strong> {result.funcionario.nome}</p>
                  <p><strong>CPF:</strong> {result.funcionario.cpf}</p>
                  <p><strong>Status:</strong> {result.funcionario.status}</p>
                  <p><strong>CNPJ:</strong> {result.funcionario.cnpj?.cnpj} - {result.funcionario.cnpj?.razao_social}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Planos Vinculados ({result.planosVinculados.length})</h3>
              <div className="space-y-2">
                {result.planosVinculados.length === 0 ? (
                  <p className="text-gray-500 bg-gray-50 p-2 rounded">Nenhum plano vinculado</p>
                ) : (
                  result.planosVinculados.map((vinculo, idx) => (
                    <div key={idx} className="bg-blue-50 p-3 rounded border">
                      <p><strong>Plano:</strong> {vinculo.plano?.seguradora} ({vinculo.plano?.tipo_seguro})</p>
                      <p><strong>Status no Plano:</strong> {vinculo.status}</p>
                      <p><strong>Data Vinculação:</strong> {new Date(vinculo.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Planos Disponíveis no CNPJ ({result.planosDisponiveis.length})</h3>
              <div className="space-y-2">
                {result.planosDisponiveis.map((plano, idx) => (
                  <div key={idx} className="bg-green-50 p-3 rounded border">
                    <p><strong>Seguradora:</strong> {plano.seguradora}</p>
                    <p><strong>Tipo:</strong> {plano.tipo_seguro}</p>
                    <p><strong>Valor:</strong> R$ {plano.valor_mensal}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Estatísticas dos Planos (Contagem Correta)</h3>
              <div className="space-y-2">
                {result.estatisticasPlanos.map((stats, idx) => (
                  <div key={idx} className="bg-yellow-50 p-3 rounded border">
                    <p><strong>Plano:</strong> {stats.seguradora} ({stats.tipo})</p>
                    <p><strong>Funcionários Ativos:</strong> {stats.funcionariosAtivos}</p>
                    {stats.error && <p className="text-red-600"><strong>Erro:</strong> {stats.error}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
