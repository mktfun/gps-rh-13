
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Calendar, DollarSign, Briefcase } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FuncionarioPlano {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  idade: number;
  status: string;
  created_at: string;
}

interface PlanoInfo {
  seguradora: string;
  valor_mensal: number;
}

interface FuncionariosPlanoTableProps {
  funcionarios: FuncionarioPlano[];
  plano: PlanoInfo;
}

export const FuncionariosPlanoTable = ({ funcionarios, plano }: FuncionariosPlanoTableProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'pendente':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (funcionarios.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum funcionário vinculado a este plano</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        {funcionarios.length} funcionário(s) vinculado(s) ao plano {plano.seguradora}
      </div>

      <div className="grid gap-4">
        {funcionarios.map((funcionario) => (
          <Card key={funcionario.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{funcionario.nome}</span>
                    <Badge variant={getStatusVariant(funcionario.status)}>
                      {funcionario.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">CPF:</span>
                      <span>{funcionario.cpf}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      <span>{funcionario.cargo}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>{formatCurrency(funcionario.salario)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{funcionario.idade} anos</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Custo Mensal</div>
                  <div className="font-medium text-green-600">
                    {formatCurrency(plano.valor_mensal)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
