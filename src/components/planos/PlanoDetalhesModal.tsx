
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertCircle, Users } from 'lucide-react';
import { InformacoesGeraisTab } from './InformacoesGeraisTab';
import { CoberturasTab } from './CoberturasTab';
import { FuncionariosTab } from './FuncionariosTab';

interface PlanoDetalhesModalProps {
  planoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlanoDetalhesModal: React.FC<PlanoDetalhesModalProps> = ({ 
  planoId, 
  open, 
  onOpenChange 
}) => {
  const { data: plano, isLoading, error } = usePlanoDetalhes(planoId!);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <DashboardLoadingState />
          </div>
        )}

        {error && (
          <div className="py-12">
            <EmptyState
              icon={AlertCircle}
              title="Erro ao carregar plano"
              description="Não foi possível carregar os detalhes do plano. Tente novamente."
            />
          </div>
        )}

        {plano && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                Detalhes do Plano - {plano.seguradora}
              </DialogTitle>
              <p className="text-muted-foreground">
                {plano.empresa_nome} • {plano.cnpj_razao_social}
              </p>
            </DialogHeader>

            <Tabs defaultValue="funcionarios" className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="funcionarios" className="text-sm font-medium">
                  Funcionários
                </TabsTrigger>
                <TabsTrigger value="info" className="text-sm font-medium">
                  Informações Gerais
                </TabsTrigger>
                <TabsTrigger value="coberturas" className="text-sm font-medium">
                  Coberturas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="funcionarios" className="space-y-4">
                <FuncionariosTab plano={plano} />
              </TabsContent>

              <TabsContent value="info" className="space-y-4">
                <InformacoesGeraisTab plano={plano} />
              </TabsContent>

              <TabsContent value="coberturas" className="space-y-4">
                <CoberturasTab plano={plano} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
