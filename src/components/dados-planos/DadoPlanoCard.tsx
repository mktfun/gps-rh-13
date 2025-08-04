
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Plus, Trash2, Building2 } from 'lucide-react';
import { useDadosPlanos } from '@/hooks/useDadosPlanos';
import { DadoPlanoModal } from './DadoPlanoModal';
import { Database } from '@/integrations/supabase/types';

type DadoPlano = Database['public']['Tables']['dados_planos']['Row'];

interface DadoPlanoCardProps {
  cnpjId: string;
  cnpjInfo: {
    cnpj: string;
    razao_social: string;
    empresa_nome?: string;
  };
}

export const DadoPlanoCard = ({ cnpjId, cnpjInfo }: DadoPlanoCardProps) => {
  const { dadoPlano, isLoading, error, deleteDadoPlano } = useDadosPlanos({ cnpjId });
  const [modalOpen, setModalOpen] = React.useState(false);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleDelete = () => {
    if (dadoPlano?.id && window.confirm('Tem certeza que deseja excluir os dados do plano?')) {
      deleteDadoPlano.mutate(dadoPlano.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {cnpjInfo.razao_social}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Erro ao carregar dados do plano. Tente novamente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-2">
            <CardTitle className="text-lg">
              {cnpjInfo.razao_social}
            </CardTitle>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                CNPJ: {cnpjInfo.cnpj}
              </p>
              {cnpjInfo.empresa_nome && (
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {cnpjInfo.empresa_nome}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {dadoPlano ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteDadoPlano.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Configurar Plano
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {dadoPlano ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Seguradora:</span>
                <Badge variant="secondary">{dadoPlano.seguradora}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Valor Mensal:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(dadoPlano.valor_mensal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cobertura Morte:</span>
                    <span className="font-medium">
                      {formatCurrency(dadoPlano.cobertura_morte)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Morte Acidental:</span>
                    <span className="font-medium">
                      {formatCurrency(dadoPlano.cobertura_morte_acidental)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Invalidez Acidente:</span>
                    <span className="font-medium">
                      {formatCurrency(dadoPlano.cobertura_invalidez_acidente)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auxílio Funeral:</span>
                    <span className="font-medium">
                      {formatCurrency(dadoPlano.cobertura_auxilio_funeral)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum plano configurado para este CNPJ</p>
              <p className="text-sm mt-2">
                Clique em "Configurar Plano" para definir os dados do plano de seguro
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DadoPlanoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        cnpjId={cnpjId}
        dadoPlano={dadoPlano || undefined}
      />
    </>
  );
};
