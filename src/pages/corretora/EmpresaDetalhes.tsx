import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, FileText, Phone, Mail, User, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEmpresa } from '@/hooks/useEmpresa';
import { useEmpresaCache } from '@/hooks/useEmpresaCache';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useCnpjs } from '@/hooks/useCnpjs';
import { useAuth } from '@/hooks/useAuth';
import { FuncionariosTable } from '@/components/funcionarios/FuncionariosTable';
import CnpjsTable from '@/components/cnpjs/CnpjsTable';
import CnpjModal from '@/components/cnpjs/CnpjModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { AdicionarFuncionarioModal } from '@/components/empresa/AdicionarFuncionarioModal';
import { BulkImportModal } from '@/components/import/BulkImportModal';
import { Upload, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useExportData, ExportField } from '@/hooks/useExportData';
import { ExportModal } from '@/components/ui/export-modal';

type Cnpj = Database['public']['Tables']['cnpjs']['Row'];

const EmpresaDetalhes = () => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filtroStatus = searchParams.get('filtroStatus');
  
  // Checagem de sanidade obrigatória LOGO NO INÍCIO
  if (!empresaId) {
    console.error("❌ FATAL: empresaId não encontrado nos parâmetros da URL. Verifique a rota em App.tsx.");
    return (
      <div className="container mx-auto p-8">
        <EmptyState 
          icon={AlertCircle}
          title="ID da Empresa Não Encontrado"
          description="O ID da empresa não foi encontrado na URL. Verifique se o endereço está correto."
          action={{
            label: "Voltar às Empresas",
            onClick: () => navigate('/corretora/empresas')
          }}
        />
      </div>
    );
  }

  console.log(`✅ [EmpresaDetalhes] empresaId capturado com sucesso: ${empresaId}`);
  
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
  const [funcionarioModalOpen, setFuncionarioModalOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCnpjForImport, setSelectedCnpjForImport] = useState<string>('');

  const { clearEmpresaCache, refreshEmpresa } = useEmpresaCache();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const {
    openExportPreview,
    isPreviewOpen,
    setIsPreviewOpen,
    exportOptions,
    updateExportOptions,
    toggleField,
    selectAllFields,
    deselectAllFields,
    executeExport,
    isExporting,
    formatCurrency,
    formatCPF,
    formatDate
  } = useExportData();

  // Atualizar o filtro quando o parâmetro da URL mudar
  useEffect(() => {
    if (filtroStatus) {
      setStatusFilter(filtroStatus);
    }
  }, [filtroStatus]);

  const { data: empresa, isLoading: isLoadingEmpresa, error: erroEmpresa } = useEmpresa(empresaId);
  
  // Debug logs para monitorar estados - com informações mais detalhadas
  useEffect(() => {
    console.log('🔍 [EmpresaDetalhes] Estados atuais (DETALHADO):', {
      empresaId,
      empresaIdType: typeof empresaId,
      isLoadingEmpresa,
      hasEmpresa: !!empresa,
      empresaNome: empresa?.nome,
      empresaData: empresa,
      hasError: !!erroEmpresa,
      errorMessage: erroEmpresa?.message,
      urlParams: window.location.pathname
    });
  }, [empresaId, isLoadingEmpresa, empresa, erroEmpresa]);

  const { 
    funcionarios, 
    totalCount: totalFuncionarios, 
    totalPages, 
    isLoading: isLoadingFuncionarios 
  } = useFuncionarios({
    empresaId: empresaId,
    search,
    page: pagination.pageIndex,
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

  const handleOpenImport = () => {
    // Se só tem 1 CNPJ, já seleciona automaticamente
    if (cnpjs && cnpjs.length === 1) {
      setSelectedCnpjForImport(cnpjs[0].id);
      setShowImportModal(true);
    } else if (cnpjs && cnpjs.length > 1) {
      // Mostra modal de seleção de CNPJ
      setShowImportModal(true);
    } else {
      // Sem CNPJs cadastrados
      alert('Não há CNPJs cadastrados para esta empresa. Adicione um CNPJ antes de importar funcionários.');
    }
  };

  const handleCnpjSelected = (cnpjId: string) => {
    setSelectedCnpjForImport(cnpjId);
  };

  const handleCloseImport = () => {
    setShowImportModal(false);
    setSelectedCnpjForImport('');
    // Invalidar queries para atualizar a lista
    queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
    queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa'] });
  };

  const exportFields: ExportField[] = [
    { key: 'nome', label: 'Nome do Funcionário', selected: true },
    { key: 'cpf', label: 'CPF', selected: true, format: formatCPF },
    { key: 'cargo', label: 'Cargo', selected: true },
    { key: 'salario', label: 'Salário', selected: true, format: formatCurrency },
    { key: 'status', label: 'Status', selected: true },
    { key: 'data_contratacao', label: 'Data de Contratação', selected: true, format: formatDate },
    { key: 'cnpj_razao_social', label: 'CNPJ (Razão Social)', selected: true },
    { key: 'cnpj_numero', label: 'Número do CNPJ', selected: true }
  ];

  const handleExportFuncionarios = () => {
    if (!funcionarios || funcionarios.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Não há funcionários para exportar.',
        variant: 'destructive'
      });
      return;
    }

    const dataParaExportar = funcionarios.map(func => ({
      ...func,
      cnpj_razao_social: func.cnpj?.razao_social || 'N/A',
      cnpj_numero: func.cnpj?.cnpj || 'N/A'
    }));

    let nomeArquivo = `funcionarios_${empresa?.nome || 'empresa'}`;
    if (statusFilter !== 'all') nomeArquivo += `_${statusFilter}`;
    if (search) nomeArquivo += '_filtrado';
    nomeArquivo = nomeArquivo.replace(/\s+/g, '_').toLowerCase();

    openExportPreview(dataParaExportar, exportFields, nomeArquivo);
  };

  const handleForceRefresh = async () => {
    if (empresaId) {
      console.log('🔄 [EmpresaDetalhes] Forçando refresh manual para empresa:', empresaId);
      clearEmpresaCache(empresaId);
      await refreshEmpresa(empresaId);
    }
  };

  // ESTADO 1: CARREGANDO (apenas se realmente não temos dados)
  if (isLoadingEmpresa && !empresa) {
    console.log('📊 [EmpresaDetalhes] Renderizando loading state para empresa:', empresaId);
    return <DashboardLoadingState />;
  }

  if (empresa && empresa.id && empresa.nome) {
    console.log('✅ [EmpresaDetalhes] Renderizando com dados válidos:', empresa.nome, 'ID:', empresa.id);
    
    return (
      <div className="space-y-6">
        {/* Header da Empresa com botão de refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{empresa.nome}</h1>
            <p className="text-muted-foreground">
              Gestão completa da empresa e seus funcionários
            </p>
          </div>
          <Button variant="outline" onClick={handleForceRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Funcionários da Empresa</CardTitle>
                    <CardDescription>
                      Gerencie os funcionários desta empresa
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleOpenImport}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleExportFuncionarios}
                      disabled={!funcionarios || funcionarios.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                    <Button onClick={() => setFuncionarioModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Funcionário
                    </Button>
                  </div>
                </div>
                
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

        {/* Modal para adicionar funcionário */}
        <AdicionarFuncionarioModal
          open={funcionarioModalOpen}
          onOpenChange={setFuncionarioModalOpen}
          empresaId={empresaId}
          planoSeguradora=""
          onFuncionarioAdded={() => {
            setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
          }}
        />

      {/* Modais de Importação em Massa */}
      {cnpjs && cnpjs.length > 0 && (
        <>
          {/* Modal de Seleção de CNPJ (se múltiplos CNPJs) */}
          {showImportModal && !selectedCnpjForImport && cnpjs.length > 1 && (
            <Dialog open={showImportModal} onOpenChange={(open) => {
              if (!open) {
                setShowImportModal(false);
              }
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Selecione o CNPJ para Importação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Escolha o CNPJ onde os funcionários serão importados:
                  </p>
                  <Select onValueChange={handleCnpjSelected}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um CNPJ" />
                    </SelectTrigger>
                    <SelectContent>
                      {cnpjs.map((cnpj) => (
                        <SelectItem key={cnpj.id} value={cnpj.id}>
                          {cnpj.razao_social} ({cnpj.cnpj})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Modal de Importação (quando CNPJ já está selecionado) */}
          {selectedCnpjForImport && (
            <BulkImportModal
              isOpen={showImportModal}
              onClose={handleCloseImport}
              cnpjId={selectedCnpjForImport}
              plano={{
                id: 'corretora-import',
                seguradora: cnpjs.find(c => c.id === selectedCnpjForImport)?.razao_social || 'Empresa',
                valor_mensal: 0
              }}
            />
          )}
        </>
      )}

      {/* Modal de Exportação */}
      <ExportModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        exportOptions={exportOptions}
        onUpdateOptions={updateExportOptions}
        onToggleField={toggleField}
        onSelectAll={selectAllFields}
        onDeselectAll={deselectAllFields}
        onExecuteExport={executeExport}
        isExporting={isExporting}
        dataCount={funcionarios?.length || 0}
      />
    </div>
  );
}

  // ESTADO 3: ERRO APENAS SE REALMENTE NÃO TEMOS DADOS
  if (erroEmpresa && !empresa) {
    console.error("❌ [EmpresaDetalhes] Erro ao buscar dados da empresa:", erroEmpresa, 'ID:', empresaId);
    
    const isPermissionError = erroEmpresa.message?.includes('Row Level Security') || 
                             erroEmpresa.message?.includes('permission');
    
    const isNotFoundError = erroEmpresa.message?.includes('não encontrada');
    
    return (
      <div className="container mx-auto p-8">
        <EmptyState 
          icon={AlertCircle}
          title={isPermissionError ? "Sem Permissão" : "Empresa Não Encontrada"}
          description={
            isPermissionError 
              ? "Você não tem permissão para acessar esta empresa. Verifique se o ID está correto e se você tem as permissões necessárias."
              : "O ID da empresa na URL é inválido, a empresa foi excluída ou não existe no sistema."
          }
          action={{
            label: "Tentar Novamente",
            onClick: handleForceRefresh
          }}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={handleForceRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Recarregar Dados
          </Button>
        </div>
      </div>
    );
  }

  // ESTADO 4: FALLBACK FINAL - dados indefinidos (não deveria mais acontecer)
  console.warn('⚠️ [EmpresaDetalhes] Estado indefinido - dados válidos mas não renderizados. ID:', empresaId);
  
  return (
    <div className="container mx-auto p-8">
      <EmptyState 
        icon={AlertCircle}
        title="Carregando Dados"
        description={`Os dados da empresa (ID: ${empresaId}) estão sendo carregados. Aguarde um momento...`}
        action={{
          label: "Recarregar",
          onClick: handleForceRefresh
        }}
      />
    </div>
  );
};

export default EmpresaDetalhes;
