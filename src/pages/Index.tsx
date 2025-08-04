
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Shield, Users, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-corporate-gray-900 to-corporate-blue text-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Title */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 corporate-heading text-white">
            Bem-vindo ao CorporateHR
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-12 text-corporate-gray-100 max-w-2xl mx-auto leading-relaxed">
            A plataforma definitiva para gestão de seguros corporativos e recursos humanos
          </p>

          {/* CTA Button */}
          <div className="mb-16">
            <Button asChild size="lg" variant="corporate" className="text-lg px-8 py-4 corporate-shadow-lg">
              <Link to="/login" className="inline-flex items-center gap-2">
                Acessar Plataforma
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 corporate-shadow border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 bg-corporate-blue rounded-lg mb-4 mx-auto">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Gestão de Empresas</h3>
              <p className="text-corporate-gray-200 text-sm">
                Controle completo sobre empresas clientes e seus dados corporativos
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 corporate-shadow border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 bg-corporate-green rounded-lg mb-4 mx-auto">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Controle de Funcionários</h3>
              <p className="text-corporate-gray-200 text-sm">
                Gestão eficiente de funcionários e seus planos de seguro
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 corporate-shadow border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 bg-corporate-orange rounded-lg mb-4 mx-auto">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Relatórios Avançados</h3>
              <p className="text-corporate-gray-200 text-sm">
                Análises detalhadas e relatórios para tomada de decisão
              </p>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="mt-12">
            <p className="text-corporate-gray-300 mb-4">
              Já possui uma conta?
            </p>
            <Button asChild variant="outline-primary" size="sm">
              <Link to="/login">
                Fazer Login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
