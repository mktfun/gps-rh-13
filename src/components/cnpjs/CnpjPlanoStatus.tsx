import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Plus, Building2, Users, DollarSign } from 'lucide-react';
import { ConfigurarPlanoModal } from '@/components/planos/ConfigurarPlanoModal';
import { ConfigurarPlanoSaudeModal } from '@/components/planos/ConfigurarPlanoSaudeModal';

interface CnpjPlanoStatusProps {
  cnpjId: string;
  tipoSeguro: 'vida' | 'saude';
  planoExiste: boolean;
  planoDetalhes?: {
    id: string;
    seguradora: string;
    valor_mensal: number;
    total_funcionarios: number;
    funcionarios_ativos: number;
  };
  empresaNome?: string;
  cnpjNumero?: string;
}

export const CnpjPlanoStatus: React.FC<CnpjPlanoStatusProps> = ({
  cnpjId,
  tipoSeguro,
  planoExiste,
  planoDetalhes,
  empresaNome,
  cnpjNumero
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTipoSeguroLabel = () => {
    return tipoSeguro === 'vida' ? 'Seguro de Vida' : 'Plano de Saúde';
  };

  const getTipoSeguroIcon = () => {
    return tipoSeguro === 'vida' ? Shield : Building2;
  };

  const Icon = getTipoSeguroIcon();

  if (planoExiste && planoDetalhes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5" />
            {getTipoSeguroLabel()} Configurado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Seguradora</p>
              <Badge variant="secondary">{planoDetalhes.seguradora}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Mensal</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(planoDetalhes.valor_mensal)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Funcionários</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-semibold">{planoDetalhes.total_funcionarios}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Funcionários Ativos</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">{planoDetalhes.funcionarios_ativos}</span>
              </div>
            </div>
          </div>
          
          {empresaNome && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Empresa</p>
              <p className="font-medium">{empresaNome}</p>
              {cnpjNumero && (
                <p className="text-xs text-muted-foreground">CNPJ: {cnpjNumero}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
            <Icon className="h-5 w-5" />
            {getTipoSeguroLabel()} não configurado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Este CNPJ ainda não possui um {getTipoSeguroLabel().toLowerCase()} configurado.
          </p>
          
          {empresaNome && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Empresa</p>
              <p className="font-medium">{empresaNome}</p>
              {cnpjNumero && (
                <p className="text-xs text-muted-foreground">CNPJ: {cnpjNumero}</p>
              )}
            </div>
          )}
          
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Configurar {getTipoSeguroLabel()}
          </Button>
        </CardContent>
      </Card>

      {/* Modal condicional baseado no tipo de seguro */}
      {tipoSeguro === 'vida' ? (
        <ConfigurarPlanoModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          cnpjId={cnpjId}
          tipoSeguro="vida"
        />
      ) : (
        <ConfigurarPlanoSaudeModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          cnpjId={cnpjId}
        />
      )}
    </>
  );
};
