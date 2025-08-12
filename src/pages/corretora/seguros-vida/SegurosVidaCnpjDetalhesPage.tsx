
import React from 'react';
import { useParams } from 'react-router-dom';
import { CnpjPlanoStatus } from '@/components/cnpjs/CnpjPlanoStatus';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { DashboardLoadingState } from '@/components/ui/loading-state';

const SegurosVidaCnpjDetalhesPage: React.FC = () => {
  const { cnpjId } = useParams<{ cnpjId: string }>();

  // Verificar se existe plano para este CNPJ
  const { data: plano, isLoading } = usePlanoDetalhes(cnpjId!);

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  const hasPlano = !!plano;

  return (
    <div className="container mx-auto py-8">
      <CnpjPlanoStatus
        cnpjId={cnpjId!}
        tipoSeguro="vida"
        hasPlano={hasPlano}
      />
      
      {hasPlano && (
        <div className="mt-8">
          {/* Aqui seria renderizado o conteúdo quando há plano configurado */}
          <p>Plano configurado - implementar visualização do plano</p>
        </div>
      )}
    </div>
  );
};

export default SegurosVidaCnpjDetalhesPage;
