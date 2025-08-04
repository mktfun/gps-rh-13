
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface BrandingData {
  logo_url?: string;
  cor_primaria?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  empresaId: string | null;
  branding: BrandingData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  refreshBranding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função auxiliar para buscar dados do perfil do usuário - CORRIGIDA
const getUserProfile = async (user: User): Promise<{ role: string | null; empresaId: string | null }> => {
  try {
    console.log(`[AUTH] Buscando perfil para usuário:`, user.email);
    
    // Busca direta na tabela profiles incluindo empresa_id
    const { data, error } = await supabase
      .from('profiles')
      .select('role, empresa_id')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('[AUTH] Erro ao buscar perfil:', error);
      return { role: null, empresaId: null };
    }
    
    console.log('[AUTH] Perfil obtido:', { role: data.role, empresaId: data.empresa_id });
    
    // Logs específicos para empresa_id
    if (data.empresa_id) {
      console.log(`[AUTH] Empresa ID definido: ${data.empresa_id}`);
    } else if (data.role === 'empresa') {
      console.error('[AUTH] Empresa ID não encontrado no perfil para usuário tipo empresa');
    }
    
    return { 
      role: data.role || null, 
      empresaId: data.empresa_id || null 
    };
    
  } catch (error) {
    console.error('[AUTH] Erro crítico na busca do perfil:', error);
    return { role: null, empresaId: null };
  }
};

// Função auxiliar para buscar dados de branding - CORRIGIDA
const getBrandingData = async (user: User, role: string): Promise<BrandingData | null> => {
  try {
    console.log(`[AUTH] Buscando dados de branding para usuário:`, user.email, 'Role:', role);
    
    if (role === 'corretora') {
      const { data, error } = await supabase
        .from('corretora_branding')
        .select('logo_url, cor_primaria')
        .eq('corretora_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[AUTH] Erro ao buscar branding da corretora:', error);
        return null;
      }
      
      if (!data) {
        console.log('[AUTH] Dados de branding da corretora não encontrados');
        return null;
      }
      
      console.log('[AUTH] Dados de branding da corretora obtidos:', data);
      return {
        logo_url: data.logo_url || undefined,
        cor_primaria: data.cor_primaria || undefined,
      };
    } else if (role === 'empresa') {
      // Buscar empresa_id do profile primeiro
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) {
        console.log('[AUTH] Empresa ID não encontrado no perfil');
        return null;
      }

      const { data, error } = await supabase
        .from('empresa_branding')
        .select('logo_url')
        .eq('empresa_id', profile.empresa_id)
        .maybeSingle();

      if (error) {
        console.error('[AUTH] Erro ao buscar branding da empresa:', error);
        return null;
      }
      
      if (!data) {
        console.log('[AUTH] Dados de branding da empresa não encontrados');
        return null;
      }
      
      console.log('[AUTH] Dados de branding da empresa obtidos:', data);
      return {
        logo_url: data.logo_url || undefined,
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('[AUTH] Erro crítico na busca de branding:', error);
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session?.user;

  const refreshBranding = async () => {
    if (user && role && (role === 'empresa' || role === 'corretora')) {
      console.log('[AUTH] Refreshing branding data...');
      const brandingData = await getBrandingData(user, role);
      console.log('[AUTH] New branding data:', brandingData);
      setBranding(brandingData);
    }
  };

  useEffect(() => {
    console.log('[AUTH] Iniciando AuthProvider...');
    
    // Timeout de emergência - se tudo travar, libera em 10 segundos
    const emergencyTimeout = setTimeout(() => {
      console.warn('[AUTH] TIMEOUT DE EMERGÊNCIA! Liberando autenticação após 10 segundos');
      setIsLoading(false);
    }, 10000);

    // CRÍTICO: Callback SÍNCRONO para evitar loops infinitos
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AUTH] Auth state change:', event, session?.user?.email || 'no user');
        
        const currentUser = session?.user ?? null;
        
        // Atualizações síncronas do estado
        setUser(currentUser);
        setSession(session);

        if (currentUser) {
          // CRÍTICO: Deferir todas as chamadas Supabase com setTimeout(0)
          setTimeout(() => {
            console.log('[AUTH] Sessão detectada. Buscando perfil UMA VEZ.');
            
            // Buscar perfil completo (role + empresa_id)
            getUserProfile(currentUser).then(({ role: userRole, empresaId: userEmpresaId }) => {
              console.log('[AUTH] Perfil completo definido:', { role: userRole, empresaId: userEmpresaId });
              setRole(userRole);
              setEmpresaId(userEmpresaId);
              
              // Buscar branding baseado no role
              if (userRole === 'corretora' || userRole === 'empresa') {
                getBrandingData(currentUser, userRole).then((brandingData) => {
                  console.log('[AUTH] Branding definido:', brandingData);
                  setBranding(brandingData);
                });
              } else {
                setBranding(null);
              }
            });
          }, 0);
        } else {
          console.log('[AUTH] Usuário deslogado, limpando dados');
          setRole(null);
          setEmpresaId(null);
          setBranding(null);
        }

        // CRÍTICO: Sempre para o loading, independente do que acontecer
        console.log('[AUTH] Finalizando loading...');
        clearTimeout(emergencyTimeout);
        setIsLoading(false);
      }
    );

    // Event listener para atualização do branding
    const handleBrandingUpdate = async () => {
      console.log('[AUTH] Recebido evento de atualização do branding');
      if (user && role) {
        await refreshBranding();
      }
    };

    window.addEventListener('auth-branding-updated', handleBrandingUpdate);

    return () => {
      console.log('[AUTH] Limpando listener...');
      clearTimeout(emergencyTimeout);
      authListener?.subscription.unsubscribe();
      window.removeEventListener('auth-branding-updated', handleBrandingUpdate);
    };
  }, []); // ARRAY VAZIO - CRÍTICO PARA EVITAR LOOPS!

  const signIn = async (email: string, password: string) => {
    console.log('[AUTH] Tentando fazer login...');
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[AUTH] Erro no login:', error);
        setIsLoading(false);
      }
      // Se sucesso, onAuthStateChange vai lidar com o resto
      
      return { error };
    } catch (error) {
      console.error('[AUTH] Erro inesperado no login:', error);
      setIsLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('[AUTH] Fazendo logout...');
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      // onAuthStateChange vai limpar o estado
      // Force redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('[AUTH] Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('[AUTH] Tentando registrar usuário...');
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    empresaId,
    branding,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    signUp,
    refreshBranding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
