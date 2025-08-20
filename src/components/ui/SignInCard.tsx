import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clsx } from 'clsx';

interface SignInCardProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

const SignInCard: React.FC<SignInCardProps> = ({ onSubmit, isLoading = false, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && !isLoading) {
      await onSubmit(email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0B1120' }}>
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#2563EB]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#2563EB]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2563EB]/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Card with 3D Effect */}
        <motion.div
          className="relative"
          animate={{
            rotateX: isHovered ? 2 : 0,
            rotateY: isHovered ? 2 : 0,
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            transformStyle: "preserve-3d",
            perspective: "1000px",
          }}
        >
          <div
            className="relative rounded-2xl border border-white/10 overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 via-transparent to-[#2563EB]/5 pointer-events-none"></div>
            
            {/* Header */}
            <div className="relative p-8 pb-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#2563EB] rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MapPin className="text-white h-8 w-8" />
                </div>
                
                <h1 
                  className="text-2xl font-bold text-white mb-2"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  GPS
                </h1>
                
                <p 
                  className="text-sm text-[#9CA3AF] mb-6"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Gestor Planos de Saúde
                </p>
                
                <div className="text-center mb-6">
                  <h2 
                    className="text-xl font-semibold text-white mb-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Bem-vindo de volta
                  </h2>
                  <p 
                    className="text-[#9CA3AF] text-sm"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Faça login para acessar sua conta
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Form */}
            <div className="relative p-8 pt-0">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-white text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={clsx(
                        "pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-[#9CA3AF]",
                        "focus:border-[#2563EB] focus:ring-[#2563EB]/20 transition-all duration-300",
                        "hover:bg-white/10"
                      )}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-white text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={clsx(
                        "pl-10 pr-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-[#9CA3AF]",
                        "focus:border-[#2563EB] focus:ring-[#2563EB]/20 transition-all duration-300",
                        "hover:bg-white/10"
                      )}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-[#9CA3AF] hover:text-white"
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
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className={clsx(
                      "w-full h-12 bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-none font-medium rounded-xl",
                      "transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#2563EB]/25",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    )}
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
                </motion.div>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mt-6 text-center"
              >
                <p className="text-[#9CA3AF] text-sm">
                  Não tem uma conta?{' '}
                  <a 
                    href="mailto:contato@pulseseguros.com.br?subject=Solicitação de Acesso - GPS"
                    className="text-[#2563EB] hover:text-[#1d4ed8] transition-colors duration-300 font-medium"
                  >
                    Entre em contato
                  </a>
                </p>
              </motion.div>
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-[#2563EB]/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* 3D Shadow Effect */}
          <div 
            className="absolute inset-0 bg-black/20 rounded-2xl blur-xl"
            style={{
              transform: 'translateZ(-50px) translateY(25px)',
              zIndex: -1,
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignInCard;
