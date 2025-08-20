import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardRoute } from '@/utils/routePaths';
import SignInCard from '@/components/ui/SignInCard';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, isAuthenticated, role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirecionamento automático após autenticação
  useEffect(() => {
    if (!authLoading && isAuthenticated && role) {
      console.log('[LOGIN] Usuário autenticado detectado, redirecionando...', { role });
      
      const dashboardRoute = getDashboardRoute(role);
      console.log('[LOGIN] Redirecionando para:', dashboardRoute);
      navigate(dashboardRoute, { replace: true });
    }
  }, [isAuthenticated, role, authLoading, navigate]);

  const handleSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError('Credenciais inválidas. Verifique seu email e senha.');
        return;
      }

      // Se chegou aqui, o login foi bem-sucedido
      // O useAuth já vai lidar com o redirecionamento através do useEffect acima
    } catch (err) {
      console.error('Erro inesperado no login:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading se ainda estiver verificando autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B1120' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <SignInCard 
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default Login;
