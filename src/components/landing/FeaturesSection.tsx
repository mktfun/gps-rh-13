import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileSpreadsheet, MessageSquare } from 'lucide-react';

const FeaturesSection = () => {
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
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

  const features = [
    {
      icon: Users,
      title: "Gestão de Funcionários",
      description: "Controle completo de funcionários, dependentes e beneficiários em uma única plataforma integrada."
    },
    {
      icon: FileSpreadsheet,
      title: "Relatórios Inteligentes",
      description: "Dashboards em tempo real com insights financeiros e operacionais para tomada de decisão estratégica."
    },
    {
      icon: MessageSquare,
      title: "Comunicação Centralizada",
      description: "Canal direto entre corretoras e empresas com histórico completo de atendimentos e protocolos."
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0B1120' }}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Tudo que você precisa, em um só lugar.
          </h2>
          <p 
            className="text-lg text-[#9CA3AF] max-w-2xl mx-auto"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Funcionalidades pensadas para simplificar e otimizar a gestão de planos de saúde corporativos.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group relative p-8 rounded-2xl border border-white/10 hover:border-[#2563EB]/50 transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
              whileHover={{ y: -5 }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#2563EB]/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#2563EB]/30 transition-colors duration-300">
                  <feature.icon className="h-8 w-8 text-[#2563EB]" />
                </div>
                
                <h3 
                  className="text-xl font-semibold text-white mb-4"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {feature.title}
                </h3>
                
                <p 
                  className="text-[#9CA3AF] leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {feature.description}
                </p>
              </div>

              {/* Efeito de brilho ao hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 rounded-2xl border border-[#2563EB]/30 shadow-[0_0_20px_rgba(37,99,235,0.3)]"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
