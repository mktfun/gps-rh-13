
import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useEmpresas, type EmpresaComMetricas } from '@/hooks/useEmpresas';
import { EmpresasTable } from '@/components/empresas/EmpresasTable';
import EmpresaModal from '@/components/empresas/EmpresaModal';
import { useAuth } from '@/hooks/useAuth';

const Empresas = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaComMetricas | null>(null);

  const pageSize = 10;

  const {
    empresas,
    totalCount,
    totalPages,
    isLoading,
    addEmpresa,
    updateEmpresa,
    deleteEmpresa
  } = useEmpresas({
    page: currentPage,
    pageSize,
    search,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleAddEmpresa = () => {
    setEditingEmpresa(null);
    setIsModalOpen(true);
  };

  const handleEditEmpresa = (empresa: EmpresaComMetricas) => {
    setEditingEmpresa(empresa);
    setIsModalOpen(true);
  };

  const handleDeleteEmpresa = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta empresa?')) {
      deleteEmpresa.mutate(id);
    }
  };

  const handleSaveEmpresa = (data: any) => {
    if (editingEmpresa) {
      updateEmpresa.mutate(
        { id: editingEmpresa.id, ...data },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingEmpresa(null);
          }
        }
      );
    } else {
      addEmpresa.mutate(
        {
          ...data,
          corretora_id: user?.id || '',
          primeiro_acesso: true
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          }
        }
      );
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie as empresas clientes da sua corretora
          </p>
        </div>
        <Button onClick={handleAddEmpresa}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Empresa
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empresas..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Resumo */}
      {!isLoading && (
        <div className="text-sm text-muted-foreground">
          {totalCount > 0 && (
            <>
              Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalCount)} a{' '}
              {Math.min(currentPage * pageSize, totalCount)} de {totalCount} empresas
            </>
          )}
        </div>
      )}

      {/* Tabela */}
      <EmpresasTable 
        empresas={empresas}
        isLoading={isLoading}
        onEdit={handleEditEmpresa}
        onDelete={handleDeleteEmpresa}
      />

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modal */}
      <EmpresaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmpresa(null);
        }}
        empresa={editingEmpresa}
        onSave={handleSaveEmpresa}
        isLoading={addEmpresa.isPending || updateEmpresa.isPending}
      />
    </div>
  );
};

export default Empresas;
