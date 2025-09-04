import React from 'react';
import { Users, Building2, DollarSign, Clock, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { DashboardMetrics } from '@/types/dashboard';
import { useEmpresaDashboardMetrics } from '@/hooks/useEmpresaDashboardMetrics';

interface MetricsGridProps {
  data: DashboardMetrics;
  loading: boolean;
  empresaId?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  isClickable?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  onClick, 
  isClickable = false, 
  variant = 'default' 
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-corporate-green" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-corporate-green/20 bg-corporate-green/5';
      case 'warning':
        return 'border-corporate-orange/20 bg-corporate-orange/5';
      case 'destructive':
        return 'border-destructive/20 bg-destructive/5';
      default:
        return 'border-border bg-card';
    }
  };

  return (
    <Card 
      className={`${getVariantStyles()} transition-all duration-200 ${
        isClickable
          ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary/50 group'
          : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-foreground">
          {title}
        </CardTitle>
        <div className={`${isClickable ? 'text-primary group-hover:text-primary/80' : 'text-primary'} relative`}>
          {icon}
          {isClickable && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-2 w-2 text-primary" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-1">
          {typeof value === 'number' && title.includes('Custo')
            ? formatCurrency(value)
            : typeof value === 'number'
            ? formatNumber(value)
            : value
          }
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
          {trend && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
            </div>
          )}
        </div>
        {isClickable && (
          <div className="flex items-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-3 w-3" />
            <span>Ver detalhes</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MetricsGrid({ data, loading, empresaId }: MetricsGridProps) {
  // Calcular trend local sem hook adicional para evitar conflitos
  const calculateTrend = () => {
    if (!data?.evolucaoMensal || data.evolucaoMensal.length < 2) return 'neutral';

    const current = data.evolucaoMensal[data.evolucaoMensal.length - 1];
    const previous = data.evolucaoMensal[data.evolucaoMensal.length - 2];

    if (current.funcionarios > previous.funcionarios) return 'up';
    if (current.funcionarios < previous.funcionarios) return 'down';
    return 'neutral';
  };

  const funcionariosTrend = calculateTrend();

  const handleFuncionariosClick = () => {
    window.location.href = '/empresa/funcionarios';
  };

  const handleCnpjsClick = () => {
    window.location.href = '/empresa/cnpjs';
  };

  const handleCustosClick = () => {
    window.location.href = '/empresa/relatorios/custos-detalhado';
  };

  const handlePendenciasClick = () => {
    window.location.href = '/empresa/relatorios/pendencias';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-6 w-6 bg-muted rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total de Funcionários"
        value={data?.totalFuncionarios || 0}
        subtitle={`${formatNumber(data?.funcionariosAtivos || 0)} ativos`}
        trend={funcionariosTrend}
        icon={<Users className="h-6 w-6" />}
        onClick={handleFuncionariosClick}
        isClickable={true}
        variant="default"
      />
      
      <MetricCard
        title="CNPJs Ativos"
        value={data?.totalCnpjs || 0}
        subtitle="Filiais ativas"
        icon={<Building2 className="h-6 w-6" />}
        onClick={handleCnpjsClick}
        isClickable={true}
        variant="default"
      />
      
      <MetricCard
        title="Custo Mensal"
        value={data?.custoMensalTotal || 0}
        subtitle="Total em seguros"
        icon={<DollarSign className="h-6 w-6" />}
        onClick={handleCustosClick}
        isClickable={true}
        variant="success"
      />
      
      <MetricCard
        title="Pendências"
        value={data?.funcionarios_pendentes || 0}
        subtitle="Aguardando ativação"
        icon={<Clock className="h-6 w-6" />}
        onClick={handlePendenciasClick}
        isClickable={true}
        variant={(data?.funcionarios_pendentes || 0) > 0 ? "warning" : "success"}
      />
    </div>
  );
}

// Componente alternativo para layout em grid responsivo
export function MetricsGridCompact({ data, loading }: { data: DashboardMetrics; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-8 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 text-center">
        <div className="text-2xl font-bold text-primary mb-1">
          {formatNumber(data?.totalFuncionarios || 0)}
        </div>
        <div className="text-sm text-muted-foreground">Funcionários</div>
      </Card>
      
      <Card className="p-4 text-center">
        <div className="text-2xl font-bold text-corporate-green mb-1">
          {formatNumber(data?.totalCnpjs || 0)}
        </div>
        <div className="text-sm text-muted-foreground">CNPJs</div>
      </Card>
      
      <Card className="p-4 text-center">
        <div className="text-lg font-bold text-corporate-green mb-1">
          {formatCurrency(data?.custoMensalTotal || 0)}
        </div>
        <div className="text-sm text-muted-foreground">Custo Mensal</div>
      </Card>
      
      <Card className="p-4 text-center">
        <div className={`text-2xl font-bold mb-1 ${
          (data?.funcionarios_pendentes || 0) > 0 ? 'text-corporate-orange' : 'text-corporate-green'
        }`}>
          {formatNumber(data?.funcionarios_pendentes || 0)}
        </div>
        <div className="text-sm text-muted-foreground">Pendências</div>
      </Card>
    </div>
  );
}
