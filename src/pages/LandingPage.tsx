import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import MockupDemonstration from '@/components/landing/MockupDemonstration';
import CTASection from '@/components/landing/CTASection';

const LandingPage = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1120' }}>
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <MockupDemonstration />
        <CTASection />
      </main>
      
      {/* Footer */}
      <footer className="py-8 border-t border-white/10" style={{ backgroundColor: '#0B1120' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p 
              className="text-[#9CA3AF] text-sm"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              © 2024 GPS - Gestor Planos de Saúde. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
