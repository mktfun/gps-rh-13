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

      // 1. Buscar CNPJs da empresa
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

      const cnpjIds = cnpjs.map(c => c.id);

      // 2. Buscar TODOS os planos para esses CNPJs, SEM FILTRO DE TIPO AINDA
      const { data: todosOsPlanos, error: planosError } = await supabase
        .from('dados_planos')
        .select('*')
        .in('cnpj_id', cnpjIds);

      if (planosError) {
        console.error('❌ Erro ao buscar planos:', planosError);
        throw planosError;
      }

      // 3. Buscar todos os funcionários para cada CNPJ
      const { data: funcionarios, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('id, cnpj_id, status')
        .in('cnpj_id', cnpjIds);

      if (funcionariosError) {
        console.error('❌ Erro ao buscar funcionários:', funcionariosError);
        throw funcionariosError;
      }

      // 4. Montar resultado com a lógica correta
      const cnpjsComPlanos: CnpjComPlano[] = cnpjs.map(cnpj => {
        // ✅ CORREÇÃO: Encontra o plano específico do tipo que estamos procurando
        // Se tipoSeguro não for especificado, busca qualquer plano (compatibilidade)
        const planoDoTipoEspecifico = tipoSeguro 
          ? todosOsPlanos?.find(p => p.cnpj_id === cnpj.id && p.tipo_seguro === tipoSeguro)
          : todosOsPlanos?.find(p => p.cnpj_id === cnpj.id);
        
        const funcionariosCnpj = funcionarios?.filter(f => f.cnpj_id === cnpj.id) || [];
        
        // Calcular pendências
        const funcionariosPendentes = funcionariosCnpj.filter(f => f.status === 'pendente').length;
        const funcionariosExclusaoSolicitada = funcionariosCnpj.filter(f => f.status === 'exclusao_solicitada').length;
        const totalPendencias = funcionariosPendentes + funcionariosExclusaoSolicitada;

        // Contar apenas funcionários ativos e pendentes para o total
        // Separate counts for clarity
        const funcionariosAtivos = funcionariosCnpj.filter(f => f.status === 'ativo').length;
        const funcionariosPendentes = funcionariosCnpj.filter(f => f.status === 'pendente').length;
        const totalFuncionarios = funcionariosAtivos + funcionariosPendentes;

        return {
          id: cnpj.id,
          cnpj: cnpj.cnpj,
          razao_social: cnpj.razao_social,
          status: cnpj.status,
          created_at: cnpj.created_at,
          empresa_id: cnpj.empresa_id,
          // ✅ CORREÇÃO: "temPlano" agora significa "tem plano DO TIPO que eu pedi?"
          temPlano: !!planoDoTipoEspecifico,
          planoId: planoDoTipoEspecifico?.id,
          seguradora: planoDoTipoEspecifico?.seguradora,
          valor_mensal: planoDoTipoEspecifico?.valor_mensal,
          totalFuncionarios: funcionariosAtivos,
          totalPendencias,
          funcionariosPendentes,
          funcionariosExclusaoSolicitada,
        };
      });

      // Aplicar filtro de plano (agora funciona corretamente para o tipo específico)
      let resultado = cnpjsComPlanos;
      if (filtroPlano === 'com-plano') {
        resultado = cnpjsComPlanos.filter(c => c.temPlano);
      } else if (filtroPlano === 'sem-plano') {
        resultado = cnpjsComPlanos.filter(c => !c.temPlano);
      }

      console.log('✅ CNPJs com planos encontrados (lógica corrigida):', resultado.length, 'tipo:', tipoSeguro);
      return resultado;
    },
    enabled: true,
  });
}
