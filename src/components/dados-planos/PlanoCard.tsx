
import React from 'react';
import { Building2, DollarSign, Shield, Users, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface PlanoCardData {
  id: string;
  empresa_nome: string;
  cnpj_razao_social: string;
  cnpj_numero: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  total_funcionarios: number;
  empresa_id: string;
  cnpj_id: string;
}

interface PlanoCardProps {
  plano: PlanoCardData;
  onEdit: (plano: PlanoCardData) => void;
  onViewFuncionarios: (empresaId: string, cnpjId: string) => void;
}

export const PlanoCard = ({ plano, onEdit, onViewFuncionarios }: PlanoCardProps) => {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEditPlano = () => {
    navigate(`/corretora/plano/${plano.id}?tab=configuracoes`);
  };

  const handleViewFuncionarios = () => {
    navigate(`/corretora/plano/${plano.id}?tab=funcionarios`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{plano.empresa_nome}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <Building2 className="mr-1 h-3 w-3" />
              {plano.cnpj_razao_social}
            </div>
            <p className="text-xs text-muted-foreground">
              CNPJ: {plano.cnpj_numero}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Seguradora e Valor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Seguradora:</span>
            <Badge variant="secondary">{plano.seguradora}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <DollarSign className="mr-1 h-3 w-3" />
              Valor Mensal:
            </span>
            <span className="font-semibold text-green-600">
              {formatCurrency(plano.valor_mensal)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <Users className="mr-1 h-3 w-3" />
              Funcionários:
            </span>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-blue-600"
              onClick={handleViewFuncionarios}
            >
              {plano.total_funcionarios}
            </Button>
          </div>
        </div>

        {/* Coberturas */}
        <div className="space-y-2">
          <div className="flex items-center mb-2">
            <Shield className="mr-2 h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Coberturas</span>
          </div>
          
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex justify-between">
              <span>Morte:</span>
              <span className="font-medium">{formatCurrency(plano.cobertura_morte)}</span>
            </div>
            <div className="flex justify-between">
              <span>Morte Acidental:</span>
              <span className="font-medium">{formatCurrency(plano.cobertura_morte_acidental)}</span>
            </div>
            <div className="flex justify-between">
              <span>Invalidez por Acidente:</span>
              <span className="font-medium">{formatCurrency(plano.cobertura_invalidez_acidente)}</span>
            </div>
            <div className="flex justify-between">
              <span>Auxílio Funeral:</span>
              <span className="font-medium">{formatCurrency(plano.cobertura_auxilio_funeral)}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={handleEditPlano}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Plano
        </Button>
        <Button onClick={handleViewFuncionarios}>
          <Users className="mr-2 h-4 w-4" />
          Ver Funcionários
        </Button>
      </CardFooter>
    </Card>
  );
};
