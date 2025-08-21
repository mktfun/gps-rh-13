import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  data?: any;
  error?: string;
  details?: string;
}

export function DashboardDebugPanel() {
  const { user, empresaId } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  const realEmpresaId = empresaId || user?.empresa_id || 'f5d59a88-965c-4e3a-b767-66a8f0df4e1a';

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results: TestResult[] = [];

    // Teste 1: Informações do usuário
    results.push({
      name: 'Informações do Usuário',
      status: 'success',
      data: {
        empresaId,
        userEmpresaId: user?.empresa_id,
        userId: user?.id,
        userRole: user?.role,
        realEmpresaId
      },
      details: `EmpresaId que será usado: ${realEmpresaId}`
    });

    // Teste 2: Função com parâmetros (CORRETA)
    try {
      const result1 = await supabase.rpc('get_empresa_dashboard_metrics', {
        p_empresa_id: realEmpresaId
      });
      
      results.push({
        name: 'Função COM parâmetros (Correta)',
        status: result1.error ? 'error' : 'success',
        data: result1.data,
        error: result1.error?.message,
        details: result1.data ? `Funcionários: ${result1.data.totalFuncionarios || 0}, Custo: R$ ${result1.data.custoMensalTotal || 0}` : 'Sem dados'
      });
    } catch (error) {
      results.push({
        name: 'Função COM parâmetros (Correta)',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Teste 3: Função sem parâmetros (PROBLEMÁTICA)
    try {
      const result2 = await supabase.rpc('get_empresa_dashboard_metrics');
      
      results.push({
        name: 'Função SEM parâmetros (Problemática)',
        status: 'warning',
        data: result2.data,
        error: result2.error?.message,
        details: '🚨 Se esta função funciona, pode estar causando o problema!'
      });
    } catch (error) {
      results.push({
        name: 'Função SEM parâmetros (Problemática)',
        status: 'success',
        details: '✅ Esta função falhou - isso é bom! Significa que não há ambiguidade.',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Teste 4: Função V3
    try {
      const result3 = await supabase.rpc('get_empresa_dashboard_metrics_v3');
      
      results.push({
        name: 'Função V3',
        status: 'warning',
        data: result3.data,
        error: result3.error?.message,
        details: 'Versão V3 da função'
      });
    } catch (error) {
      results.push({
        name: 'Função V3',
        status: 'success',
        details: '✅ V3 não existe ou falhou - isso é normal',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    // Executar testes automaticamente ao carregar
    runTests();
  }, [realEmpresaId]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setIsVisible(true)} variant="outline" size="sm">
          🐛 Debug
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <RefreshCw className="h-4 w-4 text-gray-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Testando...</Badge>;
    }
  };

  return (
    <div className="fixed top-4 right-4 w-96 max-h-[80vh] overflow-y-auto z-50">
      <Card className="shadow-lg border-2 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                🐛 Debug Dashboard
              </CardTitle>
              <CardDescription>
                Diagnosticando problema dos dados zerados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                variant="outline" 
                size="sm"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {testResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium text-sm">{result.name}</span>
                </div>
                {getStatusBadge(result.status)}
              </div>
              
              {result.details && (
                <p className="text-xs text-gray-600 mb-2">{result.details}</p>
              )}
              
              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                  <p className="text-xs text-red-700 font-mono">{result.error}</p>
                </div>
              )}
              
              {result.data && (
                <div className="bg-gray-50 border rounded p-2">
                  <p className="text-xs font-mono text-gray-700">
                    {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : String(result.data)}
                  </p>
                </div>
              )}
            </div>
          ))}
          
          {testResults.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              {isRunning ? 'Executando testes...' : 'Nenhum teste executado ainda'}
            </div>
          )}
          
          {/* Diagnóstico automático */}
          {testResults.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🎯 Diagnóstico</h4>
              <div className="text-sm text-blue-800">
                {(() => {
                  const funcComParam = testResults.find(r => r.name.includes('COM parâmetros'));
                  const funcSemParam = testResults.find(r => r.name.includes('SEM parâmetros'));
                  
                  if (funcComParam?.status === 'success' && funcComParam.data?.totalFuncionarios === 0) {
                    if (funcSemParam?.status === 'warning') {
                      return '🚨 PROBLEMA: Função sem parâmetros está funcionando! Isso causa ambiguidade no PostgREST.';
                    } else {
                      return '⚠️ Função correta retorna zeros. Problema pode ser: dados não existem, SQL incorreto, ou empresa errada.';
                    }
                  } else if (funcComParam?.status === 'success' && funcComParam.data?.totalFuncionarios > 0) {
                    return '✅ Função está funcionando! Se dashboard mostra zeros, problema é no hook ou cache do React Query.';
                  } else if (funcComParam?.status === 'error') {
                    return '❌ Função com parâmetros está falhando. Verifique se existe no Supabase.';
                  }
                  
                  return 'Executando diagnóstico...';
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
