
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, AlertTriangle, CheckCircle, Download, Search } from 'lucide-react';
import { usePendenciasEmpresa } from '@/hooks/usePendenciasEmpresa';
import { PendenciasBadges } from '@/components/relatorios/PendenciasBadges';
import { TabelaPendenciasDetalhadas } from '@/components/relatorios/TabelaPendenciasDetalhadas';
import { GraficoPendenciasPorTipo } from '@/components/relatorios/GraficoPendenciasPorTipo';
import { GraficoPendenciasPorCnpj } from '@/components/relatorios/GraficoPendenciasPorCnpj';
import { GraficoTimelineVencimentos } from '@/components/relatorios/GraficoTimelineVencimentos';
import { FiltrosPendencias } from '@/components/relatorios/FiltrosPendencias';

interface PendenciasPorTipo {
  tipo: string;
  quantidade: number;
  percentual: number;
}

interface PendenciasPorCnpj {
  cnpj: string;
  razao_social: string;
  total_pendencias: number;
  criticas: number;
  urgentes: number;
}

interface TimelineVencimentos {
  data_vencimento: string;
  quantidade: number;
  criticas: number;
  urgentes: number;
}

export default function RelatorioPendenciasEmpresaPage() {
  const { data: pendencias = [], isLoading } = usePendenciasEmpresa();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todos');

  // Aplicar filtros
  const pendenciasFiltradas = useMemo(() => {
    return pendencias.filter(pendencia => {
      const matchSearch = searchTerm === '' || 
        pendencia.funcionario_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pendencia.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pendencia.razao_social.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTipo = filtroTipo === 'todos' || pendencia.tipo === filtroTipo;
      const matchStatus = filtroStatus === 'todos' || pendencia.status === filtroStatus;
      
      // Safe arithmetic operation - check if dias_em_aberto is a number
      const diasEmAberto = typeof pendencia.dias_em_aberto === 'number' ? pendencia.dias_em_aberto : 0;
      const matchPrioridade = filtroPrioridade === 'todos' || 
        (filtroPrioridade === 'critica' && diasEmAberto > 30) ||
        (filtroPrioridade === 'urgente' && diasEmAberto > 15 && diasEmAberto <= 30) ||
        (filtroPrioridade === 'normal' && diasEmAberto <= 15);

      return matchSearch && matchTipo && matchStatus && matchPrioridade;
    });
  }, [pendencias, searchTerm, filtroTipo, filtroStatus, filtroPrioridade]);

  // Calcular métricas
  const metricas = useMemo(() => {
    const total = pendenciasFiltradas.length;
    const pendentesTotais = pendenciasFiltradas.filter(p => p.status === 'pendente').length;
    
    // Safe arithmetic operations
    const criticas = pendenciasFiltradas.filter(p => {
      const dias = typeof p.dias_em_aberto === 'number' ? p.dias_em_aberto : 0;
      return dias > 30;
    }).length;
    
    const urgentes = pendenciasFiltradas.filter(p => {
      const dias = typeof p.dias_em_aberto === 'number' ? p.dias_em_aberto : 0;
      return dias > 15 && dias <= 30;
    }).length;

    const mediaDias = total > 0 ? 
      pendenciasFiltradas.reduce((acc, p) => {
        const dias = typeof p.dias_em_aberto === 'number' ? p.dias_em_aberto : 0;
        return acc + dias;
      }, 0) / total : 0;

    return {
      total,
      pendentes: pendentesTotais,
      criticas,
      urgentes,
      mediaDias: Math.round(mediaDias)
    };
  }, [pendenciasFiltradas]);

  // Dados para gráficos com safe type handling
  const dadosPorTipo = useMemo(() => {
    const tiposCount = pendenciasFiltradas.reduce((acc, p) => {
      acc[p.tipo] = (acc[p.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(tiposCount).reduce((sum, count) => sum + count, 0);

    return Object.entries(tiposCount).map(([tipo, quantidade]): PendenciasPorTipo => ({
      tipo,
      quantidade: Number(quantidade) || 0,
      percentual: total > 0 ? Math.round((Number(quantidade) / total) * 100) : 0
    }));
  }, [pendenciasFiltradas]);

  const dadosPorCnpj = useMemo(() => {
    const cnpjsData = pendenciasFiltradas.reduce((acc, p) => {
      const key = p.cnpj;
      if (!acc[key]) {
        acc[key] = {
          cnpj: p.cnpj,
          razao_social: p.razao_social,
          total_pendencias: 0,
          criticas: 0,
          urgentes: 0
        };
      }
      
      acc[key].total_pendencias++;
      
      const dias = typeof p.dias_em_aberto === 'number' ? p.dias_em_aberto : 0;
      if (dias > 30) acc[key].criticas++;
      else if (dias > 15) acc[key].urgentes++;
      
      return acc;
    }, {} as Record<string, PendenciasPorCnpj>);

    return Object.values(cnpjsData);
  }, [pendenciasFiltradas]);

  const timelineVencimentos = useMemo(() => {
    const vencimentosData = pendenciasFiltradas.reduce((acc, p) => {
      const key = p.data_vencimento;
      if (!acc[key]) {
        acc[key] = {
          data_vencimento: key,
          quantidade: 0,
          criticas: 0,
          urgentes: 0
        };
      }
      
      acc[key].quantidade++;
      
      const dias = typeof p.dias_em_aberto === 'number' ? p.dias_em_aberto : 0;
      if (dias > 30) acc[key].criticas++;
      else if (dias > 15) acc[key].urgentes++;
      
      return acc;
    }, {} as Record<string, TimelineVencimentos>);

    return Object.values(vencimentosData).sort((a, b) => 
      new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
    );
  }, [pendenciasFiltradas]);

  const exportarRelatorio = () => {
    const csvContent = [
      ['Protocolo', 'Tipo', 'Funcionário', 'CPF', 'CNPJ', 'Razão Social', 'Status', 'Dias em Aberto', 'Data Vencimento'].join(','),
      ...pendenciasFiltradas.map(p => [
        p.protocolo,
        p.tipo,
        p.funcionario_nome,
        p.funcionario_cpf,
        p.cnpj,
        p.razao_social,
        p.status,
        p.dias_em_aberto,
        p.data_vencimento
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pendencias_empresa_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatório de Pendências</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe todas as pendências da sua empresa
          </p>
        </div>
        <Button onClick={exportarRelatorio} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Badges de métricas */}
      <PendenciasBadges 
        total={metricas.total}
        pendentes={metricas.pendentes}
        criticas={metricas.criticas}
        urgentes={metricas.urgentes}
        mediaDias={metricas.mediaDias}
      />

      {/* Filtros */}
      <FiltrosPendencias
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filtroTipo={filtroTipo}
        onTipoChange={setFiltroTipo}
        filtroStatus={filtroStatus}
        onStatusChange={setFiltroStatus}
        filtroPrioridade={filtroPrioridade}
        onPrioridadeChange={setFiltroPrioridade}
        tipos={[...new Set(pendencias.map(p => p.tipo))]}
      />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoPendenciasPorTipo dados={dadosPorTipo} />
        <GraficoPendenciasPorCnpj dados={dadosPorCnpj} />
      </div>

      <GraficoTimelineVencimentos dados={timelineVencimentos} />

      {/* Tabela detalhada */}
      <TabelaPendenciasDetalhadas pendencias={pendenciasFiltradas} />
    </div>
  );
}
