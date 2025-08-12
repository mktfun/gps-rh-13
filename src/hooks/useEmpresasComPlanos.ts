
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmpresaComPlano {
  id: string;
  nome: string;
  total_planos_ativos: number;
}

interface UseEmpresasComPlanosParams {
  tipoSeguro: 'vida' | 'saude';
  search?: string;
}

export const useEmpresasComPlanos = ({ tipoSeguro, search }: UseEmpresasComPlanosParams) => {
  return useQuery({
    queryKey: ['empresasComPlanos', tipoSeguro, search],
    queryFn: async (): Promise<EmpresaComPlano[]> => {
      console.log('🔍 Buscando empresas com planos do tipo:', tipoSeguro);

      let query = supabase
        .from('empresas')
        .select(`
          id,
          nome,
          cnpjs!inner (
            id,
            dados_planos!inner (
              id,
              tipo_seguro
            )
          )
        `)
        .eq('cnpjs.dados_planos.tipo_seguro', tipoSeguro)
        .eq('corretora_id', (await supabase.auth.getUser()).data.user?.id);

      if (search && search.trim()) {
        query = query.ilike('nome', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar empresas com planos:', error);
        throw error;
      }

      // Processar os dados para contar os planos únicos por empresa
      const empresasMap = new Map<string, EmpresaComPlano>();

      data?.forEach((empresa: any) => {
        if (!empresasMap.has(empresa.id)) {
          empresasMap.set(empresa.id, {
            id: empresa.id,
            nome: empresa.nome,
            total_planos_ativos: 0
          });
        }

        // Contar planos únicos através dos CNPJs
        const planosUnicos = new Set();
        empresa.cnpjs?.forEach((cnpj: any) => {
          cnpj.dados_planos?.forEach((plano: any) => {
            planosUnicos.add(plano.id);
          });
        });

        const empresaAtual = empresasMap.get(empresa.id)!;
        empresaAtual.total_planos_ativos = planosUnicos.size;
      });

      const empresas = Array.from(empresasMap.values());
      console.log('✅ Empresas com planos encontradas:', empresas.length);

      return empresas;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
