
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, FileText, Phone, Mail, User, Plus } from 'lucide-react';
import { useEmpresa } from '@/hooks/useEmpresa';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useCnpjs } from '@/hooks/useCnpjs';
import { FuncionariosTable } from '@/components/funcionarios/FuncionariosTable';
import CnpjsTable from '@/components/cnpjs/CnpjsTable';
import CnpjModal from '@/components/cnpjs/CnpjModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Cnpj = Database['public']['Tables']['cnpjs']['Row'];

const EmpresaDetalhes = () => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const [searchParams] = useSearchParams();
  const filtroStatus = searchParams.get('filtroStatus');
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(filtroStatus || 'all');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [cnpjPagination, setCnpjPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCnpj, setEditingCnpj] = useState<Cnpj | null>(null);

  // Atualizar o filtro quando o parâmetro da URL mudar
  useEffect(() => {
    if (filtroStatus) {
      setStatusFilter(filtroStatus);
    }
  }, [filtroStatus]);

  const { data: empresa, isLoading: isLoadingEmpresa } = useEmpresa(empresaId!);
  
  const { 
    funcionarios, 
    totalCount: totalFuncionarios, 
    totalPages, 
    isLoading: isLoadingFuncionarios 
  } = useFuncionarios({
    empresaId: empresaId,
    search,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    // Aplicar filtro apenas se não for 'all'
    ...(statusFilter !== 'all' && { statusFilter })
  });

  const { 
    cnpjs, 
    totalCount: totalCnpjs, 
    totalPages: cnpjTotalPages,
    isLoading: isLoadingCnpjs,
    addCnpj,
    updateCnpj,
    deleteCnpj
  } = useCnpjs({ 
    empresaId: empresaId!,
    page: cnpjPagination.pageIndex + 1,
    pageSize: cnpjPagination.pageSize
  });

  const handleAddCnpj = (cnpjData: any) => {
    addCnpj.mutate(cnpjData, {
      onSuccess: () => {
        setIsModalOpen(false);
      }
    });
  };

  const handleEditCnpj = (cnpj: Cnpj) => {
    setEditingCnpj(cnpj);
  };

  const handleUpdateCnpj = (cnpjData: any) => {
    updateCnpj.mutate(cnpjData, {
      onSuccess: () => {
        setEditingCnpj(null);
      }
    });
  };

  const handleDeleteCnpj = (cnpjId: string) => {
    deleteCnpj.mutate(cnpjId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCnpj(null);
  };

  if (isLoadingEmpresa) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Empresa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da Empresa */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{empresa.nome}</h1>
          <p className="text-muted-foreground">
            Gestão completa da empresa e seus funcionários
          </p>
        </div>
      </div>

      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Responsável</p>
                <p className="text-sm text-muted-foreground">{empresa.responsavel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{empresa.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Telefone</p>
                <p className="text-sm text-muted-foreground">{empresa.telefone}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="funcionarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funcionarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Funcionários
            {totalFuncionarios > 0 && (
              <Badge variant="secondary">{totalFuncionarios}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cnpjs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CNPJs
            {totalCnpjs > 0 && (
              <Badge variant="secondary">{totalCnpjs}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funcionarios">
          <Card>
            <CardHeader>
              <CardTitle>Funcionários da Empresa</CardTitle>
              <CardDescription>
                Gerencie os funcionários desta empresa
              </CardDescription>
              
              {/* Filtros */}
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar funcionários..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="exclusao_solicitada">Exclusão Solicitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <FuncionariosTable
                funcionarios={funcionarios}
                isLoading={isLoadingFuncionarios}
                totalCount={totalFuncionarios}
                totalPages={totalPages}
                pagination={pagination}
                setPagination={setPagination}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cnpjs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CNPJs da Empresa</CardTitle>
                  <CardDescription>
                    Gerencie os CNPJs desta empresa
                  </CardDescription>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar CNPJ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CnpjsTable 
                cnpjs={cnpjs || []} 
                isLoading={isLoadingCnpjs}
                totalCount={totalCnpjs}
                totalPages={cnpjTotalPages}
                pagination={cnpjPagination}
                setPagination={setCnpjPagination}
                onEdit={handleEditCnpj}
                onDelete={handleDeleteCnpj}
                onAdd={() => setIsModalOpen(true)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para adicionar/editar CNPJ */}
      <CnpjModal
        isOpen={isModalOpen || !!editingCnpj}
        onClose={handleCloseModal}
        initialData={editingCnpj}
        empresaId={empresaId!}
        onSubmit={editingCnpj ? handleUpdateCnpj : handleAddCnpj}
        isLoading={editingCnpj ? updateCnpj.isPending : addCnpj.isPending}
      />
    </div>
  );
};

export default EmpresaDetalhes;
