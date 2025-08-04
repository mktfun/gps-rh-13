
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Briefcase, Calendar, DollarSign, Shield, Building2, CreditCard, Clock } from 'lucide-react';

interface FuncionarioDetalhesModalProps {
  funcionario: {
    id: string;
    nome: string;
    cpf: string;
    cargo: string;
    salario: number;
    idade: number;
    status: string;
    created_at: string;
    cnpj_razao_social?: string;
    cnpj_numero?: string;
    plano_seguradora?: string;
    plano_valor_mensal?: number;
    plano_cobertura_morte?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FuncionarioDetalhesModal: React.FC<FuncionarioDetalhesModalProps> = ({
  funcionario,
  open,
  onOpenChange,
}) => {
  if (!funcionario) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'desativado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-full">
              <User className="h-5 w-5" />
            </div>
            {funcionario.nome}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(funcionario.status)}>
              {funcionario.status.charAt(0).toUpperCase() + funcionario.status.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{funcionario.cargo}</span>
          </div>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground">CPF</label>
                    <p className="text-sm font-mono">{funcionario.cpf}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground">Idade</label>
                    <p className="text-sm">{funcionario.idade} anos</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground">Cargo</label>
                    <p className="text-sm font-medium">{funcionario.cargo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground">Salário</label>
                    <p className="text-sm font-semibold">{formatCurrency(funcionario.salario)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground">Data de Contratação</label>
                    <p className="text-sm">
                      {new Date(funcionario.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Empresa e Plano */}
          <div className="space-y-6">
            {/* Empresa */}
            {funcionario.cnpj_razao_social && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5" />
                    Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Razão Social</label>
                    <p className="text-sm font-medium">{funcionario.cnpj_razao_social}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                    <p className="text-sm font-mono">{funcionario.cnpj_numero}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plano de Seguro */}
            {funcionario.plano_seguradora && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5" />
                    Plano de Seguro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Seguradora</label>
                    <Badge variant="secondary" className="mt-1">
                      {funcionario.plano_seguradora}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <label className="text-sm font-medium text-muted-foreground">Custo Mensal</label>
                      <div className="text-lg font-bold mt-1">
                        {formatCurrency(funcionario.plano_valor_mensal || 0)}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <label className="text-sm font-medium text-muted-foreground">Cobertura Morte</label>
                      <div className="text-lg font-bold mt-1">
                        {formatCurrency(funcionario.plano_cobertura_morte || 0)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
