
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInCalendarDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export type PendenciaPrioridade = 'critico' | 'urgente' | 'normal';
export type FiltroTipoPendencia = 'documentacao' | 'ativacao' | 'alteracao' | 'cancelamento';

export interface PendenciaItem {
  id: string;
  protocolo: string;
  tipo: string;
  status_db: string; // status do banco (ex: 'pendente')
  descricao: string;
  funcionario_id: string | null;
  cnpj_id: string;
  data_criacao: string;
  data_vencimento: string;
  comentarios_count: number;
  funcionario_nome?: string;
  empresa_id?: string;
  empresa_nome?: string;
  cnpj_numero?: string;
  cnpj_razao_social?: string;
  prioridade?: PendenciaPrioridade;
  dias_em_aberto?: number;
}

export interface PendenciasCorretoraFilters {
  periodo?: { inicio?: Date | null; fim?: Date | null };
  status?: PendenciaPrioridade | 'todas';
  tipo?: FiltroTipoPendencia | 'todas';
  empresaId?: string;
  cnpjId?: string;
  search?: string;
}

const calcularPrioridade = (dataVenc: string | null | undefined): PendenciaPrioridade => {
  if (!dataVenc) return 'normal';
  const hoje = startOfDay(new Date());
  const venc = startOfDay(new Date(dataVenc));
  const dias = differenceInCalendarDays(venc, hoje);
  if (dias < 0) return 'critico';   // já venceu
  if (dias <= 3) return 'urgente';  // até 3 dias
  return 'normal';
};

const calcularDiasEmAberto = (dataCriacao: string): number => {
  try {
    const hoje = startOfDay(new Date());
    const criacao = startOfDay(new Date(dataCriacao));
    return Math.max(differenceInCalendarDays(hoje, criacao), 0);
  } catch {
    return 0;
  }
};

export const usePendenciasDaCorretora = (filters: PendenciasCorretoraFilters = {}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pendencias-corretora', user?.id, filters],
    queryFn: async (): Promise<PendenciaItem[]> => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Seleção com embed de relações para permitir filtros por empresa e enriquecer dados
      let query = supabase
        .from('pendencias')
        .select(`
          id,
          protocolo,
          tipo,
          status,
          descricao,
          funcionario_id,
          cnpj_id,
          data_criacao,
          data_vencimento,
          comentarios_count,
          funcionarios (
            id,
            nome
          ),
          cnpjs (
            id,
            cnpj,
            razao_social,
            empresa_id,
            empresas (
              id,
              nome
            )
          )
        `)
        // Filtro de segurança: escopo por corretora
        .eq('corretora_id', user.id)
        .order('data_vencimento', { ascending: true });

      // Filtros server-side
      if (filters?.periodo?.inicio) {
        const inicio = startOfDay(filters.periodo.inicio);
        query = query.gte('data_criacao', inicio.toISOString());
      }
      if (filters?.periodo?.fim) {
        const fim = endOfDay(filters.periodo.fim);
        query = query.lte('data_criacao', fim.toISOString());
      }
      if (filters?.tipo && filters.tipo !== 'todas') {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.cnpjId) {
        query = query.eq('cnpj_id', filters.cnpjId);
      }
      if (filters?.empresaId) {
        // Filtro por empresa via embed
        query = query.eq('cnpjs.empresa_id', filters.empresaId as any);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao buscar pendências da corretora:', error);
        throw error;
      }

      // Mapear e enriquecer dados
      const itens = (data || []).map((row: any) => {
        const funcionarioNome = row.funcionarios?.nome || '';
        const empresaId = row.cnpjs?.empresa_id || row.cnpjs?.empresas?.id;
        const empresaNome = row.cnpjs?.empresas?.nome || '';
        const cnpjNumero = row.cnpjs?.cnpj || '';
        const razaoSocial = row.cnpjs?.razao_social || '';
        const prioridade = calcularPrioridade(row.data_vencimento);
        const diasAberto = calcularDiasEmAberto(row.data_criacao);

        const item: PendenciaItem = {
          id: row.id,
          protocolo: row.protocolo,
          tipo: row.tipo,
          status_db: row.status,
          descricao: row.descricao,
          funcionario_id: row.funcionario_id,
          cnpj_id: row.cnpj_id,
          data_criacao: row.data_criacao,
          data_vencimento: row.data_vencimento,
          comentarios_count: row.comentarios_count || 0,
          funcionario_nome: funcionarioNome,
          empresa_id: empresaId,
          empresa_nome: empresaNome,
          cnpj_numero: cnpjNumero,
          cnpj_razao_social: razaoSocial,
          prioridade,
          dias_em_aberto: diasAberto,
        };
        return item;
      }) as PendenciaItem[];

      // Filtros client-side (status/prioridade e busca)
      let filtrados = itens;

      if (filters?.status && filters.status !== 'todas') {
        filtrados = filtrados.filter(p => p.prioridade === filters.status);
      }

      if (filters?.search && filters.search.trim()) {
        const s = filters.search.trim().toLowerCase();
        filtrados = filtrados.filter(p =>
          (p.protocolo || '').toLowerCase().includes(s) ||
          (p.funcionario_nome || '').toLowerCase().includes(s) ||
          (p.cnpj_razao_social || '').toLowerCase().includes(s)
        );
      }

      // Ordenação padrão: por data de vencimento asc
      filtrados.sort((a, b) => {
        const da = a.data_vencimento ? new Date(a.data_vencimento).getTime() : 0;
        const db = b.data_vencimento ? new Date(b.data_vencimento).getTime() : 0;
        return da - db;
      });

      return filtrados;
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
