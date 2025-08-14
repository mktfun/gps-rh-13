import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, AlertTriangle, CheckCircle, Download, Search } from 'lucide-react';
import { usePendenciasEmpresa } from '@/hooks/usePendenciasEmpresa';
import { TipoPendenciaBadge, PrioridadePendenciaBadge } from '@/components/relatorios/PendenciasBadges';
import TabelaPendenciasDetalhadas from '@/components/relatorios/TabelaPendenciasDetalhadas';
import GraficoPendenciasPorTipo from '@/components/relatorios/GraficoPendenciasPorTipo';
import GraficoPendenciasPorCnpj from '@/components/relatorios/GraficoPendenciasPorCnpj';
import GraficoTimelineVencimentos from '@/components/relatorios/GraficoTimelineVencimentos';
import FiltrosPendencias from '@/components/relatorios/FiltrosPendencias';

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

// Create a simple PendenciasBadges component since it doesn't exist
const PendenciasBadges = ({ total, pendentes, criticas, urgentes, mediaDias }: {
  total: number;
  pendentes: number;
  criticas: number;
  urgentes: number;
  mediaDias: number;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-gray-900">{total}</div>
        <div className="text-sm text-gray-600">Total de Pendências</div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{pendentes}</div>
        <div className="text-sm text-gray-600">Pendentes</div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-red-600">{criticas}</div>
        <div className="text-sm text-gray-600">Críticas</div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-orange-600">{urgentes}</div>
        <div className="text-sm text-gray-600">Urgentes</div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-gray-700">{mediaDias}</div>
        <div className="text-sm text-gray-600">Média de Dias</div>
      </CardContent>
    </Card>
  </div>
);

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

      {/* Filtros - Simple filter implementation since FiltrosPendencias needs complex props */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Protocolo, funcionário, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tipo</label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="documentacao">Documentação</SelectItem>
                <SelectItem value="ativacao">Ativação</SelectItem>
                <SelectItem value="alteracao">Alteração</SelectItem>
                <SelectItem value="cancelamento">Cancelamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Prioridade</label>
            <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Simple table instead of complex components until they're fixed */}
      <Card>
        <CardHeader>
          <CardTitle>Pendências Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Protocolo</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Funcionário</th>
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Dias em Aberto</th>
                </tr>
              </thead>
              <tbody>
                {pendenciasFiltradas.map((pendencia) => (
                  <tr key={pendencia.protocolo} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <Badge variant="outline">{pendencia.protocolo}</Badge>
                    </td>
                    <td className="p-2">
                      <TipoPendenciaBadge tipo={pendencia.tipo as any} />
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{pendencia.funcionario_nome}</div>
                        <div className="text-sm text-gray-500">{pendencia.funcionario_cpf}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{pendencia.razao_social}</div>
                        <div className="text-sm text-gray-500">{pendencia.cnpj}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant={pendencia.status === 'pendente' ? 'destructive' : 'default'}>
                        {pendencia.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <span className="font-medium">{pendencia.dias_em_aberto}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
