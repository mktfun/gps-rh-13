
import React from 'react';
import { Clock, UserX, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface GestorPendenciasProps {
  funcionarios: any[];
  onAtivarFuncionario: (id: string) => void;
  onProcessarExclusao: (id: string) => void;
  onNavigateToFuncionarios: () => void;
}

export const GestorPendencias: React.FC<GestorPendenciasProps> = ({
  funcionarios,
  onAtivarFuncionario,
  onProcessarExclusao,
  onNavigateToFuncionarios
}) => {
  const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente');
  const funcionariosExclusaoSolicitada = funcionarios.filter(f => f.status === 'exclusao_solicitada');
  const funcionariosDesativados = funcionarios.filter(f => f.status === 'desativado');

  const pendencias = [
    ...funcionariosPendentes.map(f => ({
      id: f.id,
      tipo: 'ativacao',
      nome: f.nome,
      descricao: 'Aguardando ativação',
      icone: Clock,
      cor: 'text-yellow-600',
      bgCor: 'bg-yellow-50',
      badge: 'secondary' as const,
      acao: () => onAtivarFuncionario(f.id)
    })),
    ...funcionariosExclusaoSolicitada.map(f => ({
      id: f.id,
      tipo: 'exclusao',
      nome: f.nome,
      descricao: 'Exclusão solicitada',
      icone: UserX,
      cor: 'text-orange-600',
      bgCor: 'bg-orange-50',
      badge: 'destructive' as const,
      acao: () => onProcessarExclusao(f.id)
    })),
    ...funcionariosDesativados.map(f => ({
      id: f.id,
      tipo: 'desativado',
      nome: f.nome,
      descricao: 'Funcionário desativado',
      icone: AlertTriangle,
      cor: 'text-red-600',
      bgCor: 'bg-red-50',
      badge: 'destructive' as const,
      acao: () => onAtivarFuncionario(f.id)
    }))
  ];

  if (pendencias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Gestão de Pendências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Nenhuma Pendência
            </h3>
            <p className="text-green-600">
              Todos os funcionários estão com status adequado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Gestão de Pendências
          <Badge variant="secondary">{pendencias.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendencias.slice(0, 5).map((pendencia, index) => (
            <div key={index} className={`p-3 rounded-lg border ${pendencia.bgCor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <pendencia.icone className={`h-4 w-4 ${pendencia.cor}`} />
                  <div>
                    <span className="font-medium">{pendencia.nome}</span>
                    <p className="text-sm text-muted-foreground">{pendencia.descricao}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pendencia.badge}>
                    {pendencia.tipo === 'ativacao' ? 'Pendente' : 
                     pendencia.tipo === 'exclusao' ? 'Exclusão' : 'Desativado'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={pendencia.acao}
                  >
                    {pendencia.tipo === 'ativacao' ? 'Ativar' : 
                     pendencia.tipo === 'exclusao' ? 'Processar' : 'Reativar'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {pendencias.length > 5 && (
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={onNavigateToFuncionarios}
              >
                Ver mais {pendencias.length - 5} pendência(s)
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
