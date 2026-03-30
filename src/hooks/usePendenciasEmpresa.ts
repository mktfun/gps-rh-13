
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { differenceInDays } from 'date-fns';

interface PendenciaEmpresa {
  id: string;
  protocolo: string;
  tipo: string;
  funcionario_nome: string;
  funcionario_cpf: string;
  cnpj: string;
  razao_social: string;
  descricao: string;
  data_criacao: string;
  data_vencimento: string;
  status: string;
  dias_em_aberto: number;
  comentarios_count: number;
  prioridade: number;
  corretora_id: string;
  cnpj_id: string;
  tipo_plano: string | null;
}

export const usePendenciasEmpresa = () => {
  const { data: empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['pendencias-empresa', empresaId],
    queryFn: async (): Promise<PendenciaEmpresa[]> => {
      if (!empresaId) {
        throw new Error('Empresa ID não encontrado');
      }

      const { data, error } = await supabase
        .from('pendencias')
        .select(`
          id, protocolo, tipo, descricao, status,
          data_criacao, data_vencimento, comentarios_count,
          corretora_id, tipo_plano, cnpj_id,
          funcionarios(nome, cpf),
          cnpjs(cnpj, razao_social)
        `)
        .eq('status', 'pendente')
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar pendências da empresa:', error);
        throw error;
      }

      const now = new Date();
      return (data || []).map((item: any) => {
        const diasEmAberto = differenceInDays(now, new Date(item.data_criacao));
        return {
          id: item.id,
          protocolo: item.protocolo,
          tipo: item.tipo,
          funcionario_nome: item.funcionarios?.nome || 'N/A',
          funcionario_cpf: item.funcionarios?.cpf || '',
          cnpj: item.cnpjs?.cnpj || '',
          razao_social: item.cnpjs?.razao_social || '',
          descricao: item.descricao,
          data_criacao: item.data_criacao,
          data_vencimento: item.data_vencimento,
          status: item.status,
          dias_em_aberto: diasEmAberto,
          comentarios_count: item.comentarios_count || 0,
          prioridade: diasEmAberto > 30 ? 3 : diasEmAberto > 14 ? 2 : 1,
          corretora_id: item.corretora_id,
          cnpj_id: item.cnpj_id,
          tipo_plano: item.tipo_plano,
        };
      });
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};
