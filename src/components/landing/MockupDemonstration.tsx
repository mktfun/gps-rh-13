
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MockupDemonstration = () => {
  const mockupVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-corporate-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={mockupVariants}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 corporate-heading">
            Veja o GPS em Ação
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Interface intuitiva e poderosa que simplifica a gestão de seguros corporativos
          </p>
        </motion.div>

        {/* Mockup Cards Grid */}
        <motion.div 
          variants={mockupVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {/* Dashboard Card */}
          <motion.div variants={cardVariants}>
            <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-corporate-blue to-corporate-blue-light h-48 flex items-center justify-center relative">
                  <div className="text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded"></div>
                    </div>
                    <h3 className="font-semibold">Dashboard Executivo</h3>
                  </div>
                  <Badge className="absolute top-3 right-3 bg-white/20 text-white border-white/30">
                    Novo
                  </Badge>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold mb-2">Visão Estratégica</h4>
                  <p className="text-sm text-muted-foreground">
                    Métricas em tempo real, KPIs importantes e insights para tomada de decisão.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Funcionários Card */}
          <motion.div variants={cardVariants}>
            <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-corporate-green to-corporate-green-light h-48 flex items-center justify-center relative">
                  <div className="text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <div className="grid grid-cols-2 gap-1">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <h3 className="font-semibold">Gestão de Funcionários</h3>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold mb-2">Controle Total</h4>
                  <p className="text-sm text-muted-foreground">
                    Cadastre, edite e gerencie funcionários com facilidade. Upload em lote via Excel.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Relatórios Card */}
          <motion.div variants={cardVariants}>
            <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-corporate-orange to-corporate-orange-light h-48 flex items-center justify-center relative">
                  <div className="text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <div className="space-y-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-6 bg-white rounded"></div>
                          <div className="w-2 h-8 bg-white rounded"></div>
                          <div className="w-2 h-4 bg-white rounded"></div>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-semibold">Relatórios Inteligentes</h3>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold mb-2">Analytics Avançado</h4>
                  <p className="text-sm text-muted-foreground">
                    Relatórios detalhados, exportação automática e insights para otimização.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Interactive Demo Section */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Card className="max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-corporate-blue via-corporate-green to-corporate-orange h-2"></div>
              <div className="p-8 bg-corporate-gray-50">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-corporate-blue mb-2">250+</div>
                    <div className="text-sm text-muted-foreground">Empresas Atendidas</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-corporate-green mb-2">15k+</div>
                    <div className="text-sm text-muted-foreground">Funcionários Gerenciados</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-corporate-orange mb-2">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime Garantido</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default MockupDemonstration;
