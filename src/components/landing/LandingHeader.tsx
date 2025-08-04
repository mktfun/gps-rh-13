
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-corporate-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold corporate-heading">GPS</span>
              <span className="hidden sm:inline text-sm text-muted-foreground">Gestor Pulse Seguros</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Fazer Login</Link>
            </Button>
            <Button asChild>
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
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                Fazer Login
              </Link>
            </Button>
            <Button className="w-full" asChild>
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
