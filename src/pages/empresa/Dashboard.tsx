
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import ClickableStatCard from '@/components/dashboard/ClickableStatCard';
import { PlanoInfoCardReadOnly } from '@/components/empresa/PlanoInfoCardReadOnly';
import { PlanoCoberturasCardReadOnly } from '@/components/empresa/PlanoCoberturasCardReadOnly';
import { useEmpresaDashboard } from '@/hooks/useEmpresaDashboard';
import { useEmpresaPlanos } from '@/hooks/useEmpresaPlanos';
import { TableLoadingState } from '@/components/ui/loading-state';

const EmpresaDashboard = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading: dashboardLoading } = useEmpresaDashboard();
  const { data: planosData, isLoading: planosLoading } = useEmpresaPlanos();

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  if (dashboardLoading || planosLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <TableLoadingState rows={4} columns={1} showHeader />
      </div>
    );
  }

  // Dados seguros com fallbacks
  const funcionarios = dashboardData?.funcionarios || 0;
  const funcionariosAtivos = dashboardData?.funcionarios_ativos || 0;
  const funcionariosPendentes = dashboardData?.funcionarios_pendentes || 0;
  const custoMensal = dashboardData?.custo_mensal_estimado || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard da Empresa
          </h1>
          <p className="text-muted-foreground">
            Visão geral dos seus funcionários e planos
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ClickableStatCard
          title="Total de Funcionários"
          value={funcionarios}
          icon={Users}
          description="Funcionários cadastrados"
          onClick={() => handleCardClick('/empresa/funcionarios')}
        />
        
        <ClickableStatCard
          title="Funcionários Ativos"
          value={funcionariosAtivos}
          icon={TrendingUp}
          description="Com plano ativo"
          variant="success"
          onClick={() => handleCardClick('/empresa/funcionarios?status=ativo')}
        />
        
        <ClickableStatCard
          title="Pendentes"
          value={funcionariosPendentes}
          icon={AlertTriangle}
          description="Aguardando ativação"
          variant="warning"
          onClick={() => handleCardClick('/empresa/funcionarios?status=pendente')}
        />
        
        <ClickableStatCard
          title="Custo Mensal"
          value={formatCurrency(custoMensal)}
          icon={FileText}
          description="Total estimado"
          onClick={() => handleCardClick('/empresa/relatorios/custos-detalhado')}
        />
      </div>

      {/* Planos Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {planosData?.map((plano) => (
          <div key={plano.plano_id} className="space-y-4">
            <PlanoInfoCardReadOnly plano={plano} />
            <PlanoCoberturasCardReadOnly plano={plano} />
          </div>
        ))}
      </div>

      {/* Estado vazio para planos */}
      {(!planosData || planosData.length === 0) && (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Nenhum plano encontrado
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre em contato com sua corretora para configurar um plano de seguro.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpresaDashboard;
