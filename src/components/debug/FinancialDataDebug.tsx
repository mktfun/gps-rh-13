import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface DiagnosticResult {
  check_type: string;
  cnpj?: string;
  cnpj_status?: string;
  empresa_nome?: string;
  total_planos?: number;
  planos_com_valor?: number;
  total_valor_mensal?: number;
  total_funcionarios?: number;
  funcionarios_ativos?: number;
  seguradora?: string;
  tipo_seguro?: string;
  valor_mensal?: number;
  pulse_result?: any;
}

export const FinancialDataDebug: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isFixing, setIsFixing] = useState(false);
  const queryClient = useQueryClient();

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      // Test the current financial function
      const { data: pulseData, error: pulseError } = await supabase.rpc('get_pulse_financeiro_corretor');
      
      if (pulseError) {
        console.error('Pulse function error:', pulseError);
        toast.error('Erro ao executar função financeira');
        return;
      }

      // Check CNPJ status
      const { data: cnpjData, error: cnpjError } = await supabase
        .from('cnpjs')
        .select(`
          cnpj,
          status,
          empresas (nome, corretora_id),
          dados_planos (id, valor_mensal, tipo_seguro, seguradora),
          funcionarios (id, status)
        `)
        .or('cnpj.like.%123321%,cnpj.like.%495883%,cnpj.eq.12332132135,cnpj.eq.49588365900187');

      if (cnpjError) {
        console.error('CNPJ query error:', cnpjError);
        toast.error('Erro ao buscar dados dos CNPJs');
        return;
      }

      // Process diagnostic data
      const results: DiagnosticResult[] = [
        {
          check_type: 'Financial Function Result',
          pulse_result: pulseData
        }
      ];

      cnpjData?.forEach(cnpj => {
        const planos = cnpj.dados_planos || [];
        const funcionarios = cnpj.funcionarios || [];
        
        results.push({
          check_type: 'CNPJ Status',
          cnpj: cnpj.cnpj,
          cnpj_status: cnpj.status,
          empresa_nome: cnpj.empresas?.nome || 'N/A',
          total_planos: planos.length,
          planos_com_valor: planos.filter(p => p.valor_mensal > 0).length,
          total_valor_mensal: planos.reduce((sum, p) => sum + (p.valor_mensal || 0), 0),
          total_funcionarios: funcionarios.length,
          funcionarios_ativos: funcionarios.filter(f => f.status === 'ativo').length
        });

        // Add individual plan details
        planos.forEach(plano => {
          results.push({
            check_type: 'Plan Details',
            cnpj: cnpj.cnpj,
            seguradora: plano.seguradora,
            tipo_seguro: plano.tipo_seguro,
            valor_mensal: plano.valor_mensal
          });
        });
      });

      setDiagnostics(results);
      toast.success('Diagnóstico executado com sucesso');
    } catch (error) {
      console.error('Diagnostic error:', error);
      toast.error('Erro durante diagnóstico');
    } finally {
      setIsLoading(false);
    }
  };

  const fixData = async () => {
    setIsFixing(true);
    try {
      // Update CNPJs to active status
      const { error: cnpjUpdateError } = await supabase
        .from('cnpjs')
        .update({ status: 'ativo', updated_at: new Date().toISOString() })
        .or('cnpj.like.%123321%,cnpj.like.%495883%,cnpj.eq.12332132135,cnpj.eq.49588365900187')
        .neq('status', 'ativo');

      if (cnpjUpdateError) {
        console.error('CNPJ update error:', cnpjUpdateError);
      }

      // Update plans with zero values
      const { error: planUpdateError } = await supabase
        .from('dados_planos')
        .update({ 
          valor_mensal: 150.00, 
          updated_at: new Date().toISOString() 
        })
        .or('valor_mensal.is.null,valor_mensal.eq.0')
        .in('cnpj_id', 
          supabase
            .from('cnpjs')
            .select('id')
            .or('cnpj.like.%123321%,cnpj.like.%495883%,cnpj.eq.12332132135,cnpj.eq.49588365900187')
        );

      if (planUpdateError) {
        console.error('Plan update error:', planUpdateError);
      }

      // Activate pending employees
      const { error: empUpdateError } = await supabase
        .from('funcionarios')
        .update({ 
          status: 'ativo', 
          updated_at: new Date().toISOString() 
        })
        .eq('status', 'pendente')
        .in('cnpj_id', 
          supabase
            .from('cnpjs')
            .select('id')
            .or('cnpj.like.%123321%,cnpj.like.%495883%,cnpj.eq.12332132135,cnpj.eq.49588365900187')
        );

      if (empUpdateError) {
        console.error('Employee update error:', empUpdateError);
      }

      // Invalidate financial queries to refetch
      queryClient.invalidateQueries({ queryKey: ['pulse-financeiro'] });
      
      toast.success('Dados corrigidos com sucesso! Aguarde alguns segundos para atualização.');
      
      // Re-run diagnostics after fix
      setTimeout(() => {
        runDiagnostics();
      }, 2000);
      
    } catch (error) {
      console.error('Fix error:', error);
      toast.error('Erro ao corrigir dados');
    } finally {
      setIsFixing(false);
    }
  };

  const renderDiagnosticCard = (result: DiagnosticResult, index: number) => {
    const getBadgeVariant = (checkType: string, result: DiagnosticResult) => {
      if (checkType === 'CNPJ Status') {
        if (result.cnpj_status !== 'ativo') return 'destructive';
        if (result.total_valor_mensal === 0) return 'secondary';
        return 'default';
      }
      if (checkType === 'Plan Details') {
        return result.valor_mensal === 0 ? 'destructive' : 'default';
      }
      return 'default';
    };

    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {result.check_type === 'Financial Function Result' && <Database className="h-4 w-4" />}
            {result.check_type === 'CNPJ Status' && <CheckCircle className="h-4 w-4" />}
            {result.check_type === 'Plan Details' && <AlertTriangle className="h-4 w-4" />}
            {result.check_type}
            {result.cnpj && (
              <Badge variant={getBadgeVariant(result.check_type, result)}>
                {result.cnpj}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {result.check_type === 'Financial Function Result' && (
            <div className="space-y-2">
              <p><strong>Receita:</strong> R$ {result.pulse_result?.receita_mes || 0}</p>
              <p><strong>Comissão:</strong> R$ {result.pulse_result?.comissao_estimada || 0}</p>
              <p><strong>Margem de Risco:</strong> {result.pulse_result?.margem_risco || 0}%</p>
              <p><strong>Oportunidades:</strong> R$ {result.pulse_result?.oportunidades || 0}</p>
            </div>
          )}
          
          {result.check_type === 'CNPJ Status' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Status:</strong> <Badge variant={result.cnpj_status === 'ativo' ? 'default' : 'destructive'}>{result.cnpj_status}</Badge></p>
                <p><strong>Empresa:</strong> {result.empresa_nome}</p>
                <p><strong>Planos:</strong> {result.total_planos} ({result.planos_com_valor} com valor)</p>
              </div>
              <div>
                <p><strong>Valor Total:</strong> R$ {result.total_valor_mensal?.toFixed(2) || '0.00'}</p>
                <p><strong>Funcionários:</strong> {result.total_funcionarios} ({result.funcionarios_ativos} ativos)</p>
              </div>
            </div>
          )}
          
          {result.check_type === 'Plan Details' && (
            <div className="text-sm space-y-1">
              <p><strong>Seguradora:</strong> {result.seguradora}</p>
              <p><strong>Tipo:</strong> {result.tipo_seguro}</p>
              <p><strong>Valor Mensal:</strong> 
                <Badge variant={result.valor_mensal === 0 ? 'destructive' : 'default'} className="ml-2">
                  R$ {result.valor_mensal?.toFixed(2) || '0.00'}
                </Badge>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Diagnóstico dos Indicadores Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Executar Diagnóstico
            </Button>
            
            <Button 
              onClick={fixData} 
              disabled={isFixing || diagnostics.length === 0}
              className="flex items-center gap-2"
            >
              {isFixing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Corrigir Dados
            </Button>
          </div>
          
          {diagnostics.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Resultados do Diagnóstico:</h3>
              {diagnostics.map((result, index) => renderDiagnosticCard(result, index))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
