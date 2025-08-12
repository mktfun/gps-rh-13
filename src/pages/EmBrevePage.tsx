
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HardHat, ArrowLeft } from 'lucide-react';

const EmBrevePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-full bg-muted/20">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <HardHat className="w-12 h-12 mx-auto text-yellow-500" />
          <CardTitle className="mt-4 text-2xl font-bold">
            Funcionalidade em Construção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Estamos trabalhando duro para finalizar esta seção e trazer a melhor experiência para você. Em breve, ela estará disponível.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a página anterior
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmBrevePage;
