
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PlanoCard } from '@/components/dados-planos/PlanoCard';
import { PlanoFormModal } from '@/components/dados-planos/PlanoFormModal';
import { useDadosPlanosCards } from '@/hooks/useDadosPlanosCards';
import { toast } from 'sonner';

interface PlanoCardData {
  id: string;
  empresa_nome: string;
  cnpj_razao_social: string;
  cnpj_numero: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  total_funcionarios: number;
  empresa_id: string;
  cnpj_id: string;
}

interface EmpresaGroup {
  empresa_id: string;
  empresa_nome: string;
  planos: PlanoCardData[];
  total_planos: number;
  custo_total: number;
}

const DadosPlanos = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [planoParaEditar, setPlanoParaEditar] = useState<PlanoCardData | null>(null);
  const [empresasExpanded, setEmpresasExpanded] = useState<Record<string, boolean>>({});
  
  const { planos, isLoading } = useDadosPlanosCards({ search });

  const handleEditPlano = (plano: PlanoCardData) => {
    console.log(`📝 Abrindo modal para editar plano: ${plano.id}`);
    setPlanoParaEditar(plano);
    setModalOpen(true);
  };

  const handleViewFuncionarios = (empresaId: string, cnpjId: string) => {
    console.log(`📋 Navegando para empresa: ${empresaId} com CNPJ: ${cnpjId}`);
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(empresaId) && uuidRegex.test(cnpjId)) {
      navigate(`/corretora/empresas/${empresaId}?cnpjId=${cnpjId}`);
    } else {
      console.error('IDs inválidos:', { empresaId, cnpjId });
      toast.error('IDs não encontrados. Verifique os dados do plano.');
    }
  };

  const handleAddPlano = () => {
    console.log('➕ Abrindo modal para criar novo plano');
    setPlanoParaEditar(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPlanoParaEditar(null);
  };

  const toggleEmpresa = (empresaId: string) => {
    setEmpresasExpanded(prev => ({
      ...prev,
      [empresaId]: !prev[empresaId]
    }));
  };

  // Agrupar planos por empresa
  const planosArray = Array.isArray(planos) ? planos : [];
  const empresasGrouped: EmpresaGroup[] = planosArray.reduce((acc, plano) => {
    const existingEmpresa = acc.find(e => e.empresa_id === plano.empresa_id);
    
    if (existingEmpresa) {
      existingEmpresa.planos.push(plano);
      existingEmpresa.total_planos += 1;
      existingEmpresa.custo_total += plano.valor_mensal;
    } else {
      acc.push({
        empresa_id: plano.empresa_id,
        empresa_nome: plano.empresa_nome,
        planos: [plano],
        total_planos: 1,
        custo_total: plano.valor_mensal
      });
    }
    
    return acc;
  }, [] as EmpresaGroup[]);

  // Expandir todas as empresas por padrão se houver poucas
  React.useEffect(() => {
    if (empresasGrouped.length <= 3) {
      const initialExpanded = empresasGrouped.reduce((acc, empresa) => {
        acc[empresa.empresa_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setEmpresasExpanded(initialExpanded);
    }
  }, [empresasGrouped.length]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  console.log('Planos agrupados:', empresasGrouped);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dados dos Planos</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de seguro das suas empresas
          </p>
        </div>
        <Button onClick={handleAddPlano}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa, CNPJ ou seguradora..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Planos Agrupados por Empresa */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {empresasGrouped.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Nenhum plano encontrado
              </p>
              <p className="text-sm text-muted-foreground">
                {search ? 'Tente ajustar os filtros de busca' : 'Comece criando seu primeiro plano'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {empresasGrouped.map((empresa) => (
                <Card key={empresa.empresa_id}>
                  <Collapsible
                    open={empresasExpanded[empresa.empresa_id] || false}
                    onOpenChange={() => toggleEmpresa(empresa.empresa_id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {empresasExpanded[empresa.empresa_id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <CardTitle className="text-xl">{empresa.empresa_nome}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {empresa.total_planos} plano{empresa.total_planos > 1 ? 's' : ''}
                              </Badge>
                              <Badge variant="outline">
                                {formatCurrency(empresa.custo_total)}/mês
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {empresa.planos.map((plano) => (
                            <PlanoCard
                              key={plano.id}
                              plano={plano}
                              onEdit={handleEditPlano}
                              onViewFuncionarios={handleViewFuncionarios}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Formulário */}
      <PlanoFormModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        plano={planoParaEditar}
      />
    </div>
  );
};

export default DadosPlanos;
