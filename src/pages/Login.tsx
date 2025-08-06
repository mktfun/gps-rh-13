
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { PasswordRecoveryModal } from '@/components/auth/PasswordRecoveryModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  
  const { signIn, isAuthenticated, role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirecionamento automático após autenticação
  useEffect(() => {
    if (!authLoading && isAuthenticated && role) {
      console.log('[LOGIN] Usuário autenticado detectado, redirecionando...', { role });
      
      switch (role) {
        case 'corretora':
          console.log('[LOGIN] Redirecionando para /corretora');
          navigate('/corretora', { replace: true });
          break;
        case 'empresa':
          console.log('[LOGIN] Redirecionando para /empresa');
          navigate('/empresa', { replace: true });
          break;
        case 'admin':
          console.log('[LOGIN] Redirecionando para /admin');
          navigate('/admin', { replace: true });
          break;
        default:
          console.warn('[LOGIN] Role não reconhecido:', role);
      }
    }
  }, [isAuthenticated, role, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Shield,
      title: "Segurança Avançada",
      description: "Proteção de dados com criptografia de ponta"
    },
    {
      icon: Users,
      title: "Gestão Completa",
      description: "Controle total de funcionários e benefícios"
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Análises detalhadas e insights em tempo real"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Column - Visual/Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary to-primary/80 text-white p-12 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/5"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-white/5"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white/10"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center z-10 max-w-md"
        >
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">GPS</h1>
            <p className="text-xl text-white/90 mb-2">Gestor Pulse Seguros</p>
            <p className="text-white/70 leading-relaxed">
              A plataforma completa para gestão de seguros empresariais, 
              oferecendo controle total e insights inteligentes.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-6"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-start text-left space-x-4"
              >
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/80">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
          >
            <p className="text-sm text-white/90">
              <strong>Pulse Seguros</strong> - Inovação e excelência em gestão de seguros corporativos
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Column - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex items-center justify-center lg:hidden mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <div className="text-center">
                <CardTitle className="text-2xl font-bold">Bem-vindo de volta!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Faça login para acessar sua conta
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11"
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label 
                      htmlFor="remember" 
                      className="text-sm font-normal cursor-pointer"
                    >
                      Lembrar de mim
                    </Label>
                  </div>
                  
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm"
                    onClick={() => setShowRecoveryModal(true)}
                    disabled={isLoading}
                  >
                    Esqueceu a senha?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium"
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Entrar</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{' '}
                  <Button variant="link" className="px-0 font-semibold" asChild>
                    <a href="mailto:contato@pulseseguros.com.br?subject=Solicitação de Acesso - GPS">
                      Entre em contato
                    </a>
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-8"
          >
            <p className="text-xs text-muted-foreground">
              Ao fazer login, você concorda com nossos{' '}
              <Link to="/termos" className="underline hover:text-primary">
                Termos de Uso
              </Link>
              {' '}e{' '}
              <Link to="/privacidade" className="underline hover:text-primary">
                Política de Privacidade
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Password Recovery Modal */}
      <PasswordRecoveryModal 
        open={showRecoveryModal}
        onOpenChange={setShowRecoveryModal}
      />
    </div>
  );
};

export default Login;
