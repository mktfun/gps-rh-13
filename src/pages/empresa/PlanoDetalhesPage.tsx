import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlusIcon, PencilIcon, TrashIcon, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { usePlano } from '@/hooks/usePlano';
import { useFuncionariosForaDoPlano } from '@/hooks/useFuncionariosForaDoPlano';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { DataTable } from '@/components/ui/data-table';
import { PlanoFuncionariosColunas } from '@/components/planos/PlanoFuncionariosColunas';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDeletarPlano } from '@/hooks/useDeletarPlano';
import { Skeleton } from '@/components/ui/skeleton';
import { EditarPlanoModal } from '@/components/planos/EditarPlanoModal';
import AdicionarFuncionariosModal from '@/components/planos/AdicionarFuncionariosModal';

interface PlanoDetalhesPageProps {
  planoId: string;
}

export default function PlanoDetalhesPage({ planoId }: PlanoDetalhesPageProps) {
  const navigate = useNavigate();
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isAdicionarFuncionariosModalOpen, setIsAdicionarFuncionariosModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const { data: plano, isLoading: isLoadingPlano, refetch: refetchPlano } = usePlano(planoId);
  const { data: funcionariosForaDoPlano, isLoading: isLoadingFuncionariosForaDoPlano, refetch: refetchFuncionariosForaDoPlano } = useFuncionariosForaDoPlano(planoId);
  const { data: planoFuncionarios, isLoading: isLoadingPlanoFuncionarios, refetch: refetchPlanoFuncionarios } = usePlanoFuncionarios(planoId);
  const { mutateAsync: deletarPlano, isLoading: isDeletingPlano } = useDeletarPlano();

  useEffect(() => {
    if (!planoId) {
      toast.error('ID do plano não fornecido.');
      return;
    }
    refetchPlano();
    refetchFuncionariosForaDoPlano();
    refetchPlanoFuncionarios();
  }, [planoId, refetchPlano, refetchFuncionariosForaDoPlano, refetchPlanoFuncionarios]);

  const handleEditarPlano = () => {
    setIsEditarModalOpen(true);
  };

  const handleAdicionarFuncionarios = () => {
    setIsAdicionarFuncionariosModalOpen(true);
  };

  const handleExcluirPlano = async () => {
    try {
      await deletarPlano(planoId);
      toast.success('Plano excluído com sucesso!');
      router.push('/empresa/planos');
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast.error('Erro ao excluir plano.');
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  if (isLoadingPlano) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-64 mb-2" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-96" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plano) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardContent>
            <p>Plano não encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{plano.nome}</CardTitle>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleEditarPlano}>
              <PencilIcon className="mr-2 h-4 w-4" />
              Editar Plano
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeletingPlano}>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Excluir Plano
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá excluir o plano permanentemente. Tem certeza que deseja prosseguir?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <Button variant="destructive" disabled={isDeletingPlano} onClick={handleExcluirPlano}>
                    {isDeletingPlano ? 'Excluindo...' : 'Excluir'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold">Informações do Plano</h2>
              <p><strong>Nome:</strong> {plano.nome}</p>
              <p><strong>Descrição:</strong> {plano.descricao}</p>
              <p><strong>Valor Mensal:</strong> R$ {plano.valor_mensal}</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Funcionários no Plano</h2>
              <Button variant="outline" onClick={handleAdicionarFuncionarios}>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Funcionários
              </Button>
            </div>
            <DataTable columns={PlanoFuncionariosColunas} data={planoFuncionarios || []} isLoading={isLoadingPlanoFuncionarios} />
          </div>
        </CardContent>
      </Card>
      <EditarPlanoModal
        isOpen={isEditarModalOpen}
        onClose={() => setIsEditarModalOpen(false)}
        plano={plano}
        onPlanoUpdated={() => {
          refetchPlano();
          toast.success('Plano atualizado com sucesso!');
        }}
      />
      <AdicionarFuncionariosModal
        isOpen={isAdicionarFuncionariosModalOpen}
        onClose={() => setIsAdicionarFuncionariosModalOpen(false)}
        planoId={planoId}
        onFuncionariosAdicionados={() => {
          refetchPlanoFuncionarios();
          refetchFuncionariosForaDoPlano();
          toast.success('Funcionários adicionados ao plano com sucesso!');
        }}
      />
    </div>
  );
}
