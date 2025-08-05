
import { supabase } from '@/integrations/supabase/client';

export const debugEmpresaAccess = async (empresaId: string) => {
  console.group(`🔍 Debug de Acesso - Empresa: ${empresaId}`);
  
  try {
    // 1. Verificar usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Usuário atual:', user?.id, user?.email);
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
      return;
    }

    // 2. Verificar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, empresa_id')
      .eq('id', user?.id)
      .single();
    
    console.log('👥 Perfil do usuário:', profile);
    if (profileError) console.error('❌ Erro no perfil:', profileError);

    // 3. Tentar buscar a empresa diretamente
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();
    
    console.log('🏢 Dados da empresa:', empresa);
    if (empresaError) console.error('❌ Erro na empresa:', empresaError);

    // 4. Verificar se pode acessar com RLS
    const { data: empresaRLS, error: rlsError } = await supabase
      .from('empresas')
      .select('id, nome, corretora_id')
      .eq('id', empresaId)
      .maybeSingle();
    
    console.log('🛡️ Teste RLS - Empresa acessível:', empresaRLS);
    if (rlsError) console.error('❌ Erro RLS:', rlsError);

    // 5. Resumo final
    const canAccess = !rlsError && empresaRLS;
    console.log(`✅ Pode acessar a empresa: ${canAccess ? 'SIM' : 'NÃO'}`);
    
  } catch (error) {
    console.error('💥 Erro crítico no debug:', error);
  } finally {
    console.groupEnd();
  }
};

// Função para executar no console do navegador
(window as any).debugEmpresaAccess = debugEmpresaAccess;
