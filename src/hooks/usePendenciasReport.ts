import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PendenciasKPIs {
  total_pendencias: number;
  pendencias_criticas: number;
  pendencias_urgentes: number;
  pendencias_normais: number;
}

interface PendenciasPorTipo {
  tipo: string;
  quantidade: number;
  percentual: number;
}

interface TimelineVencimentos {
  data_vencimento: string;
  quantidade: number;
  criticas: number;
  urgentes: number;
}

interface PendenciasPorCnpj {
  cnpj: string;
  razao_social: string;
  total_pendencias: number;
  criticas: number;
  urgentes: number;
}

interface TabelaPendencias {
  id: string;
  protocolo: string;
  tipo: 'documentacao' | 'ativacao' | 'alteracao' | 'cancelamento';
  funcionario_nome: string;
  funcionario_cpf: string;
  cnpj: string;
  razao_social: string;
  descricao: string;
  data_criacao: string;
  data_vencimento: string;
  status_prioridade: 'critica' | 'urgente' | 'normal';
  dias_em_aberto: number;
  comentarios_count: number;
}

export interface PendenciasReportData {
  kpis: PendenciasKPIs;
  pendencias_por_tipo: PendenciasPorTipo[];
  timeline_vencimentos: TimelineVencimentos[];
  pendencias_por_cnpj: PendenciasPorCnpj[];
  tabela_detalhada: TabelaPendencias[];
}

export const calculatePriority = (dataVencimento: string): 'critica' | 'urgente' | 'normal' => {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diasRestantes < 0) return 'critica';     // Vencida
  if (diasRestantes <= 7) return 'urgente';   // Até 7 dias
  return 'normal';                             // Mais de 7 dias
};

export const usePendenciasReport = (
  startDate?: Date,
  endDate?: Date,
  statusFilter?: string,
  tipoFilter?: string,
  cnpjFilter?: string
) => {
  const { data: empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['pendencias-report', empresaId, startDate, endDate, statusFilter, tipoFilter, cnpjFilter],
    queryFn: async (): Promise<PendenciasReportData> => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('Buscando relatório de pendências:', { empresaId, startDate, endDate });

      // Buscar pendências com filtros
      let query = supabase
        .from('pendencias')
        .select(`
          *,
          funcionarios(nome, cpf),
          cnpjs(cnpj, razao_social)
        `)
        .eq('cnpjs.empresa_id', empresaId)
        .eq('status', 'pendente');

      // Aplicar filtros de data
      if (startDate) {
        query = query.gte('data_criacao', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('data_criacao', endDate.toISOString());
      }

      // Aplicar filtro de tipo
      if (tipoFilter && tipoFilter !== 'todas') {
        query = query.eq('tipo', tipoFilter);
      }

      // Aplicar filtro de CNPJ
      if (cnpjFilter && cnpjFilter !== 'todas') {
        query = query.eq('cnpj_id', cnpjFilter);
      }

      const { data: pendenciasRaw, error } = await query;

      if (error) {
        console.error('Erro ao buscar pendências:', error);
        throw error;
      }

      // Processar dados
      const pendencias = (pendenciasRaw || []).map(p => ({
        id: p.id,
        protocolo: p.protocolo,
        tipo: p.tipo as 'documentacao' | 'ativacao' | 'alteracao' | 'cancelamento',
        funcionario_nome: (p.funcionarios as any)?.nome || 'N/A',
        funcionario_cpf: (p.funcionarios as any)?.cpf || 'N/A',
        cnpj: (p.cnpjs as any)?.cnpj || 'N/A',
        razao_social: (p.cnpjs as any)?.razao_social || 'N/A',
        descricao: p.descricao,
        data_criacao: p.data_criacao,
        data_vencimento: p.data_vencimento,
        status_prioridade: calculatePriority(p.data_vencimento),
        dias_em_aberto: Math.ceil((new Date().getTime() - new Date(p.data_criacao).getTime()) / (1000 * 60 * 60 * 24)),
        comentarios_count: p.comentarios_count || 0
      }));

      // Aplicar filtro de status/prioridade
      const pendenciasFiltradas = statusFilter && statusFilter !== 'todas' 
        ? pendencias.filter(p => p.status_prioridade === statusFilter)
        : pendencias;

      // Calcular KPIs
      const kpis: PendenciasKPIs = {
        total_pendencias: pendenciasFiltradas.length,
        pendencias_criticas: pendenciasFiltradas.filter(p => p.status_prioridade === 'critica').length,
        pendencias_urgentes: pendenciasFiltradas.filter(p => p.status_prioridade === 'urgente').length,
        pendencias_normais: pendenciasFiltradas.filter(p => p.status_prioridade === 'normal').length,
      };

      // Calcular distribuição por tipo
      const tiposMap = new Map();
      pendenciasFiltradas.forEach(p => {
        tiposMap.set(p.tipo, (tiposMap.get(p.tipo) || 0) + 1);
      });

      const pendencias_por_tipo: PendenciasPorTipo[] = Array.from(tiposMap.entries()).map(([tipo, quantidade]) => ({
        tipo,
        quantidade,
        percentual: (quantidade / pendenciasFiltradas.length) * 100
      }));

      // Calcular timeline de vencimentos
      const timelineMap = new Map();
      pendenciasFiltradas.forEach(p => {
        const key = p.data_vencimento;
        if (!timelineMap.has(key)) {
          timelineMap.set(key, { criticas: 0, urgentes: 0, normais: 0 });
        }
        const item = timelineMap.get(key);
        if (p.status_prioridade === 'critica') item.criticas++;
        else if (p.status_prioridade === 'urgente') item.urgentes++;
        else item.normais++;
      });

      const timeline_vencimentos: TimelineVencimentos[] = Array.from(timelineMap.entries())
        .map(([data_vencimento, counts]) => ({
          data_vencimento,
          quantidade: counts.criticas + counts.urgentes + counts.normais,
          criticas: counts.criticas,
          urgentes: counts.urgentes
        }))
        .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

      // Calcular distribuição por CNPJ
      const cnpjMap = new Map();
      pendenciasFiltradas.forEach(p => {
        const key = `${p.cnpj}-${p.razao_social}`;
        if (!cnpjMap.has(key)) {
          cnpjMap.set(key, { cnpj: p.cnpj, razao_social: p.razao_social, criticas: 0, urgentes: 0, normais: 0 });
        }
        const item = cnpjMap.get(key);
        if (p.status_prioridade === 'critica') item.criticas++;
        else if (p.status_prioridade === 'urgente') item.urgentes++;
        else item.normais++;
      });

      const pendencias_por_cnpj: PendenciasPorCnpj[] = Array.from(cnpjMap.values()).map(item => ({
        cnpj: item.cnpj,
        razao_social: item.razao_social,
        total_pendencias: item.criticas + item.urgentes + item.normais,
        criticas: item.criticas,
        urgentes: item.urgentes
      }));

      console.log('✅ Relatório de pendências processado:', { 
        total: pendenciasFiltradas.length, 
        kpis,
        tipos: pendencias_por_tipo.length,
        timeline: timeline_vencimentos.length,
        cnpjs: pendencias_por_cnpj.length
      });

      return {
        kpis,
        pendencias_por_tipo,
        timeline_vencimentos,
        pendencias_por_cnpj,
        tabela_detalhada: pendenciasFiltradas
      };
    },
    enabled: !!empresaId,
  });
};
