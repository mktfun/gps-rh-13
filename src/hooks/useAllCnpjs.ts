
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CnpjWithEmpresa {
  id: string;
  cnpj: string;
  razao_social: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
  empresa_nome: string;
}

interface UseAllCnpjsParams {
  search?: string;
}

export const useAllCnpjs = (params: UseAllCnpjsParams = {}) => {
  const { search = '' } = params;

  console.log('🔍 useAllCnpjs - Iniciando busca com parâmetros:', { search });

  const {
    data: cnpjs,
    isLoading,
    error
  } = useQuery({
    queryKey: ['all-cnpjs', search],
    queryFn: async (): Promise<CnpjWithEmpresa[]> => {
      console.log('🔍 useAllCnpjs - Executando query no Supabase...');
      
      let query = supabase
        .from('cnpjs')
        .select(`
          id,
          cnpj,
          razao_social,
          status,
          empresa_id,
          created_at,
          updated_at,
          empresas!inner (
            nome
          )
        `)
        .order('razao_social', { ascending: true });

      if (search) {
        console.log('🔍 useAllCnpjs - Aplicando filtro de busca:', search);
        query = query.or(`cnpj.ilike.%${search}%,razao_social.ilike.%${search}%`);
      }

      const { data, error } = await query;

      console.log('🔍 useAllCnpjs - Resultado da query:', { 
        data: data?.length || 0, 
        error: error?.message || null 
      });

      if (error) {
        console.error('🔍 useAllCnpjs - Erro na query:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Transformar os dados aninhados para o formato esperado
      const result: CnpjWithEmpresa[] = data.map(item => {
        // Type guard to ensure we have valid data structure
        if (!item || typeof item !== 'object') {
          throw new Error('Invalid data structure received from Supabase');
        }

        const empresasData = (item as any).empresas;
        let empresaNome = 'N/A';
        
        if (empresasData) {
          if (Array.isArray(empresasData) && empresasData.length > 0) {
            empresaNome = empresasData[0]?.nome || 'N/A';
          } else if (typeof empresasData === 'object' && empresasData.nome) {
            empresaNome = empresasData.nome;
          }
        }

        return {
          id: (item as any).id,
          cnpj: (item as any).cnpj,
          razao_social: (item as any).razao_social,
          status: (item as any).status,
          empresa_id: (item as any).empresa_id,
          created_at: (item as any).created_at,
          updated_at: (item as any).updated_at,
          empresa_nome: empresaNome,
        };
      });

      console.log('🔍 useAllCnpjs - Retornando dados processados:', result.length, 'CNPJs');
      
      return result;
    }
  });

  console.log('🔍 useAllCnpjs - Estado atual:', { 
    isLoading, 
    hasError: !!error, 
    dataCount: cnpjs?.length || 0 
  });

  return {
    cnpjs: cnpjs || [],
    isLoading,
    error
  };
};
