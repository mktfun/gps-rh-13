
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

interface PlanoDetalhes {
  id: string;
  seguradora: string;
  valor_mensal: number;
}

interface PlanoFuncionario {
  id: string;
  nome: string;
  status: string;
}

interface PlanoVisaoGeralTabIsolatedProps {
  plano: PlanoDetalhes;
  funcionarios: PlanoFuncionario[];
  onNavigateToFuncionarios: () => void;
  onAddFuncionario: () => void;
}

export const PlanoVisaoGeralTabIsolated: React.FC<PlanoVisaoGeralTabIsolatedProps> = ({
  plano,
  funcionarios,
  onNavigateToFuncionarios,
  onAddFuncionario
}) => {
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo');
  const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente');
  const totalFuncionarios = funcionarios.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Valor fixo do plano (não multiplicar por funcionários)
  const custoPlano = plano.valor_mensal;

  return (
    <div className="space-y-6 max-w-none">
      {/* Header com informações básicas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{plano.seguradora}</CardTitle>
              <CardDescription>
                Plano de Seguro de Vida em Grupo
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {formatCurrency(custoPlano)}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Valor fixo por CNPJ - Cobertura para {funcionariosAtivos.length} funcionários ativos
          </div>
        </CardHeader>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Funcionários</p>
                <p className="text-2xl font-bold">{totalFuncionarios}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Funcionários Ativos</p>
                <p className="text-2xl font-bold">{funcionariosAtivos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{funcionariosPendentes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Custo do Plano</p>
                <p className="text-2xl font-bold">{formatCurrency(custoPlano)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Gerencie rapidamente os funcionários e o plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={onAddFuncionario} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Adicionar Funcionário
            </Button>
            <Button 
              variant="outline" 
              onClick={onNavigateToFuncionarios}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Ver Todos os Funcionários
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
