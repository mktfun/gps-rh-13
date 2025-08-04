
import React from 'react';
import { Users, FileText, Settings, TrendingUp, UserPlus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AcoesRapidasProps {
  funcionarios: any[];
  plano: any;
  onAtivarPendentes: () => void;
  onGerarRelatorio: () => void;
  onEditarPlano: () => void;
  onAdicionarFuncionario: () => void;
}

export const AcoesRapidas: React.FC<AcoesRapidasProps> = ({
  funcionarios,
  plano,
  onAtivarPendentes,
  onGerarRelatorio,
  onEditarPlano,
  onAdicionarFuncionario
}) => {
  const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente');
  const funcionariosExclusaoSolicitada = funcionarios.filter(f => f.status === 'exclusao_solicitada');

  const acoes = [
    {
      titulo: 'Ativar Pendentes',
      descricao: `${funcionariosPendentes.length} funcionário(s)`,
      icone: Users,
      onClick: onAtivarPendentes,
      disabled: funcionariosPendentes.length === 0,
      variant: 'default' as const,
      badge: funcionariosPendentes.length > 0 ? funcionariosPendentes.length : null
    },
    {
      titulo: 'Adicionar Funcionário',
      descricao: 'Novo funcionário no plano',
      icone: UserPlus,
      onClick: onAdicionarFuncionario,
      disabled: false,
      variant: 'outline' as const,
      badge: null
    },
    {
      titulo: 'Gerar Relatório',
      descricao: 'Relatório do plano',
      icone: FileText,
      onClick: onGerarRelatorio,
      disabled: false,
      variant: 'outline' as const,
      badge: null
    },
    {
      titulo: 'Editar Plano',
      descricao: 'Configurações do plano',
      icone: Settings,
      onClick: onEditarPlano,
      disabled: false,
      variant: 'outline' as const,
      badge: null
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {acoes.map((acao, index) => (
            <Button
              key={index}
              variant={acao.variant}
              disabled={acao.disabled}
              onClick={acao.onClick}
              className="h-auto p-4 flex items-center justify-start gap-3"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                <acao.icone className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{acao.titulo}</span>
                  {acao.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {acao.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{acao.descricao}</p>
              </div>
            </Button>
          ))}
        </div>

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
      </CardContent>
    </Card>
  );
};
