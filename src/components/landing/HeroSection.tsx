import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
const HeroSection = () => {
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };
  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };
  return <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-corporate-gray-50 to-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.05)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-[slide_20s_linear_infinite]"></div>
      
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center space-x-2 bg-corporate-blue/10 text-corporate-blue px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-corporate-green rounded-full animate-pulse"></span>
              <span>Nova versão disponível - GPS v2.0</span>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-bold mb-6 corporate-heading bg-gradient-to-r from-corporate-blue to-corporate-green bg-clip-text text-transparent">
            Gestão de Seguros Corporativos,{' '}
            <span className="block">Finalmente Simples.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">Centralize seus clientes, gerencie funcionários e automatize a comunicação entre Corretora e Empresas em uma única plataforma inteligente.</motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" className="text-lg px-8 py-4" asChild>
              <Link to="/login" className="inline-flex items-center gap-2">
                Fazer Login
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
              <a href="mailto:contato@pulseseguros.com.br?subject=Contato - GPS" className="inline-flex items-center gap-2">
                <Play className="h-5 w-5" />
                Ver Demonstração
              </a>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-corporate-green rounded-full"></div>
              <span>100% Seguro e Confiável</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-corporate-blue rounded-full"></div>
              <span>Suporte Especializado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-corporate-orange rounded-full"></div>
              <span>Implementação Rápida</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>;
};
export default HeroSection;