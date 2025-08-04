
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const CTASection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section className="py-20 bg-corporate-gradient relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%,transparent_100%)] bg-[length:60px_60px]"></div>
      
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.h2 
            variants={itemVariants}
            className="text-3xl md:text-5xl font-bold mb-6 text-white"
          >
            Pronto para otimizar sua gestão?
          </motion.h2>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Junte-se a centenas de empresas que já transformaram sua gestão de seguros 
            corporativos com o GPS. Comece hoje mesmo!
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-4 bg-white text-corporate-blue hover:bg-white/90 corporate-shadow-lg"
              asChild
            >
              <Link to="/login" className="inline-flex items-center gap-2">
                Começar Agora
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <a 
                href="mailto:contato@pulseseguros.com.br?subject=Solicitação de Demo - GPS"
                className="inline-flex items-center gap-2"
              >
                <Mail className="h-5 w-5" />
                Solicitar Demo
              </a>
            </Button>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            variants={itemVariants}
            className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Email</h3>
              <a 
                href="mailto:contato@pulseseguros.com.br" 
                className="text-white/80 hover:text-white transition-colors"
              >
                contato@pulseseguros.com.br
              </a>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Telefone</h3>
              <a 
                href="tel:+5511999999999" 
                className="text-white/80 hover:text-white transition-colors"
              >
                (11) 99999-9999
              </a>
            </div>
          </motion.div>

          {/* Bottom Text */}
          <motion.div 
            variants={itemVariants}
            className="mt-16 pt-8 border-t border-white/20"
          >
            <p className="text-white/70 text-sm">
              Implementação gratuita • Suporte especializado • Sem permanência
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
