import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useDependentes, Dependente } from '@/hooks/useDependentes';
import { DocumentoUploadRow } from './DocumentoUploadRow';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DependenteCardProps {
  dependente: Dependente;
  funcionarioId: string;
  readOnly?: boolean;
}

const TIPOS_DOCUMENTO_DEPENDENTE = {
  saude: [
    { tipo: 'declaracao_saude', label: 'Declaração de Saúde', descricao: 'Formulário de declaração de saúde do dependente' },
    { tipo: 'rg_cpf', label: 'RG/CPF ou CNH', descricao: 'Documento de identificação do dependente' },
  ],
  vida: [
    { tipo: 'rg_cnh_cpf', label: 'RG/CNH CPF', descricao: 'Documentos de identificação do dependente' },
  ],
};

export const DependenteCard: React.FC<DependenteCardProps> = ({ dependente, funcionarioId, readOnly = false }) => {
  const { deleteDependente } = useDependentes(funcionarioId);
  const [showDocumentos, setShowDocumentos] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja remover o dependente ${dependente.nome}?`)) {
      await deleteDependente.mutateAsync(dependente.id);
    }
  };

  const idade = Math.floor(
    (new Date().getTime() - new Date(dependente.data_nascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            {dependente.nome}
          </CardTitle>
          {!readOnly && (
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{idade} anos</span>
          </div>
          <Badge variant="outline">{dependente.parentesco}</Badge>
        </div>

        <Collapsible open={showDocumentos} onOpenChange={setShowDocumentos}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <FileText className="h-4 w-4" />
              {showDocumentos ? 'Ocultar' : (readOnly ? 'Ver' : 'Anexar')} Documentos
              {showDocumentos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Documentos de Saúde</div>
            {TIPOS_DOCUMENTO_DEPENDENTE.saude.map((doc) => (
              <DocumentoUploadRow
                key={doc.tipo}
                tipoDocumento={doc.tipo}
                label={doc.label}
                descricao={doc.descricao}
                funcionarioId={funcionarioId}
                dependenteId={dependente.id}
                readOnly={readOnly}
              />
            ))}
            <div className="text-xs font-semibold text-muted-foreground mb-2 mt-4">Documentos de Vida</div>
            {TIPOS_DOCUMENTO_DEPENDENTE.vida.map((doc) => (
              <DocumentoUploadRow
                key={doc.tipo}
                tipoDocumento={doc.tipo}
                label={doc.label}
                descricao={doc.descricao}
                funcionarioId={funcionarioId}
                dependenteId={dependente.id}
                readOnly={readOnly}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
