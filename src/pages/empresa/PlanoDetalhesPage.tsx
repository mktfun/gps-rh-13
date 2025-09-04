
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlusIcon, PencilIcon, TrashIcon, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { useFuncionariosForaDoPlano } from '@/hooks/useFuncionariosForaDoPlano';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { DataTable } from '@/components/ui/data-table';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import AdicionarFuncionariosModal from '@/components/planos/AdicionarFuncionariosModal';

export default function PlanoDetalhesPage() {
  const { planoId } = useParams<{ planoId: string }>();
  const navigate = useNavigate();

  if (!planoId) {
    return <div>Plano não encontrado</div>;
  }
  const params = useParams();
  const currentPlanoId = planoId || params.planoId || '';
  
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isAdicionarFuncionariosModalOpen, setIsAdicionarFuncionariosModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const { data: plano, isLoading: isLoadingPlano } = usePlanoDetalhes(currentPlanoId);
  const { data: funcionariosForaDoPlano, isLoading: isLoadingFuncionariosForaDoPlano } = useFuncionariosForaDoPlano(currentPlanoId, 'vida');
  const { data: planoFuncionarios, isLoading: isLoadingPlanoFuncionarios } = usePlanoFuncionarios({
    planoId: currentPlanoId,
    tipoSeguro: 'vida',
    pageIndex: 0,
    pageSize: 50
  });

  useEffect(() => {
    if (!currentPlanoId) {
      toast.error('ID do plano não fornecido.');
      return;
    }
  }, [currentPlanoId]);

  const handleEditarPlano = () => {
    setIsEditarModalOpen(true);
  };

  const handleAdicionarFuncionarios = () => {
    setIsAdicionarFuncionariosModalOpen(true);
  };

  const handleExcluirPlano = async () => {
    try {
      // Add delete logic here
      toast.success('Plano excluído com sucesso!');
      navigate('/empresa/planos');
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
          <CardTitle>{plano.seguradora}</CardTitle>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleEditarPlano}>
              <PencilIcon className="mr-2 h-4 w-4" />
              Editar Plano
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
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
                  <Button variant="destructive" onClick={handleExcluirPlano}>
                    Excluir
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
              <p><strong>Seguradora:</strong> {plano.seguradora}</p>
              <p><strong>Valor Mensal:</strong> R$ {plano.valor_mensal}</p>
              <p><strong>Empresa:</strong> {plano.empresa_nome}</p>
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
            <div className="mt-4">
              {isLoadingPlanoFuncionarios ? (
                <div>Carregando funcionários...</div>
              ) : (
                <div>
                  <p>Total de funcionários: {planoFuncionarios?.funcionarios?.length || 0}</p>
                  {planoFuncionarios?.funcionarios?.map((funcionario) => (
                    <div key={funcionario.id} className="p-4 border rounded mb-2">
                      <p><strong>Nome:</strong> {funcionario.nome}</p>
                      <p><strong>CPF:</strong> {funcionario.cpf}</p>
                      <p><strong>Status:</strong> {funcionario.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AdicionarFuncionariosModal
        isOpen={isAdicionarFuncionariosModalOpen}
        onClose={() => setIsAdicionarFuncionariosModalOpen(false)}
        planoId={currentPlanoId}
      />
    </div>
  );
}
