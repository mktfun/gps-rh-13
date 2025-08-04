
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "O GPS transformou completamente nossa gestão de seguros. O que antes levava dias agora é resolvido em minutos. A integração entre corretora e empresa ficou perfeita.",
      author: "Maria Silva",
      position: "Diretora de RH",
      company: "TechCorp Solutions",
      initials: "MS"
    },
    {
      quote: "Implementamos o GPS há 6 meses e já vemos resultados impressionantes. A redução de erros foi de 95% e nossa produtividade aumentou significativamente.",
      author: "Carlos Eduardo",
      position: "Gerente de Benefícios",
      company: "InnovaTech Ltda",
      initials: "CE"
    },
    {
      quote: "A plataforma é intuitiva e poderosa. Nossos funcionários se adaptaram rapidamente e agora conseguimos gerar relatórios complexos com apenas alguns cliques.",
      author: "Ana Carolina",
      position: "Coordenadora Administrativa",
      company: "Global Services",
      initials: "AC"
    }
  ];

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
    <section className="py-20 bg-gradient-to-b from-corporate-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-6 corporate-heading"
          >
            O que nossos clientes dizem
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Empresas que confiam no GPS já experimentam os benefícios de uma gestão 
            de seguros mais eficiente e automatizada.
          </motion.p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Quote className="h-8 w-8 text-corporate-blue flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
                    <div className="flex-1">
                      <blockquote className="text-sm text-muted-foreground mb-6 leading-relaxed italic">
                        "{testimonial.quote}"
                      </blockquote>
                      
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-corporate-gradient text-white font-semibold">
                            {testimonial.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-sm">{testimonial.author}</div>
                          <div className="text-xs text-muted-foreground">
                            {testimonial.position}
                          </div>
                          <div className="text-xs text-corporate-blue font-medium">
                            {testimonial.company}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Section */}
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="text-center">
              <div className="text-2xl font-bold text-corporate-blue mb-1">250+</div>
              <div className="text-xs text-muted-foreground">Empresas Clientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-corporate-green mb-1">15k+</div>
              <div className="text-xs text-muted-foreground">Funcionários</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-corporate-orange mb-1">99.9%</div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-corporate-blue mb-1">24/7</div>
              <div className="text-xs text-muted-foreground">Suporte</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
