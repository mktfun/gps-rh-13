
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CnpjComPlano {
  id: string;
  cnpj: string;
  razao_social: string;
  status: string;
  created_at: string;
  empresa_id: string;
  temPlano: boolean;
  planoId?: string;
  seguradora?: string;
  valor_mensal?: number;
  totalFuncionarios: number;
  totalPendencias: number;
  funcionariosPendentes: number;
  funcionariosExclusaoSolicitada: number;
}

interface UseCnpjsComPlanosParams {
  empresaId?: string;
  search?: string;
  filtroPlano?: 'todos' | 'com-plano' | 'sem-plano';
  tipoSeguro?: 'vida' | 'saude';
}

// Overload para compatibilidade com chamadas antigas que passam apenas string
export function useCnpjsComPlanos(search: string): ReturnType<typeof useQuery<CnpjComPlano[]>>;
export function useCnpjsComPlanos(params: UseCnpjsComPlanosParams): ReturnType<typeof useQuery<CnpjComPlano[]>>;
export function useCnpjsComPlanos(paramsOrSearch: string | UseCnpjsComPlanosParams) {
  // Normalizar parâmetros
  const params: UseCnpjsComPlanosParams = typeof paramsOrSearch === 'string' 
    ? { search: paramsOrSearch }
    : paramsOrSearch;

  const { empresaId, search = '', filtroPlano = 'todos', tipoSeguro } = params;

  return useQuery({
    queryKey: ['cnpjs-com-planos', empresaId, search, filtroPlano, tipoSeguro],
    queryFn: async (): Promise<CnpjComPlano[]> => {
      console.log('🔍 Buscando CNPJs com planos para empresa:', empresaId, 'tipo:', tipoSeguro);

      // Buscar CNPJs da empresa
      let cnpjQuery = supabase
        .from('cnpjs')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrar por empresa se fornecido
      if (empresaId) {
        cnpjQuery = cnpjQuery.eq('empresa_id', empresaId);
      }

      if (search) {
        cnpjQuery = cnpjQuery.or(`cnpj.ilike.%${search}%,razao_social.ilike.%${search}%`);
      }

      const { data: cnpjs, error: cnpjError } = await cnpjQuery;

      if (cnpjError) {
        console.error('❌ Erro ao buscar CNPJs:', cnpjError);
        throw cnpjError;
      }

      if (!cnpjs || cnpjs.length === 0) {
        return [];
      }

      // Buscar planos para cada CNPJ, filtrando por tipo se especificado
      let planosQuery = supabase
        .from('dados_planos')
        .select('*')
        .in('cnpj_id', cnpjs.map(c => c.id));

      // Aplicar filtro de tipo de seguro se especificado
      if (tipoSeguro) {
        planosQuery = planosQuery.eq('tipo_seguro', tipoSeguro);
      }

      const { data: planos, error: planosError } = await planosQuery;

      if (planosError) {
        console.error('❌ Erro ao buscar planos:', planosError);
        throw planosError;
      }

      // Buscar todos os funcionários para cada CNPJ
      const { data: funcionarios, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('id, cnpj_id, status')
        .in('cnpj_id', cnpjs.map(c => c.id));

      if (funcionariosError) {
        console.error('❌ Erro ao buscar funcionários:', funcionariosError);
        throw funcionariosError;
      }

      // Montar resultado combinado
      const cnpjsComPlanos: CnpjComPlano[] = cnpjs.map(cnpj => {
        const plano = planos?.find(p => p.cnpj_id === cnpj.id);
        const funcionariosCnpj = funcionarios?.filter(f => f.cnpj_id === cnpj.id) || [];
        
        // Calcular pendências
        const funcionariosPendentes = funcionariosCnpj.filter(f => f.status === 'pendente').length;
        const funcionariosExclusaoSolicitada = funcionariosCnpj.filter(f => f.status === 'exclusao_solicitada').length;
        const totalPendencias = funcionariosPendentes + funcionariosExclusaoSolicitada;

        // Contar apenas funcionários ativos e pendentes para o total
        const funcionariosAtivos = funcionariosCnpj.filter(f => f.status === 'ativo' || f.status === 'pendente').length;

        return {
          id: cnpj.id,
          cnpj: cnpj.cnpj,
          razao_social: cnpj.razao_social,
          status: cnpj.status,
          created_at: cnpj.created_at,
          empresa_id: cnpj.empresa_id,
          temPlano: !!plano,
          planoId: plano?.id,
          seguradora: plano?.seguradora,
          valor_mensal: plano?.valor_mensal,
          totalFuncionarios: funcionariosAtivos,
          totalPendencias,
          funcionariosPendentes,
          funcionariosExclusaoSolicitada,
        };
      });

      // Aplicar filtro de plano
      let resultado = cnpjsComPlanos;
      if (filtroPlano === 'com-plano') {
        resultado = cnpjsComPlanos.filter(c => c.temPlano);
      } else if (filtroPlano === 'sem-plano') {
        resultado = cnpjsComPlanos.filter(c => !c.temPlano);
      }

      console.log('✅ CNPJs com planos encontrados:', resultado.length, 'tipo:', tipoSeguro);
      return resultado;
    },
    enabled: true,
  });
}
