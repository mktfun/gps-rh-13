
import React from 'react';

interface PlanoDetalhes {
  id: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  cnpj_id: string;
  cnpj_numero: string;
  cnpj_razao_social: string;
  empresa_nome: string;
}

interface CoberturasTabProps {
  plano: PlanoDetalhes;
}

export const CoberturasTab: React.FC<CoberturasTabProps> = ({ plano }) => {
  return <div>Conteúdo de Coberturas virá aqui...</div>;
};
