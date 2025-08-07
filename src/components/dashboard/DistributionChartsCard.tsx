
import React, { useState } from 'react';
import { PieChart, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardCard from '@/components/ui/DashboardCard';
import DistribuicaoCargosChart from './DistribuicaoCargosChart';
import CustosPorCnpjChart from './CustosPorCnpjChart';

interface DistributionChartsCardProps {
  distribuicaoCargos: Array<{
    cargo: string;
    count: number;
  }>;
  custosPorCnpj: Array<{
    cnpj: string;
    razao_social: string;
    valor_mensal: number;
    funcionarios_count: number;
  }>;
}

const DistributionChartsCard = ({ distribuicaoCargos, custosPorCnpj }: DistributionChartsCardProps) => {
  const [activeTab, setActiveTab] = useState('cargos');

  return (
    <DashboardCard
      title="Análise de Distribuição"
      icon={activeTab === 'cargos' ? PieChart : BarChart3}
      description="Visualize a distribuição por cargo e por CNPJ"
      className="col-span-full lg:col-span-2"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cargos" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Por Cargo
          </TabsTrigger>
          <TabsTrigger value="cnpj" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Por CNPJ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cargos" className="mt-6">
          <DistribuicaoCargosChart dados={distribuicaoCargos} />
        </TabsContent>

        <TabsContent value="cnpj" className="mt-6">
          <CustosPorCnpjChart dados={custosPorCnpj} />
        </TabsContent>
      </Tabs>
    </DashboardCard>
  );
};

export default DistributionChartsCard;
