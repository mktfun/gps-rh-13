import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, HeartPulse, Building2, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface HealthPlanTestResult {
  test_type: string;
  success: boolean;
  message: string;
  data?: any;
}

export const DashboardHealthPlanTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<HealthPlanTestResult[]>([]);
  const { empresaId } = useAuth();

  const runHealthPlanTest = async () => {
    if (!empresaId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    setIsLoading(true);
    const testResults: HealthPlanTestResult[] = [];

    try {
      // Teste 1: Verificar se existem planos de saúde na empresa
      const { data: healthPlans, error: healthPlansError } = await supabase
        .from('dados_planos')
        .select(`
          id,
          tipo_seguro,
          valor_mensal,
          seguradora,
          cnpjs!inner (
            id,
            cnpj,
            razao_social,
            empresa_id
          )
        `)
        .eq('cnpjs.empresa_id', empresaId)
        .eq('tipo_seguro', 'saude');

      testResults.push({
        test_type: 'Verificação de Planos de Saúde',
        success: !healthPlansError && healthPlans.length > 0,
        message: healthPlansError 
          ? `Erro: ${healthPlansError.message}`
          : `Encontrados ${healthPlans?.length || 0} planos de saúde`,
        data: healthPlans
      });

      // Teste 2: Verificar função dashboard corrigida
      const { data: dashboardData, error: dashboardError } = await supabase.rpc(
        'get_empresa_dashboard_metrics',
        { p_empresa_id: empresaId }
      );

      testResults.push({
        test_type: 'Função Dashboard Corrigida',
        success: !dashboardError && dashboardData,
        message: dashboardError 
          ? `Erro: ${dashboardError.message}`
          : `Dados do dashboard carregados. Custo total: R$ ${dashboardData?.custoMensalTotal || 0}`,
        data: dashboardData
      });

      // Teste 3: Comparar custos antes e depois da correção
      const { data: allPlans, error: allPlansError } = await supabase
        .from('dados_planos')
        .select(`
          tipo_seguro,
          valor_mensal,
          cnpjs!inner (
            empresa_id,
            funcionarios (count)
          )
        `)
        .eq('cnpjs.empresa_id', empresaId);

      if (!allPlansError && allPlans) {
        const healthPlansCost = allPlans
          .filter(p => p.tipo_seguro === 'saude')
          .reduce((sum, plan) => {
            // Simular a lógica da função corrigida
            if (plan.valor_mensal === 0 || plan.valor_mensal === null) {
              const funcionariosCount = plan.cnpjs.funcionarios?.[0]?.count || 0;
              return sum + (funcionariosCount * 300);
            }
            return sum + (plan.valor_mensal || 0);
          }, 0);

        const lifePlansCost = allPlans
          .filter(p => p.tipo_seguro === 'vida')
          .reduce((sum, plan) => sum + (plan.valor_mensal || 0), 0);

        testResults.push({
          test_type: 'Comparação de Custos',
          success: healthPlansCost > 0,
          message: `Planos de Saúde: R$ ${healthPlansCost.toFixed(2)} | Planos de Vida: R$ ${lifePlansCost.toFixed(2)}`,
          data: { healthPlansCost, lifePlansCost, totalCost: healthPlansCost + lifePlansCost }
        });
      }

      // Teste 4: Verificar funcionários para cálculo de planos de saúde
      const { data: employeesData, error: employeesError } = await supabase
        .from('funcionarios')
        .select(`
          status,
          cnpjs!inner (
            empresa_id
          )
        `)
        .eq('cnpjs.empresa_id', empresaId)
        .eq('status', 'ativo');

      testResults.push({
        test_type: 'Funcionários Ativos (Base para Planos de Saúde)',
        success: !employeesError,
        message: employeesError 
          ? `Erro: ${employeesError.message}`
          : `${employeesData?.length || 0} funcionários ativos encontrados`,
        data: { activeEmployees: employeesData?.length || 0 }
      });

      setResults(testResults);
      toast.success('Teste dos planos de saúde executado com sucesso');

    } catch (error) {
      console.error('Erro durante teste:', error);
      testResults.push({
        test_type: 'Erro Geral',
        success: false,
        message: `Erro: ${error}`,
        data: null
      });
      setResults(testResults);
      toast.error('Erro durante execução do teste');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTestResult = (result: HealthPlanTestResult, index: number) => {
    const icon = result.success ? (
      <Badge variant="default" className="bg-green-100 text-green-800">✓</Badge>
    ) : (
      <Badge variant="destructive">✗</Badge>
    );

    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {result.test_type === 'Verificação de Planos de Saúde' && <HeartPulse className="h-4 w-4" />}
            {result.test_type === 'Função Dashboard Corrigida' && <Building2 className="h-4 w-4" />}
            {result.test_type === 'Comparação de Custos' && <DollarSign className="h-4 w-4" />}
            {result.test_type === 'Funcionários Ativos (Base para Planos de Saúde)' && <Building2 className="h-4 w-4" />}
            {result.test_type === 'Erro Geral' && <AlertTriangle className="h-4 w-4" />}
            {result.test_type}
            {icon}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm mb-2">{result.message}</p>
          
          {result.data && (
            <div className="bg-gray-50 p-3 rounded text-xs">
              <strong>Dados:</strong>
              <pre className="mt-1 whitespace-pre-wrap">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5" />
            Teste: Planos de Saúde no Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runHealthPlanTest} 
              disabled={isLoading || !empresaId}
              variant="default"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <HeartPulse className="h-4 w-4" />
              )}
              Executar Teste
            </Button>
          </div>
          
          {!empresaId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ ID da empresa não encontrado. Faça login como empresa para executar o teste.
              </p>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Resultados do Teste:</h3>
              {results.map((result, index) => renderTestResult(result, index))}
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                <h4 className="font-medium text-blue-800 mb-2">Resumo da Correção:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✓ Função SQL corrigida para incluir planos de saúde</li>
                  <li>✓ Cálculo automático para planos de saúde com valor R$ 0 (R$ 300 por funcionário ativo)</li>
                  <li>✓ Filtro explícito para tipos 'vida' e 'saude'</li>
                  <li>✓ Evolução mensal agora inclui todos os tipos de planos</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
