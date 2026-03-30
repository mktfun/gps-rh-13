
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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

const getUserData = async (user: User): Promise<{ role: string | null; empresaId: string | null; branding: BrandingData | null }> => {
  try {
    logger.info(`[AUTH] Buscando dados unificados para usuário:`, user.email);
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        role, 
        empresa_id, 
        corretora_branding!corretora_branding_corretora_id_fkey(logo_url, cor_primaria), 
        empresa_branding!empresa_branding_empresa_id_fkey(logo_url)
      `)
      .eq('id', user.id)
      .single();
    
    if (error) {
      logger.error('[AUTH] Erro ao buscar dados unificados:', error);
      return { role: null, empresaId: null, branding: null };
    }
    
    let branding: BrandingData | null = null;
    
    if (data.role === 'corretora') {
      const cb = Array.isArray(data.corretora_branding) ? data.corretora_branding[0] : data.corretora_branding;
      if (cb) {
        branding = {
          logo_url: cb.logo_url || undefined,
          cor_primaria: cb.cor_primaria || undefined
        };
      }
    } else if (data.role === 'empresa') {
      const eb = Array.isArray(data.empresa_branding) ? data.empresa_branding[0] : data.empresa_branding;
      if (eb) {
        branding = {
          logo_url: eb.logo_url || undefined
        };
      }
    }

    logger.info('[AUTH] Dados unificados obtidos:', { role: data.role, empresa_id: data.empresa_id, branding });
    
    return { 
      role: data.role || null, 
      empresaId: data.empresa_id || null,
      branding
    };
    
  } catch (error) {
    logger.error('[AUTH] Erro crítico na busca unificada de dados:', error);
    return { role: null, empresaId: null, branding: null };
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
      logger.info('[AUTH] Refreshing branding data...');
      const { branding: brandingData } = await getUserData(user);
      logger.info('[AUTH] New branding data:', brandingData);
      setBranding(brandingData);
    }
  };

  useEffect(() => {
    logger.info('[AUTH] Iniciando AuthProvider...');
    
    // Timeout de emergência - se tudo travar, libera em 10 segundos
    const emergencyTimeout = setTimeout(() => {
      logger.warn('[AUTH] TIMEOUT DE EMERGÊNCIA! Liberando autenticação após 10 segundos');
      setIsLoading(false);
    }, 10000);

    // CRÍTICO: Callback SÍNCRONO para evitar loops infinitos
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info('[AUTH] Auth state change:', event, session?.user?.email || 'no user');
        
        const currentUser = session?.user ?? null;
        
        // Atualizações síncronas do estado
        setUser(currentUser);
        setSession(session);

        if (currentUser) {
          // CRÍTICO: Deferir todas as chamadas Supabase com setTimeout(0)
          setTimeout(() => {
            logger.info('[AUTH] Sessão detectada. Buscando perfil + branding UMA VEZ.');
            
            getUserData(currentUser).then(({ role: userRole, empresaId: userEmpresaId, branding: userBranding }) => {
              logger.info('[AUTH] Perfil completo definido:', { role: userRole, empresaId: userEmpresaId, branding: userBranding });
              setRole(userRole);
              setEmpresaId(userEmpresaId);
              setBranding(userBranding);
              
              // CRÍTICO: Sempre para o loading AQUI, após a resolução
              clearTimeout(emergencyTimeout);
              setIsLoading(false);
            });
          }, 0);
        } else {
          logger.info('[AUTH] Usuário deslogado, limpando dados');
          setRole(null);
          setEmpresaId(null);
          setBranding(null);
          
          // CRÍTICO: Parar loading AQUI se não houver usuário
          clearTimeout(emergencyTimeout);
          setIsLoading(false);
        }
      }
    );

    // Event listener para atualização do branding
    const handleBrandingUpdate = async () => {
      logger.info('[AUTH] Recebido evento de atualização do branding');
      if (user && role) {
        await refreshBranding();
      }
    };

    window.addEventListener('auth-branding-updated', handleBrandingUpdate);

    return () => {
      logger.info('[AUTH] Limpando listener...');
      clearTimeout(emergencyTimeout);
      authListener?.subscription.unsubscribe();
      window.removeEventListener('auth-branding-updated', handleBrandingUpdate);
    };
  }, []); // ARRAY VAZIO - CRÍTICO PARA EVITAR LOOPS!

  const signIn = async (email: string, password: string) => {
    logger.info('[AUTH] Tentando fazer login...');
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logger.error('[AUTH] Erro no login:', error);
        setIsLoading(false);
      }
      // Se sucesso, onAuthStateChange vai lidar com o resto
      
      return { error };
    } catch (error) {
      logger.error('[AUTH] Erro inesperado no login:', error);
      setIsLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    logger.info('[AUTH] Fazendo logout...');
    
    // 1. Limpar estado React imediatamente
    setUser(null);
    setSession(null);
    setRole(null);
    setEmpresaId(null);
    setBranding(null);
    
    // 2. Tentar signOut no Supabase (best effort)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('[AUTH] Erro no signOut (ignorando):', error);
    }
    
    // 3. Fallback: limpar storage manualmente
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      });
    } catch (e) {
      // ignore storage errors
    }
    
    // 4. Redirect sem adicionar ao histórico
    window.location.replace('/login');
  };

  const signUp = async (email: string, password: string) => {
    logger.info('[AUTH] Tentando registrar usuário...');
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
