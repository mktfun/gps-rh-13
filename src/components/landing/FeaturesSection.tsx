
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Shield, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  TrendingUp,
  Building2,
  Clock,
  CheckCircle
} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Users,
      title: "Gestão de Funcionários",
      description: "Cadastro, edição e controle de vínculos de funcionários com upload em lote via Excel e validações automáticas.",
      color: "text-corporate-blue"
    },
    {
      icon: Shield,
      title: "Controle de Apólices",
      description: "Centralização e gestão completa de seguros corporativos com acompanhamento de vigências e renovações.",
      color: "text-corporate-green"
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Analytics avançado com insights automatizados, exportação em múltiplos formatos e dashboards personalizáveis.",
      color: "text-corporate-orange"
    },
    {
      icon: MessageSquare,
      title: "Comunicação Integrada",
      description: "Canal direto entre Corretora e Empresas com notificações em tempo real e histórico de interações.",
      color: "text-corporate-blue"
    },
    {
      icon: FileText,
      title: "Auditoria Completa",
      description: "Logs detalhados de todas as ações, rastreabilidade total e conformidade com regulamentações.",
      color: "text-corporate-green"
    },
    {
      icon: TrendingUp,
      title: "Dashboard Executivo",
      description: "Visão estratégica com KPIs em tempo real, métricas de performance e indicadores de crescimento.",
      color: "text-corporate-orange"
    },
    {
      icon: Building2,
      title: "Multi-empresa",
      description: "Gestão simultânea de múltiplas empresas com controles de acesso diferenciados e dados segregados.",
      color: "text-corporate-blue"
    },
    {
      icon: Clock,
      title: "Automação Inteligente",
      description: "Workflows automatizados para inclusões, exclusões e alterações com aprovações customizáveis.",
      color: "text-corporate-green"
    },
    {
      icon: CheckCircle,
      title: "Conformidade Total",
      description: "Atendimento às normas do mercado segurador com validações automáticas e controles rigorosos.",
      color: "text-corporate-orange"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
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
    <section className="py-20 bg-white">
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
            Tudo que você precisa, em um só lugar
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Uma plataforma completa que revoluciona a gestão de seguros corporativos
            com tecnologia de ponta e experiência do usuário excepcional.
          </motion.p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-corporate-gray-100 to-corporate-gray-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
