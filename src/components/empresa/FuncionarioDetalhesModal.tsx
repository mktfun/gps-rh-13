
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
import { User, Briefcase, Calendar, DollarSign, Shield, Building2, CreditCard, Clock, Plus, Heart, Activity, Mail, HeartHandshake, CalendarPlus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useDependentes } from '@/hooks/useDependentes';
import { useFuncionarioDetalhes } from '@/hooks/useFuncionarioDetalhes';
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
    updated_at?: string;
    email?: string;
    estado_civil?: string;
    data_admissao?: string;
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
  
  // Buscar dados completos do funcionário com CNPJ
  const { data: funcionarioDetalhado, isLoading: loadingDetalhes } = useFuncionarioDetalhes(funcionario?.id || null);
  const { dependentes, isLoading: loadingDependentes } = useDependentes(funcionario?.id || null);

  if (!funcionario) return null;

  // Usar dados detalhados se disponíveis, caso contrário usar os dados básicos
  const dadosFuncionario = funcionarioDetalhado || funcionario;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return 'Data inválida';
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return 'Data inválida';
    }
  };

  const formatCnpj = (cnpj?: string) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatEstadoCivil = (estadoCivil?: string) => {
    if (!estadoCivil) return 'Não informado';
    const estados: Record<string, string> = {
      'solteiro': 'Solteiro(a)',
      'casado': 'Casado(a)',
      'divorciado': 'Divorciado(a)',
      'viuvo': 'Viúvo(a)',
      'separado': 'Separado(a)',
    };
    return estados[estadoCivil] || estadoCivil;
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

  const isExclusaoSolicitada = dadosFuncionario.status === 'exclusao_solicitada';

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
            {dadosFuncionario.nome}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(dadosFuncionario.status)}>
              {dadosFuncionario.status.charAt(0).toUpperCase() + dadosFuncionario.status.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{dadosFuncionario.cargo}</span>
          </div>
        </DialogHeader>

        {/* Seção: Detalhes de Cadastro e Vínculo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes de Cadastro e Vínculo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="text-sm font-medium">{dadosFuncionario.email || 'Não informado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                <HeartHandshake className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Estado Civil</p>
                <p className="text-sm font-medium">{formatEstadoCivil(dadosFuncionario.estado_civil)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">CNPJ Vinculado</p>
                <p className="text-sm font-medium">
                  {loadingDetalhes ? 'Carregando...' : (dadosFuncionario.cnpj_razao_social || 'Não informado')}
                  {dadosFuncionario.cnpj_numero && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({formatCnpj(dadosFuncionario.cnpj_numero)})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                <CalendarPlus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Data de Admissão</p>
                <p className="text-sm font-medium">
                  {formatDate(dadosFuncionario.data_admissao || dadosFuncionario.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Última Atualização</p>
                <p className="text-sm font-medium">{formatDateTime(dadosFuncionario.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
