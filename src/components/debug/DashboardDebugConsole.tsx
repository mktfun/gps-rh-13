import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function DashboardDebugConsole() {
  const { user, empresaId } = useAuth();

  useEffect(() => {
    // Adicionar função de teste global no window
    (window as any).testDashboardFunction = async (testEmpresaId?: string) => {
      const empresaIdToTest = testEmpresaId || empresaId || user?.empresa_id || 'f5d59a88-965c-4e3a-b767-66a8f0df4e1a';

      console.log('🧪 [TESTE DIRETO] Iniciando teste da função do dashboard');
      console.log('🧪 [TESTE DIRETO] EmpresaId:', empresaIdToTest);

      try {
        const result = await supabase.rpc('get_empresa_dashboard_metrics', {
          p_empresa_id: empresaIdToTest
        });

        console.log('🧪 [TESTE DIRETO] Resultado completo:', result);
        console.log('🧪 [TESTE DIRETO] Data:', result.data);
        console.log('🧪 [TESTE DIRETO] Error:', result.error);

        if (result.data) {
          console.log('🧪 [TESTE DIRETO] Estrutura dos dados:');
          console.log('- totalFuncionarios:', result.data.totalFuncionarios);
          console.log('- funcionariosAtivos:', result.data.funcionariosAtivos);
          console.log('- custoMensalTotal:', result.data.custoMensalTotal);
          console.log('- custosPorCnpj:', result.data.custosPorCnpj);
          console.log('🧪 [TESTE DIRETO] Todos os campos:', JSON.stringify(result.data, null, 2));
        }

        return result;
      } catch (error) {
        console.error('🧪 [TESTE DIRETO] Erro no teste:', error);
        return { error };
      }
    };

    // Função para teste usando window.supabase (se disponível)
    (window as any).testWithWindowSupabase = async (testEmpresaId?: string) => {
      const empresaIdToTest = testEmpresaId || empresaId || user?.empresa_id || 'f5d59a88-965c-4e3a-b767-66a8f0df4e1a';

      console.log('🌐 [TESTE WINDOW] Testando com window.supabase');
      console.log('🌐 [TESTE WINDOW] EmpresaId:', empresaIdToTest);

      if (!(window as any).supabase) {
        console.error('❌ [TESTE WINDOW] window.supabase não está disponível');
        return { error: 'window.supabase não disponível' };
      }

      try {
        const result = await (window as any).supabase
          .rpc('get_empresa_dashboard_metrics', {
            p_empresa_id: empresaIdToTest
          });

        console.log('🌐 [TESTE WINDOW] Resultado:', result);
        return result;
      } catch (error) {
        console.error('🌐 [TESTE WINDOW] Erro:', error);
        return { error };
      }
    };

    // Adicionar função para testar diferentes versões
    (window as any).testAllDashboardVersions = async (testEmpresaId?: string) => {
      const empresaIdToTest = testEmpresaId || empresaId || user?.empresa_id || 'f5d59a88-965c-4e3a-b767-66a8f0df4e1a';
      
      console.log('🔍 [TESTE VERSÕES] Testando todas as versões da função');
      
      // Teste 1: Função com parâmetro (CORRETA)
      console.log('🔍 [TESTE 1] get_empresa_dashboard_metrics com parâmetro');
      try {
        const result1 = await supabase.rpc('get_empresa_dashboard_metrics', { 
          p_empresa_id: empresaIdToTest 
        });
        console.log('✅ [TESTE 1] Sucesso:', result1);
      } catch (error) {
        console.error('❌ [TESTE 1] Erro:', error);
      }

      // Teste 2: Função sem parâmetro (ERRADA)
      console.log('🔍 [TESTE 2] get_empresa_dashboard_metrics sem parâmetro');
      try {
        const result2 = await supabase.rpc('get_empresa_dashboard_metrics');
        console.log('❌ [TESTE 2] Não deveria funcionar:', result2);
      } catch (error) {
        console.log('✅ [TESTE 2] Erro esperado:', error);
      }

      // Teste 3: Função V3 (pode estar quebrada)
      console.log('🔍 [TESTE 3] get_empresa_dashboard_metrics_v3');
      try {
        const result3 = await supabase.rpc('get_empresa_dashboard_metrics_v3');
        console.log('❌ [TESTE 3] V3 resultado:', result3);
      } catch (error) {
        console.log('⚠️ [TESTE 3] V3 erro:', error);
      }
    };

    // Logs de informação
    console.log('🛠️ [DEBUG CONSOLE] Funções de teste adicionadas ao window:');
    console.log('- window.testDashboardFunction(empresaId?)');
    console.log('- window.testAllDashboardVersions(empresaId?)');
    console.log('📋 [DEBUG INFO] User info:', { user, empresaId });

  }, [user, empresaId]);

  return null; // Componente invisível
}

// Adicionar tipos para TypeScript
declare global {
  interface Window {
    testDashboardFunction: (empresaId?: string) => Promise<any>;
    testAllDashboardVersions: (empresaId?: string) => Promise<void>;
  }
}
