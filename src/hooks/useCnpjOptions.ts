import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

export const useCnpjOptions = () => {
  const { data: empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['cnpj-options', empresaId],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      const { data, error } = await supabase
        .from('cnpjs')
        .select('id, razao_social, cnpj')
        .eq('empresa_id', empresaId)
        .eq('status', 'ativo')
        .order('razao_social');

      if (error) {
        console.error('❌ Erro ao buscar CNPJs:', error);
        throw error;
      }

      return (data || []).map(cnpj => ({
        value: cnpj.razao_social,
        label: `${cnpj.razao_social} (${cnpj.cnpj})`
      }));
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
