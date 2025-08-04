
import React from 'react';
import { useParams } from 'react-router-dom';
import { AtivarFuncionarioForm } from '@/components/funcionarios/AtivarFuncionarioForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, AlertCircle } from 'lucide-react';
import { useAtivarFuncionario } from '@/hooks/useAtivarFuncionario';
import { DashboardLoadingState } from '@/components/ui/loading-state';

const AtivarFuncionario = () => {
  const { funcionarioId } = useParams<{ funcionarioId: string }>();
  const { funcionario, planos, isLoading, error } = useAtivarFuncionario(funcionarioId || '');

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (!funcionarioId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">
            Funcionário não encontrado
          </p>
          <p className="text-sm text-muted-foreground">
            Verifique se o link está correto ou tente novamente
          </p>
        </div>
      </div>
    );
  }

  if (error || !funcionario) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">
            Erro ao carregar funcionário
          </p>
          <p className="text-sm text-muted-foreground">
            Tente novamente mais tarde
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Ativar Funcionário</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ativação de Plano de Seguro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AtivarFuncionarioForm 
            funcionario={funcionario}
            planos={planos}
            onSuccess={() => window.history.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AtivarFuncionario;
