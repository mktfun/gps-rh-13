import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VinculoPlano {
  tipo_seguro: 'saude' | 'vida';
  status: 'nao_vinculado' | 'pendente' | 'ativo';
  seguradora?: string;
  plano_id?: string;
  pendencia_id?: string;
}

export const useVinculosPlanosFuncionario = (funcionarioId: string | null) => {
  return useQuery({
    queryKey: ['vinculos-planos', funcionarioId],
    queryFn: async (): Promise<VinculoPlano[]> => {
      if (!funcionarioId) return [];

      // Buscar dados do funcionário e seus vínculos
      const { data: funcionario, error: funcionarioError } = await supabase
        .from('funcionarios')
        .select('cnpj_id')
        .eq('id', funcionarioId)
        .single();

      if (funcionarioError) throw funcionarioError;

      // Buscar planos disponíveis para o CNPJ
      const { data: planosDisponiveis, error: planosError } = await supabase
        .from('dados_planos')
        .select('id, tipo_seguro, seguradora')
        .eq('cnpj_id', funcionario.cnpj_id);

      if (planosError) throw planosError;

      // Buscar vínculos ativos
      const { data: vinculosAtivos, error: vinculosError } = await supabase
        .from('planos_funcionarios')
        .select(`
          plano_id,
          status,
          dados_planos!inner(tipo_seguro, seguradora)
        `)
        .eq('funcionario_id', funcionarioId)
        .eq('status', 'ativo');

      if (vinculosError) throw vinculosError;

      // Buscar pendências de ativação
      const { data: pendencias, error: pendenciasError } = await supabase
        .from('pendencias')
        .select('id, descricao, tipo')
        .eq('funcionario_id', funcionarioId)
        .eq('tipo', 'ativacao')
        .eq('status', 'pendente');

      if (pendenciasError) throw pendenciasError;

      // Montar resultado para saúde e vida
      const vinculos: VinculoPlano[] = [];

      ['saude', 'vida'].forEach((tipo) => {
        const planoDisponivel = planosDisponiveis?.find(p => p.tipo_seguro === tipo);
        
        if (!planoDisponivel) {
          // Não há plano deste tipo para o CNPJ
          return;
        }

        const vinculoAtivo = vinculosAtivos?.find(
          v => (v.dados_planos as any)?.tipo_seguro === tipo
        );

        if (vinculoAtivo) {
          vinculos.push({
            tipo_seguro: tipo as 'saude' | 'vida',
            status: 'ativo',
            seguradora: (vinculoAtivo.dados_planos as any)?.seguradora,
            plano_id: vinculoAtivo.plano_id,
          });
          return;
        }

        const pendenciaAtiva = pendencias?.find(p => 
          p.descricao.toLowerCase().includes(tipo === 'saude' ? 'saúde' : 'vida')
        );

        if (pendenciaAtiva) {
          vinculos.push({
            tipo_seguro: tipo as 'saude' | 'vida',
            status: 'pendente',
            seguradora: planoDisponivel.seguradora,
            pendencia_id: pendenciaAtiva.id,
          });
          return;
        }

        vinculos.push({
          tipo_seguro: tipo as 'saude' | 'vida',
          status: 'nao_vinculado',
          seguradora: planoDisponivel.seguradora,
          plano_id: planoDisponivel.id,
        });
      });

      return vinculos;
    },
    enabled: !!funcionarioId,
  });
};
