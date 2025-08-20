import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-lg">
                <MapPin className="text-white h-5 w-5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xl font-bold text-white">GPS</span>
                <span className="hidden sm:inline text-xs text-gray-300">Gestor Planos de Saúde</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-white hover:bg-white/10" asChild>
              <Link to="/login">Fazer Login</Link>
            </Button>
            <Button className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-none" asChild>
              <a href="mailto:contato@pulseseguros.com.br?subject=Solicitação de Demo - GPS">
                Peça uma Demo
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 space-y-3"
          >
            <Button variant="ghost" className="w-full text-white hover:bg-white/10" asChild>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                Fazer Login
              </Link>
            </Button>
            <Button className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-none" asChild>
              <a 
                href="mailto:contato@pulseseguros.com.br?subject=Solicitação de Demo - GPS"
                onClick={() => setIsMenuOpen(false)}
              >
                Peça uma Demo
              </a>
            </Button>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default LandingHeader;
