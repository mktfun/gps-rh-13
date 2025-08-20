import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0B1120' }}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 
            className="text-3xl md:text-4xl font-bold text-white mb-6"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Pronto para otimizar sua gestão?
          </h2>
          
          <p 
            className="text-lg text-[#9CA3AF] mb-10 max-w-xl mx-auto"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Junte-se às corretoras que já transformaram sua gestão de planos de saúde com o GPS.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Button 
              size="lg" 
              className="text-xl px-12 py-6 bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-none font-medium rounded-xl shadow-lg hover:shadow-[#2563EB]/25 transition-all duration-300"
              asChild
            >
              <a href="mailto:contato@pulseseguros.com.br?subject=Começar com o GPS" className="inline-flex items-center gap-3">
                Começar Agora
                <ArrowRight className="h-6 w-6" />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
