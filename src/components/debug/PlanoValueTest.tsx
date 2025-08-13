import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TestResult {
  planoInfo: any;
  funcionariosTotaisNoCnpj: number;
  funcionariosNoPlano: number;
  valorOriginal: number;
  valorCalculadoCorreto: number;
  error?: string;
}

export const PlanoValueTest: React.FC = () => {
  const [planoId, setPlanoId] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    if (!planoId.trim()) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      const testResult: TestResult = {
        planoInfo: null,
        funcionariosTotaisNoCnpj: 0,
        funcionariosNoPlano: 0,
        valorOriginal: 0,
        valorCalculadoCorreto: 0
      };

      // 1. Buscar informações do plano
      const { data: plano, error: planoError } = await supabase
        .from('dados_planos')
        .select('*')
        .eq('id', planoId)
        .single();

      if (planoError) {
        throw new Error(`Plano não encontrado: ${planoError.message}`);
      }

      testResult.planoInfo = plano;
      testResult.valorOriginal = plano.valor_mensal;

      // 2. Contar funcionários totais no CNPJ (método antigo - incorreto)
      const { data: funcionariosCnpj } = await supabase
        .from('funcionarios')
        .select('id', { count: 'exact' })
        .eq('cnpj_id', plano.cnpj_id)
        .eq('status', 'ativo');

      testResult.funcionariosTotaisNoCnpj = funcionariosCnpj?.length || 0;

      // 3. Contar funcionários no plano específico (método novo - correto)
      const { data: funcionariosPlano } = await supabase
        .from('planos_funcionarios')
        .select('id', { count: 'exact' })
        .eq('plano_id', planoId)
        .eq('status', 'ativo');

      testResult.funcionariosNoPlano = funcionariosPlano?.length || 0;

      // 4. Calcular valor correto para planos de saúde
      if (plano.tipo_seguro === 'saude') {
        testResult.valorCalculadoCorreto = testResult.funcionariosNoPlano * 200;
      } else {
        testResult.valorCalculadoCorreto = plano.valor_mensal;
      }

      setResult(testResult);
    } catch (error) {
      setResult({
        planoInfo: null,
        funcionariosTotaisNoCnpj: 0,
        funcionariosNoPlano: 0,
        valorOriginal: 0,
        valorCalculadoCorreto: 0,
        error: String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Teste de Cálculo de Valor do Plano</CardTitle>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor="planoId">ID do Plano</Label>
            <Input
              id="planoId"
              value={planoId}
              onChange={(e) => setPlanoId(e.target.value)}
              placeholder="UUID do plano"
            />
          </div>
          <Button onClick={runTest} disabled={isLoading || !planoId.trim()}>
            {isLoading ? 'Testando...' : 'Testar'}
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

            {result.planoInfo && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Informações do Plano</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p><strong>Seguradora:</strong> {result.planoInfo.seguradora}</p>
                    <p><strong>Tipo:</strong> {result.planoInfo.tipo_seguro}</p>
                    <p><strong>CNPJ ID:</strong> {result.planoInfo.cnpj_id}</p>
                    <p><strong>Valor Original:</strong> {formatCurrency(result.valorOriginal)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 border border-red-200 p-4 rounded">
                    <h3 className="font-semibold text-red-800 mb-2">❌ Método Antigo (Incorreto)</h3>
                    <p><strong>Funcionários no CNPJ:</strong> {result.funcionariosTotaisNoCnpj}</p>
                    <p><strong>Valor Calculado:</strong> {formatCurrency(result.funcionariosTotaisNoCnpj * 200)}</p>
                    <p className="text-sm text-red-600 mt-2">
                      Conta TODOS os funcionários do CNPJ, independente de estarem no plano
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded">
                    <h3 className="font-semibold text-green-800 mb-2">✅ Método Novo (Correto)</h3>
                    <p><strong>Funcionários no Plano:</strong> {result.funcionariosNoPlano}</p>
                    <p><strong>Valor Calculado:</strong> {formatCurrency(result.valorCalculadoCorreto)}</p>
                    <p className="text-sm text-green-600 mt-2">
                      Conta apenas funcionários realmente vinculados ao plano específico
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                  <h3 className="font-semibold text-blue-800 mb-2">📊 Resumo da Correção</h3>
                  <p><strong>Diferença na contagem:</strong> {result.funcionariosTotaisNoCnpj - result.funcionariosNoPlano} funcionários</p>
                  <p><strong>Diferença no valor:</strong> {formatCurrency((result.funcionariosTotaisNoCnpj - result.funcionariosNoPlano) * 200)}</p>
                  <p className="text-sm text-blue-600 mt-2">
                    {result.funcionariosTotaisNoCnpj > result.funcionariosNoPlano 
                      ? 'A correção resultará em um valor menor e mais preciso'
                      : 'Os valores são iguais (todos os funcionários estão no plano)'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
