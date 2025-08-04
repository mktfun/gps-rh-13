
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanoCardData {
  id: string;
  empresa_nome: string;
  cnpj_razao_social: string;
  cnpj_numero: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  total_funcionarios: number;
  empresa_id: string;
  cnpj_id: string; // ADICIONANDO O ID DO CNPJ
}

interface UseDadosPlanosCardsParams {
  search?: string;
}

export const useDadosPlanosCards = (params: UseDadosPlanosCardsParams = {}) => {
  const { search } = params;

  const {
    data: planos = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['dados-planos-cards', search],
    queryFn: async (): Promise<PlanoCardData[]> => {
      console.log('📋 useDadosPlanosCards - Buscando dados dos planos com empresa_id e cnpj_id');
      
      let query = supabase
        .from('dados_planos')
        .select(`
          id,
          seguradora,
          valor_mensal,
          cobertura_morte,
          cobertura_morte_acidental,
          cobertura_invalidez_acidente,
          cobertura_auxilio_funeral,
          cnpjs!inner(
            id,
            cnpj,
            razao_social,
            empresa_id,
            empresas!inner(
              nome
            )
          )
        `);

      const { data, error } = await query;

      if (error) {
        console.error('❌ useDadosPlanosCards - Erro ao buscar planos:', error);
        throw error;
      }

      if (!data) {
        console.log('📋 useDadosPlanosCards - Nenhum dado retornado');
        return [];
      }

      // Transformar dados para o formato esperado pelo card
      const planosFormatados: PlanoCardData[] = await Promise.all(
        data.map(async (plano: any) => {
          // Buscar contagem de funcionários para este CNPJ
          const { data: funcionariosData } = await supabase
            .from('funcionarios')
            .select('id')
            .eq('cnpj_id', plano.cnpjs.id)
            .eq('status', 'ativo');

          return {
            id: plano.id,
            empresa_nome: plano.cnpjs.empresas.nome,
            cnpj_razao_social: plano.cnpjs.razao_social,
            cnpj_numero: plano.cnpjs.cnpj,
            seguradora: plano.seguradora,
            valor_mensal: plano.valor_mensal,
            cobertura_morte: plano.cobertura_morte,
            cobertura_morte_acidental: plano.cobertura_morte_acidental,
            cobertura_invalidez_acidente: plano.cobertura_invalidez_acidente,
            cobertura_auxilio_funeral: plano.cobertura_auxilio_funeral,
            total_funcionarios: funcionariosData?.length || 0,
            empresa_id: plano.cnpjs.empresa_id,
            cnpj_id: plano.cnpjs.id // AQUI ESTÁ O CNPJ_ID QUE VAMOS USAR PARA O FILTRO!
          };
        })
      );

      // Aplicar filtro de busca se fornecido
      let planosFiltrados = planosFormatados;
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        planosFiltrados = planosFormatados.filter(plano => 
          plano.empresa_nome.toLowerCase().includes(searchLower) ||
          plano.cnpj_razao_social.toLowerCase().includes(searchLower) ||
          plano.cnpj_numero.includes(search) ||
          plano.seguradora.toLowerCase().includes(searchLower)
        );
      }

      console.log('✅ useDadosPlanosCards - Planos encontrados com empresa_id e cnpj_id:', planosFiltrados.length);
      console.log('📋 Primeiro plano com cnpj_id:', planosFiltrados[0]?.cnpj_id);
      return planosFiltrados;
    }
  });

  return {
    planos: planos || [],
    isLoading,
    error
  };
};
