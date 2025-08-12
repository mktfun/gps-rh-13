
import React, { useMemo, useState } from 'react';
import { usePendenciasDaCorretora } from '@/hooks/usePendenciasDaCorretora';
import FiltrosPendencias, { FiltrosState } from '@/components/relatorios/FiltrosPendencias';
import KpiCardGrid from '@/components/relatorios/KpiCardGrid';
import GraficoPendenciasPorTipo from '@/components/relatorios/GraficoPendenciasPorTipo';
import GraficoTimelineVencimentos from '@/components/relatorios/GraficoTimelineVencimentos';
import GraficoPendenciasPorCnpj from '@/components/relatorios/GraficoPendenciasPorCnpj';
import TabelaPendenciasDetalhadas from '@/components/relatorios/TabelaPendenciasDetalhadas';
import ModalConversaPendencia from '@/components/relatorios/ModalConversaPendencia';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const useEmpresasDaCorretora = () => {
  return useQuery({
    queryKey: ['empresas-da-corretora'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('corretora_id', user.id)
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as { id: string; nome: string }[];
    },
  });
};

const useCnpjsDaEmpresa = (empresaId?: string) => {
  return useQuery({
    queryKey: ['cnpjs-da-empresa', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('cnpjs')
        .select('id, cnpj, razao_social')
        .eq('empresa_id', empresaId)
        .order('razao_social', { ascending: true });
      if (error) throw error;
      return (data || []) as { id: string; cnpj: string; razao_social: string }[];
    },
    enabled: !!empresaId,
  });
};

const RelatorioPendenciasCorretoraPage: React.FC = () => {
  const [filtros, setFiltros] = useState<FiltrosState>({
    status: 'todas',
    tipo: 'todas',
  });
  const { data: empresas = [] } = useEmpresasDaCorretora();
  const { data: cnpjs = [], isLoading: loadingCnpjs } = useCnpjsDaEmpresa(filtros.empresaId);

  const queryFilters = useMemo(() => ({
    periodo: {
      inicio: filtros.inicio ? new Date(filtros.inicio) : undefined,
      fim: filtros.fim ? new Date(filtros.fim) : undefined,
    },
    status: filtros.status,
    tipo: filtros.tipo === 'todas' ? undefined : (filtros.tipo as any),
    empresaId: filtros.empresaId,
    cnpjId: filtros.cnpjId,
    search: filtros.search,
  }), [filtros]);

  const { data: pendencias = [], isLoading } = usePendenciasDaCorretora(queryFilters);

  const [modalOpen, setModalOpen] = useState(false);
  const [selecionada, setSelecionada] = useState<any>(null);

  const abrirConversa = (p: any) => {
    setSelecionada(p);
    setModalOpen(true);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Relatório de Pendências — Corretora</h1>
        <Button variant="outline" onClick={() => window.print()}>Exportar</Button>
      </div>

      <FiltrosPendencias
        value={filtros}
        onChange={setFiltros}
        empresas={empresas}
        cnpjs={cnpjs}
        loadingCnpjs={loadingCnpjs}
        onBuscar={() => setFiltros({ ...filtros })}
      />

      {isLoading ? (
        <Card className="p-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Carregando pendências...
        </Card>
      ) : (
        <>
          <KpiCardGrid pendencias={pendencias} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GraficoPendenciasPorTipo pendencias={pendencias} />
            <GraficoTimelineVencimentos pendencias={pendencias} />
            <GraficoPendenciasPorCnpj pendencias={pendencias} />
          </div>

          <TabelaPendenciasDetalhadas pendencias={pendencias} onAbrirConversa={abrirConversa} />
        </>
      )}

      <ModalConversaPendencia
        open={modalOpen}
        onOpenChange={setModalOpen}
        pendencia={selecionada}
      />
    </div>
  );
};

export default RelatorioPendenciasCorretoraPage;
