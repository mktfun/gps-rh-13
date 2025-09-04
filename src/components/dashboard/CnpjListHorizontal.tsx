import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, PieChart, CircleDollarSign, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CnpjData {
  razao_social: string;
  cnpj: string;
  funcionarios_count: number;
  valor_mensal: number;
}

interface CnpjListHorizontalProps {
  cnpjs: CnpjData[];
  totalFuncionarios: number;
  custoMensalTotal: number;
}

export const CnpjListHorizontal: React.FC<CnpjListHorizontalProps> = ({
  cnpjs,
  totalFuncionarios,
  custoMensalTotal,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      {cnpjs.map((cnpj, index) => {
        const funcionariosPorcentagem = totalFuncionarios > 0 ?
          ((cnpj.funcionarios_count / totalFuncionarios) * 100).toFixed(1) : '0';
        const custoRelativo = custoMensalTotal > 0 ?
          ((cnpj.valor_mensal / custoMensalTotal) * 100).toFixed(1) : '0';

        return (
          <Card
            key={index}
            className="group p-4 hover:bg-muted/30 transition-all duration-200 cursor-pointer border hover:border-primary/50"
            onClick={() => navigate('/empresa/cnpjs')}
          >
            <div className="flex items-center justify-between gap-6">
              {/* Seção Esquerda - Identificação */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {cnpj.razao_social}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {cnpj.cnpj}
                  </p>
                </div>
              </div>

              {/* Seção Central - Stat Blocks */}
              <div className="hidden md:flex items-center gap-4">
                {/* Stat Block 1 - Funcionários */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <Users className="h-4 w-4 text-primary" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{cnpj.funcionarios_count}</p>
                    <p className="text-xs text-muted-foreground">{funcionariosPorcentagem}% do total</p>
                  </div>
                </div>

                {/* Stat Block 2 - Participação */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <PieChart className="h-4 w-4 text-corporate-green" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{custoRelativo}%</p>
                    <p className="text-xs text-muted-foreground">do custo</p>
                  </div>
                </div>

                {/* Stat Block 3 - Valor Mensal */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <CircleDollarSign className="h-4 w-4 text-corporate-green" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-corporate-green">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(cnpj.valor_mensal)}
                    </p>
                    <p className="text-xs text-muted-foreground">mensal</p>
                  </div>
                </div>
              </div>

              {/* Seção Direita - Status e Ações */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Ativo
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/empresa/cnpjs');
                  }}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Ver Detalhes</span>
                  <span className="sm:hidden">Ver</span>
                </Button>
              </div>
            </div>

            {/* Mobile Stats - Visível apenas em telas pequenas */}
            <div className="md:hidden mt-3 pt-3 border-t border-border/50">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Funcionários</p>
                  <p className="text-sm font-semibold">{cnpj.funcionarios_count}</p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Participação</p>
                  <p className="text-sm font-semibold">{custoRelativo}%</p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Valor Mensal</p>
                  <p className="text-sm font-semibold text-corporate-green">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(cnpj.valor_mensal)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};