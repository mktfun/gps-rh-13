import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, BarChart3, Calendar, Search, Bell, Settings } from 'lucide-react';

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
          {/* Browser Window Mockup */}
          <div className="relative max-w-5xl w-full">
            {/* Window Frame */}
            <div 
              className="bg-[#2A2A2A] rounded-t-xl border border-[#404040] shadow-2xl"
              style={{
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Title Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#2A2A2A] rounded-t-xl border-b border-[#404040]">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#FF5F57] rounded-full"></div>
                  <div className="w-3 h-3 bg-[#FFBD2E] rounded-full"></div>
                  <div className="w-3 h-3 bg-[#28CA42] rounded-full"></div>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[#8E8E93] text-sm font-medium">GPS - Gestor Planos de Saúde</span>
                </div>
                <div className="w-16"></div>
              </div>

              {/* App Content */}
              <div className="bg-[#0B1120] rounded-b-xl overflow-hidden" style={{ minHeight: '500px' }}>
                {/* Top Navigation */}
                <div className="bg-[#1A1F2E] border-b border-[#2A3441] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                        <MapPin className="text-white h-4 w-4" />
                      </div>
                      <div>
                        <h1 className="text-white text-lg font-semibold">Dashboard</h1>
                        <p className="text-[#9CA3AF] text-sm">Visão geral dos planos de saúde</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] h-4 w-4" />
                        <input 
                          className="bg-[#2A3441] border border-[#404040] rounded-lg pl-10 pr-4 py-2 text-white text-sm w-64"
                          placeholder="Buscar funcionários..."
                          readOnly
                        />
                      </div>
                      <div className="w-8 h-8 bg-[#2A3441] rounded-lg flex items-center justify-center">
                        <Bell className="text-[#9CA3AF] h-4 w-4" />
                      </div>
                      <div className="w-8 h-8 bg-[#2A3441] rounded-lg flex items-center justify-center">
                        <Settings className="text-[#9CA3AF] h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#1A1F2E] border border-[#2A3441] rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-[#2563EB]/20 rounded-lg flex items-center justify-center">
                          <Users className="text-[#2563EB] h-5 w-5" />
                        </div>
                        <span className="text-[#34D399] text-sm font-medium">+12%</span>
                      </div>
                      <h3 className="text-white text-lg font-semibold mb-1">1,247</h3>
                      <p className="text-[#9CA3AF] text-sm">Funcionários Ativos</p>
                    </div>

                    <div className="bg-[#1A1F2E] border border-[#2A3441] rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-[#10B981]/20 rounded-lg flex items-center justify-center">
                          <BarChart3 className="text-[#10B981] h-5 w-5" />
                        </div>
                        <span className="text-[#34D399] text-sm font-medium">+8%</span>
                      </div>
                      <h3 className="text-white text-lg font-semibold mb-1">R$ 245.300</h3>
                      <p className="text-[#9CA3AF] text-sm">Custo Total Mensal</p>
                    </div>

                    <div className="bg-[#1A1F2E] border border-[#2A3441] rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-[#F59E0B]/20 rounded-lg flex items-center justify-center">
                          <Calendar className="text-[#F59E0B] h-5 w-5" />
                        </div>
                        <span className="text-[#F87171] text-sm font-medium">-3%</span>
                      </div>
                      <h3 className="text-white text-lg font-semibold mb-1">23</h3>
                      <p className="text-[#9CA3AF] text-sm">Pendências</p>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="bg-[#1A1F2E] border border-[#2A3441] rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white text-lg font-semibold">Evolução de Custos</h3>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-[#2563EB] text-white rounded-lg text-sm">30d</button>
                        <button className="px-3 py-1 bg-[#2A3441] text-[#9CA3AF] rounded-lg text-sm">90d</button>
                        <button className="px-3 py-1 bg-[#2A3441] text-[#9CA3AF] rounded-lg text-sm">1a</button>
                      </div>
                    </div>
                    
                    {/* Simple Chart Mockup */}
                    <div className="relative h-32">
                      <svg className="w-full h-full" viewBox="0 0 400 120">
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <polyline
                          points="0,80 50,70 100,50 150,60 200,40 250,35 300,45 350,30 400,25"
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="2"
                        />
                        <polygon
                          points="0,80 50,70 100,50 150,60 200,40 250,35 300,45 350,30 400,25 400,120 0,120"
                          fill="url(#gradient)"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Table Preview */}
                  <div className="bg-[#1A1F2E] border border-[#2A3441] rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#2A3441]">
                      <h3 className="text-white text-lg font-semibold">Funcionários Recentes</h3>
                    </div>
                    <div className="divide-y divide-[#2A3441]">
                      {['João Silva', 'Maria Santos', 'Pedro Costa'].map((name, index) => (
                        <div key={index} className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">{name[0]}</span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{name}</p>
                              <p className="text-[#9CA3AF] text-sm">Plano Premium</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white">R$ 450,00</p>
                            <p className="text-[#34D399] text-sm">Ativo</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
