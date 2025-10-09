import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
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

  return (
    <section 
      className="relative h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
      >
        <div className="max-w-4xl mx-auto">
          {/* Título principal */}
          <motion.h1 
            variants={itemVariants} 
            className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Gestão de Benefícios Corporativos,{' '}
            <span 
              className="block bg-gradient-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent"
            >
              Finalmente Centralizada.
            </span>
          </motion.h1>

          {/* Parágrafo de apoio */}
          <motion.p 
            variants={itemVariants} 
            className="text-lg md:text-xl text-[#E0E0E0] mb-12 max-w-2xl mx-auto leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Simplifique a gestão de planos de saúde corporativos com uma plataforma completa 
            que conecta corretoras e empresas de forma inteligente e eficiente.
          </motion.p>

          {/* Botões de CTA */}
          <motion.div 
            variants={itemVariants} 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-none font-medium"
              asChild
            >
              <a href="mailto:contato@pulseseguros.com.br?subject=Solicitação de Demo - GPS" className="inline-flex items-center gap-2">
                Peça uma Demonstração
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 border-2 border-[#2563EB] text-[#2563EB] hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-transparent font-medium"
              asChild
            >
              <Link to="/login">
                Fazer Login
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
