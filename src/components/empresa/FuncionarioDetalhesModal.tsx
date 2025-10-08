
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, Briefcase, Calendar, DollarSign, Shield, Building2, CreditCard, Clock, Plus, Heart, Activity } from 'lucide-react';
import { useDependentes } from '@/hooks/useDependentes';
import { DocumentoUploadRow } from './DocumentoUploadRow';
import { DependenteCard } from './DependenteCard';
import { AdicionarDependenteModal } from './AdicionarDependenteModal';

interface FuncionarioDetalhesModalProps {
  funcionario: {
    id: string;
    nome: string;
    cpf: string;
    cargo: string;
    salario: number;
    idade: number;
    status: string;
    created_at: string;
    cnpj_razao_social?: string;
    cnpj_numero?: string;
    plano_seguradora?: string;
    plano_valor_mensal?: number;
    plano_cobertura_morte?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FuncionarioDetalhesModal: React.FC<FuncionarioDetalhesModalProps> = ({
  funcionario,
  open,
  onOpenChange,
}) => {
  const [showAddDependente, setShowAddDependente] = useState(false);
  const { dependentes, isLoading: loadingDependentes } = useDependentes(funcionario?.id || null);

  if (!funcionario) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'desativado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const isExclusaoSolicitada = funcionario.status === 'exclusao_solicitada';

  const DOCUMENTOS_SAUDE = isExclusaoSolicitada
    ? [
        { tipo: 'formulario_exclusao', label: 'Formulário de Exclusão', descricao: 'Formulário solicitando exclusão do plano de saúde' },
        { tipo: 'termo_rescisao', label: 'Termo de Rescisão', descricao: 'Documento de rescisão do contrato' },
      ]
    : [
        { tipo: 'declaracao_saude', label: 'Declaração de Saúde', descricao: 'Formulário de declaração de saúde preenchido' },
        { tipo: 'rg_cpf_cnh', label: 'Cópia do RG/CPF ou CNH', descricao: 'Documento de identificação com foto' },
      ];

  const DOCUMENTOS_VIDA = isExclusaoSolicitada
    ? [{ tipo: 'termo_rescisao', label: 'Termo de Rescisão', descricao: 'Documento de rescisão do contrato' }]
    : [
        { tipo: 'rg_cnh_cpf', label: 'RG/CNH CPF', descricao: 'Documentos de identificação' },
        { tipo: 'ficha_cadastral', label: 'Ficha Cadastral ou Contrato de Experiência', descricao: 'Documento trabalhista comprobatório' },
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-full">
              <User className="h-5 w-5" />
            </div>
            {funcionario.nome}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(funcionario.status)}>
              {funcionario.status.charAt(0).toUpperCase() + funcionario.status.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{funcionario.cargo}</span>
          </div>
        </DialogHeader>

        <Tabs defaultValue="saude" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saude" className="gap-2">
              <Heart className="h-4 w-4" />
              Planos de Saúde
            </TabsTrigger>
            <TabsTrigger value="vida" className="gap-2">
              <Activity className="h-4 w-4" />
              Seguros de Vida
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saude" className="space-y-6">
            {/* Seção de Documentos de Saúde */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documentos Necessários</CardTitle>
              </CardHeader>
              <CardContent>
                {DOCUMENTOS_SAUDE.map((doc) => (
                  <DocumentoUploadRow
                    key={doc.tipo}
                    tipoDocumento={doc.tipo}
                    label={doc.label}
                    descricao={doc.descricao}
                    funcionarioId={funcionario.id}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Seção de Dependentes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Dependentes</CardTitle>
                  <Button size="sm" onClick={() => setShowAddDependente(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Dependente
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingDependentes && <p className="text-sm text-muted-foreground">Carregando...</p>}
                {!loadingDependentes && dependentes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum dependente cadastrado</p>
                )}
                {dependentes.map((dependente) => (
                  <DependenteCard key={dependente.id} dependente={dependente} funcionarioId={funcionario.id} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vida" className="space-y-6">
            {/* Seção de Documentos de Vida */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documentos Necessários</CardTitle>
              </CardHeader>
              <CardContent>
                {DOCUMENTOS_VIDA.map((doc) => (
                  <DocumentoUploadRow
                    key={doc.tipo}
                    tipoDocumento={doc.tipo}
                    label={doc.label}
                    descricao={doc.descricao}
                    funcionarioId={funcionario.id}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Seção de Dependentes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Dependentes</CardTitle>
                  <Button size="sm" onClick={() => setShowAddDependente(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Dependente
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingDependentes && <p className="text-sm text-muted-foreground">Carregando...</p>}
                {!loadingDependentes && dependentes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum dependente cadastrado</p>
                )}
                {dependentes.map((dependente) => (
                  <DependenteCard key={dependente.id} dependente={dependente} funcionarioId={funcionario.id} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AdicionarDependenteModal
          open={showAddDependente}
          onOpenChange={setShowAddDependente}
          funcionarioId={funcionario.id}
        />
      </DialogContent>
    </Dialog>
  );
};
