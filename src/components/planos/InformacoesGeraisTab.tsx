
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Shield, DollarSign, FileText } from 'lucide-react';
import { PlanoDetalhes } from '@/types/planos';

interface InformacoesGeraisTabProps {
  plano: PlanoDetalhes;
}

export const InformacoesGeraisTab: React.FC<InformacoesGeraisTabProps> = ({ plano }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome da Empresa</label>
              <p className="text-sm font-medium">{plano.empresa_nome || plano.cnpj?.empresas?.nome}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{plano.cnpj_numero || plano.cnpj?.cnpj}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Razão Social</label>
              <p className="text-sm font-medium">{plano.cnpj_razao_social || plano.cnpj?.razao_social}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Plano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Detalhes do Plano
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Seguradora</label>
              <Badge variant="secondary" className="text-sm font-medium">
                <Shield className="h-3 w-3 mr-1" />
                {plano.seguradora}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Valor Mensal</label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(plano.valor_mensal)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Por CNPJ</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
