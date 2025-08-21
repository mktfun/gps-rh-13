import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function TestFunctionAmbiguity() {
  useEffect(() => {
    // Função para testar qual versão está sendo chamada
    (window as any).debugFunctionAmbiguity = async (empresaId = 'f5d59a88-965c-4e3a-b767-66a8f0df4e1a') => {
      console.log('🔍 [AMBIGUITY TEST] Testando qual versão da função está sendo usada');
      console.log('🔍 [AMBIGUITY TEST] EmpresaId:', empresaId);

      // Teste para identificar qual função o PostgREST está escolhendo
      console.log('\n=== TESTE 1: Chamada padrão (como no hook) ===');
      try {
        const result1 = await supabase.rpc('get_empresa_dashboard_metrics', {
          p_empresa_id: empresaId
        });
        console.log('📊 [TESTE 1] Resultado da chamada padrão:', result1);
        
        if (result1.data) {
          console.log('📊 [TESTE 1] Valores específicos:');
          console.log('- totalFuncionarios:', result1.data.totalFuncionarios);
          console.log('- funcionariosAtivos:', result1.data.funcionariosAtivos);
          console.log('- custoMensalTotal:', result1.data.custoMensalTotal);
          
          if (result1.data.totalFuncionarios === 0 && result1.data.funcionariosAtivos === 0) {
            console.error('🚨 [PROBLEMA IDENTIFICADO] Função retorna zeros! Isso indica que:');
            console.error('1. A função sem parâmetros está sendo chamada');
            console.error('2. A função com parâmetros não tem dados para esta empresa');
            console.error('3. Há erro na lógica SQL da função');
          }
        }
      } catch (error) {
        console.error('❌ [TESTE 1] Erro na chamada padrão:', error);
      }

      console.log('\n=== TESTE 2: Verificar se versão sem parâmetros existe ===');
      try {
        const result2 = await supabase.rpc('get_empresa_dashboard_metrics');
        console.log('🚨 [TESTE 2] Versão sem parâmetros funcionou! Isso é o problema:', result2);
        console.log('🚨 [TESTE 2] PostgREST pode estar escolhendo esta versão por engano');
      } catch (error) {
        console.log('✅ [TESTE 2] Versão sem parâmetros falhou (isso é bom):', error.message);
      }

      console.log('\n=== TESTE 3: Forçar especificação de tipos ===');
      try {
        // Tentar diferentes variações para evitar ambiguidade
        const result3 = await supabase
          .rpc('get_empresa_dashboard_metrics', {
            p_empresa_id: empresaId
          } as { p_empresa_id: string });
        
        console.log('📊 [TESTE 3] Com tipos forçados:', result3);
      } catch (error) {
        console.error('❌ [TESTE 3] Erro com tipos forçados:', error);
      }

      console.log('\n=== TESTE 4: Verificar schema da função ===');
      try {
        // Query para verificar quais versões da função existem
        const { data: functions, error: funcError } = await supabase
          .from('pg_proc')
          .select('proname, proargtypes, pronargs')
          .eq('proname', 'get_empresa_dashboard_metrics');
        
        if (funcError) {
          console.log('⚠️ [TESTE 4] Não foi possível verificar schema (normal):', funcError.message);
        } else {
          console.log('📋 [TESTE 4] Versões da função encontradas:', functions);
        }
      } catch (error) {
        console.log('⚠️ [TESTE 4] Erro ao verificar schema:', error);
      }

      console.log('\n=== CONCLUSÃO ===');
      console.log('Se TESTE 1 retorna zeros E TESTE 2 funciona, o problema é ambiguidade de função');
      console.log('Se TESTE 1 retorna zeros E TESTE 2 falha, o problema é SQL ou dados');
    };

    console.log('🛠️ [AMBIGUITY TEST] Função adicionada: window.debugFunctionAmbiguity(empresaId?)');
  }, []);

  return null;
}
