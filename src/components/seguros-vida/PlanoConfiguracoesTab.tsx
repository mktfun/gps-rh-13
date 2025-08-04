
import React from 'react';
import { Settings, Shield, AlertTriangle, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface PlanoDetalhes {
  id: string;
  seguradora: string;
  valor_mensal: number;
}

interface PlanoConfiguracoesTabProps {
  plano: PlanoDetalhes;
}

export const PlanoConfiguracoesTab: React.FC<PlanoConfiguracoesTabProps> = ({ plano }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Plano
          </CardTitle>
          <CardDescription>
            Gerencie as configurações avançadas do plano de seguro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configurações Gerais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações Gerais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plano-nome">Nome do Plano</Label>
                <Input 
                  id="plano-nome" 
                  placeholder="Ex: Plano Empresarial Básico"
                  defaultValue={`Plano ${plano.seguradora}`}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plano-codigo">Código do Plano</Label>
                <Input 
                  id="plano-codigo" 
                  placeholder="Ex: PE-001"
                  defaultValue={plano.id.substring(0, 8)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plano-descricao">Descrição</Label>
              <Textarea 
                id="plano-descricao" 
                placeholder="Descreva os detalhes do plano..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Configurações de Notificação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notificações</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificar sobre vencimentos</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações sobre renovações e vencimentos
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas de inadimplência</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações sobre pagamentos em atraso
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Relatórios mensais</Label>
                  <p className="text-sm text-muted-foreground">
                    Envio automático de relatórios mensais
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações de Segurança */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Segurança e Compliance</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auditoria de alterações</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas as alterações no plano
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Backup diário dos dados do plano
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          <Separator />

          {/* Zona de Perigo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </h3>
            
            <div className="border border-destructive/20 rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-destructive">Suspender Plano</Label>
                <p className="text-sm text-muted-foreground">
                  Suspende temporariamente o plano. Funcionários manterão seus dados mas não terão cobertura.
                </p>
                <Button variant="destructive" className="w-full">
                  Suspender Plano
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-destructive">Cancelar Plano</Label>
                <p className="text-sm text-muted-foreground">
                  Cancela permanentemente o plano. Esta ação não pode ser desfeita.
                </p>
                <Button variant="destructive" className="w-full">
                  Cancelar Plano
                </Button>
              </div>
            </div>
          </div>

          {/* Botão de Salvar */}
          <div className="flex justify-end">
            <Button className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
