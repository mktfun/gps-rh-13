
import React from 'react';
import { Building2, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: string;
  nome: string;
  funcionarios_count: number;
  receita_mensal: number;
  created_at: string;
}

interface RecentCompaniesProps {
  empresas: Company[];
  isLoading: boolean;
}

const RecentCompanies = ({ empresas, isLoading }: RecentCompaniesProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">🏢 Empresas Recentes</h2>
          <p className="text-sm text-gray-600">Últimas empresas adicionadas à plataforma</p>
        </div>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 bg-gray-100 rounded-xl">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : empresas && empresas.length > 0 ? (
            <div className="space-y-4">
              {empresas.map((empresa, index) => (
                <div
                  key={empresa.id || index}
                  className="group p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 hover:scale-[1.02] animate-fade-in opacity-0"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {empresa.nome}
                        </h4>
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          Nova
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{empresa.funcionarios_count} funcionários</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">•</span>
                          <span>Criada em {formatDate(empresa.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-semibold text-green-600 mb-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(Number(empresa.receita_mensal || 0))}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <TrendingUp className="h-3 w-3" />
                        <span>receita mensal</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma empresa recente</h3>
              <p className="text-gray-600">As empresas adicionadas recentemente aparecerão aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentCompanies;
