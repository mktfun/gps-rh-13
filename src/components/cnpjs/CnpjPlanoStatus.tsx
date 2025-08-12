
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle } from 'lucide-react';
import { ConfigurarPlanoModal } from '@/components/planos/ConfigurarPlanoModal';

interface CnpjPlanoStatusProps {
  cnpjId: string;
  tipoSeguro: 'vida' | 'saude';
  hasPlano: boolean;
}

export const CnpjPlanoStatus: React.FC<CnpjPlanoStatusProps> = ({
  cnpjId,
  tipoSeguro,
  hasPlano
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getPlanoTitle = () => {
    return tipoSeguro === 'vida' 
      ? 'Plano de seguro de vida não encontrado'
      : 'Plano de saúde não encontrado';
  };

  const getPlanoDescription = () => {
    return `Este CNPJ não possui um plano de ${tipoSeguro === 'vida' ? 'seguro de vida' : 'saúde'} cadastrado. Configure um plano agora para começar a gerenciar os funcionários.`;
  };

  const getButtonText = () => {
    return tipoSeguro === 'vida' 
      ? 'Configurar Plano de Vida'
      : 'Configurar Plano de Saúde';
  };

  if (hasPlano) {
    return null; // Se já tem plano, não mostra este componente
  }

  return (
    <>
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">{getPlanoTitle()}</CardTitle>
          <CardDescription className="text-center">
            {getPlanoDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="w-full"
            size="lg"
          >
            <Shield className="mr-2 h-4 w-4" />
            {getButtonText()}
          </Button>
          <Button variant="outline" className="w-full">
            Voltar
          </Button>
        </CardContent>
      </Card>

      <ConfigurarPlanoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        cnpjId={cnpjId}
        tipoSeguro={tipoSeguro}
      />
    </>
  );
};
