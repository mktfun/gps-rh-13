import React from 'react';
import { SelecionarFuncionariosModal } from './SelecionarFuncionariosModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdicionarFuncionariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  planoId: string;
  onFuncionariosAdicionados?: () => void;
}

const AdicionarFuncionariosModal: React.FC<AdicionarFuncionariosModalProps> = ({
  isOpen,
  onClose,
  planoId,
  onFuncionariosAdicionados
}) => {
  // Get CNPJ ID from the plano
  const { data: plano } = useQuery({
    queryKey: ['plano-details', planoId],
    queryFn: async () => {
      if (!planoId) return null;
      
      const { data, error } = await supabase
        .from('planos')
        .select('cnpj_id')
        .eq('id', planoId)
        .single();

      if (error) {
        console.error('Erro ao buscar detalhes do plano:', error);
        return null;
      }

      return data;
    },
    enabled: !!planoId && isOpen,
  });

  if (!plano?.cnpj_id) {
    return null;
  }

  return (
    <SelecionarFuncionariosModal
      isOpen={isOpen}
      onClose={onClose}
      cnpjId={plano.cnpj_id}
      planoId={planoId}
      onFuncionariosAdicionados={onFuncionariosAdicionados}
    />
  );
};

export default AdicionarFuncionariosModal;
