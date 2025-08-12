
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CnpjPlanoStatus } from '@/components/cnpjs/CnpjPlanoStatus';
import { DashboardLoadingState } from '@/components/ui/loading-state';

const SegurosVidaCnpjDetalhesPage: React.FC = () => {
  const { cnpjId } = useParams<{ cnpjId: string }>();

  // Verificar se existe plano para este CNPJ
  const { data: plano, isLoading } = useQuery({
    queryKey: ['check-plano-vida', cnpjId],
    queryFn: async () => {
      if (!cnpjId) return null;

      const { data, error } = await supabase
        .from('dados_planos')
        .select('id')
        .eq('cnpj_id', cnpjId)
        .eq('tipo_seguro', 'vida')
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar plano:', error);
        return null;
      }

      return data;
    },
    enabled: !!cnpjId,
  });

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
