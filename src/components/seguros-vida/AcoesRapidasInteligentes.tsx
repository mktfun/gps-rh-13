import React, { useState } from 'react';
import { Users, FileText, Settings, TrendingUp, UserPlus, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BulkActivationModal } from '@/components/funcionarios/BulkActivationModal';

interface FuncionarioPendente {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  data_nascimento: string;
  data_admissao: string;
  departamento?: string;
  idade: number;
  tempo_empresa_dias: number;
  status: string;
}

interface AcoesRapidasInteligentesProps {
  funcionarios: FuncionarioPendente[];
  plano: {
    id: string;
    seguradora: string;
    valor_mensal: number;
    empresa_nome: string;
  };
  onGerarRelatorio: () => void;
  onEditarPlano: () => void;
  onAdicionarFuncionario: () => void;
}

export const AcoesRapidasInteligentes: React.FC<AcoesRapidasInteligentesProps> = ({
  funcionarios,
  plano,
  onGerarRelatorio,
  onEditarPlano,
  onAdicionarFuncionario
}) => {
  const [isBulkActivationOpen, setIsBulkActivationOpen] = useState(false);

  const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente');
  const funcionariosExclusaoSolicitada = funcionarios.filter(f => f.status === 'exclusao_solicitada');

  // Calculate potential revenue impact
  const receitaPotencial = funcionariosPendentes.length * plano.valor_mensal;

  const acoes = [
    {
      titulo: 'Ativação Inteligente',
      descricao: `${funcionariosPendentes.length} funcionário(s) pendente(s)`,
      detalhe: `Receita potencial: ${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(receitaPotencial)}/mês`,
      icone: Zap,
      onClick: () => setIsBulkActivationOpen(true),
      disabled: funcionariosPendentes.length === 0,
      variant: 'default' as const,
      badge: funcionariosPendentes.length > 0 ? funcionariosPendentes.length : null,
      priority: true
    },
    {
      titulo: 'Adicionar Funcionário',
      descricao: 'Incluir novo funcionário',
      detalhe: 'Onboarding simplificado',
      icone: UserPlus,
      onClick: onAdicionarFuncionario,
      disabled: false,
      variant: 'outline' as const,
      badge: null,
      priority: false
    },
    {
      titulo: 'Relatório do Plano',
      descricao: 'Analytics e insights',
      detalhe: 'Dados de performance e utilização',
      icone: FileText,
      onClick: onGerarRelatorio,
      disabled: false,
      variant: 'outline' as const,
      badge: null,
      priority: false
    },
    {
      titulo: 'Configurar Plano',
      descricao: 'Ajustar coberturas',
      detalhe: 'Valores e configurações',
      icone: Settings,
      onClick: onEditarPlano,
      disabled: false,
      variant: 'outline' as const,
      badge: null,
      priority: false
    }
  ];

  // Sort actions by priority (pending activations first)
  const sortedAcoes = acoes.sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return 0;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ações Operacionais Inteligentes
          </CardTitle>
          {funcionariosPendentes.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {funcionariosPendentes.length} pendente(s)
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                +{new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(receitaPotencial)}/mês
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {sortedAcoes.map((acao, index) => (
              <Button
                key={index}
                variant={acao.variant}
                disabled={acao.disabled}
                onClick={acao.onClick}
                className={`h-auto p-4 flex items-center justify-start gap-3 ${
                  acao.priority ? 'border-2 border-primary bg-primary/5 hover:bg-primary/10' : ''
                }`}
              >
                <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
                  acao.priority ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <acao.icone className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{acao.titulo}</span>
                    {acao.badge && (
                      <Badge 
                        variant={acao.priority ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {acao.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{acao.descricao}</p>
                  {acao.detalhe && (
                    <p className="text-xs text-muted-foreground mt-1">{acao.detalhe}</p>
                  )}
                </div>
                {acao.priority && (
                  <div className="flex items-center">
                    <Badge variant="default" className="bg-green-600">
                      Recomendado
                    </Badge>
                  </div>
                )}
              </Button>
            ))}
          </div>

          {/* Alerts for important statuses */}
          {funcionariosExclusaoSolicitada.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">
                  {funcionariosExclusaoSolicitada.length} funcionário(s) com exclusão solicitada
                </span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Verifique a aba "Funcionários" para processar as solicitações
              </p>
            </div>
          )}

          {funcionariosPendentes.length === 0 && funcionariosExclusaoSolicitada.length === 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">
                  Todos os funcionários estão ativos
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Não há ações pendentes para este plano
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Activation Modal */}
      <BulkActivationModal
        isOpen={isBulkActivationOpen}
        onClose={() => setIsBulkActivationOpen(false)}
        funcionarios={funcionariosPendentes}
        plano={plano}
      />
    </>
  );
};
