
import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import MockupDemonstration from '@/components/landing/MockupDemonstration';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <HeroSection />
        <MockupDemonstration />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      
      {/* Footer */}
      <footer className="bg-corporate-gray-900 text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-corporate-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold">GPS</span>
              <span className="text-sm text-gray-400">Gestor Pulse Seguros</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">
                © 2024 Pulse Seguros. Todos os direitos reservados.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Versão 2.0 • Desenvolvido com ❤️ para simplificar sua gestão
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
