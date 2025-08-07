
import React, { useState } from 'react';
import { PieChart, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardCard from '@/components/ui/DashboardCard';
import DistribuicaoCargosChart from './DistribuicaoCargosChart';
import CustosPorCnpjChart from './CustosPorCnpjChart';

interface DistribuicaoCargo {
  cargo: string;
  count: number;
}

interface CustoPorCnpj {
  cnpj: string;
  razao_social: string;
  valor_mensal: number;
  funcionarios_count: number;
}

interface DistributionChartsCardProps {
  distribuicaoCargos: DistribuicaoCargo[];
  custosPorCnpj: CustoPorCnpj[];
}

const DistributionChartsCard = ({ 
  distribuicaoCargos, 
  custosPorCnpj 
}: DistributionChartsCardProps) => {
  const [activeTab, setActiveTab] = useState('cargos');

  return (
    <DashboardCard
      title="Análise de Distribuição"
      icon={PieChart}
      description="Funcionários organizados por cargo e custos por CNPJ"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cargos" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Por Cargo
          </TabsTrigger>
          <TabsTrigger value="cnpjs" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Por CNPJ
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="cargos" className="mt-6">
          <DistribuicaoCargosChart dados={distribuicaoCargos} />
        </TabsContent>
        
        <TabsContent value="cnpjs" className="mt-6">
          <CustosPorCnpjChart dados={custosPorCnpj} />
        </TabsContent>
      </Tabs>
    </DashboardCard>
  );
};

export default DistributionChartsCard;
