import React from 'react';
import { motion } from 'framer-motion';

const MockupDemonstration = () => {
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
            Veja o GPS em Ação
          </h2>
          <p 
            className="text-lg text-[#9CA3AF] max-w-2xl mx-auto"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Interface moderna e intuitiva, desenvolvida para maximizar sua produtividade.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          {/* iMac Mockup */}
          <div className="relative">
            {/* iMac Stand */}
            <div className="relative mx-auto" style={{ width: '900px', maxWidth: '90vw' }}>
              {/* Monitor */}
              <div 
                className="relative mx-auto rounded-lg"
                style={{
                  width: '100%',
                  height: '0',
                  paddingBottom: '62.5%', // 16:10 aspect ratio
                  background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
                  border: '8px solid #2a2a2a',
                  borderRadius: '20px',
                  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Screen */}
                <div 
                  className="absolute inset-4 rounded-lg overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, #000 0%, #111 100%)',
                    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {/* Dashboard Image */}
                  <img 
                    src="https://i.imgur.com/8a1y3DR.png"
                    alt="GPS Dashboard"
                    className="w-full h-full object-cover"
                    style={{
                      borderRadius: '8px'
                    }}
                  />
                  
                  {/* Screen reflection effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 20%, transparent 80%, rgba(255, 255, 255, 0.05) 100%)',
                      borderRadius: '8px'
                    }}
                  ></div>
                </div>

                {/* Apple Logo */}
                <div 
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(145deg, #333 0%, #222 100%)',
                    border: '1px solid #444'
                  }}
                >
                  <div className="w-3 h-3 bg-[#2563EB] rounded-full opacity-60"></div>
                </div>
              </div>

              {/* Stand */}
              <div className="relative mx-auto mt-4" style={{ width: '200px' }}>
                {/* Stand Neck */}
                <div 
                  className="mx-auto"
                  style={{
                    width: '40px',
                    height: '60px',
                    background: 'linear-gradient(145deg, #ddd 0%, #bbb 100%)',
                    borderRadius: '0 0 20px 20px',
                    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}
                ></div>
                
                {/* Stand Base */}
                <div 
                  className="mx-auto"
                  style={{
                    width: '200px',
                    height: '20px',
                    background: 'linear-gradient(145deg, #ddd 0%, #bbb 100%)',
                    borderRadius: '100px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
                    transform: 'perspective(100px) rotateX(45deg)'
                  }}
                ></div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-[#2563EB]/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#2563EB]/5 rounded-full blur-2xl"></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MockupDemonstration;
