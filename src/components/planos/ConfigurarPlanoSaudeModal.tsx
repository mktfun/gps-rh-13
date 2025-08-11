
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface ConfigurarPlanoSaudeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cnpjId: string;
}

interface PlanoSaudeData {
  seguradora: string;
  nomePlano: string;
  faixasPreco: Record<string, number>;
}

const FAIXAS_ETARIAS = [
  { key: '00-18', label: '00-18 anos', faixa_inicio: 0, faixa_fim: 18 },
  { key: '19-23', label: '19-23 anos', faixa_inicio: 19, faixa_fim: 23 },
  { key: '24-28', label: '24-28 anos', faixa_inicio: 24, faixa_fim: 28 },
  { key: '29-33', label: '29-33 anos', faixa_inicio: 29, faixa_fim: 33 },
  { key: '34-38', label: '34-38 anos', faixa_inicio: 34, faixa_fim: 38 },
  { key: '39-43', label: '39-43 anos', faixa_inicio: 39, faixa_fim: 43 },
  { key: '44-48', label: '44-48 anos', faixa_inicio: 44, faixa_fim: 48 },
  { key: '49-53', label: '49-53 anos', faixa_inicio: 49, faixa_fim: 53 },
  { key: '54-58', label: '54-58 anos', faixa_inicio: 54, faixa_fim: 58 },
  { key: '59+', label: '59+ anos', faixa_inicio: 59, faixa_fim: 999 },
];

export const ConfigurarPlanoSaudeModal: React.FC<ConfigurarPlanoSaudeModalProps> = ({
  open,
  onOpenChange,
  cnpjId
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<PlanoSaudeData>({
    seguradora: '',
    nomePlano: '',
    faixasPreco: {}
  });

  const queryClient = useQueryClient();

  const createPlanoMutation = useMutation({
    mutationFn: async (planoData: PlanoSaudeData) => {
      console.log('🔄 Criando plano de saúde:', planoData);
      
      // 1. Criar o plano na tabela dados_planos
      const { data: planoResponse, error: planoError } = await supabase
        .from('dados_planos')
        .insert({
          cnpj_id: cnpjId,
          seguradora: planoData.seguradora,
          valor_mensal: 0, // Para planos de saúde, o valor é calculado por faixa
          cobertura_morte: 0,
          cobertura_morte_acidental: 0,
          cobertura_invalidez_acidente: 0,
          cobertura_auxilio_funeral: 0,
          tipo_seguro: 'saude'
        })
        .select()
        .single();

      if (planoError) {
        console.error('❌ Erro ao criar plano:', planoError);
        throw planoError;
      }

      console.log('✅ Plano criado:', planoResponse);

      // 2. Criar as faixas de preço
      const faixasToInsert = FAIXAS_ETARIAS
        .filter(faixa => planoData.faixasPreco[faixa.key] && planoData.faixasPreco[faixa.key] > 0)
        .map(faixa => ({
          plano_id: planoResponse.id,
          faixa_inicio: faixa.faixa_inicio,
          faixa_fim: faixa.faixa_fim,
          valor: planoData.faixasPreco[faixa.key]
        }));

      if (faixasToInsert.length > 0) {
        const { error: faixasError } = await supabase
          .from('planos_faixas_de_preco')
          .insert(faixasToInsert);

        if (faixasError) {
          console.error('❌ Erro ao criar faixas de preço:', faixasError);
          throw faixasError;
        }

        console.log('✅ Faixas de preço criadas:', faixasToInsert.length);
      }

      return planoResponse;
    },
    onSuccess: () => {
      toast.success('Plano de saúde configurado com sucesso!');
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['plano-detalhes-cnpj-saude', cnpjId] });
      queryClient.invalidateQueries({ queryKey: ['dados-planos-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cnpjs-com-planos'] });
      
      // Fechar modal e resetar
      onOpenChange(false);
      setCurrentStep(1);
      setData({
        seguradora: '',
        nomePlano: '',
        faixasPreco: {}
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro na criação do plano:', error);
      toast.error(error?.message || 'Erro ao configurar plano de saúde');
    },
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    createPlanoMutation.mutate(data);
  };

  const updateFaixaPreco = (faixaKey: string, valor: string) => {
    const numeroValor = parseFloat(valor) || 0;
    setData(prev => ({
      ...prev,
      faixasPreco: {
        ...prev.faixasPreco,
        [faixaKey]: numeroValor
      }
    }));
  };

  const canProceedStep1 = data.seguradora.trim() && data.nomePlano.trim();
  const canProceedStep2 = Object.values(data.faixasPreco).some(valor => valor > 0);

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seguradora">Seguradora</Label>
          <Input
            id="seguradora"
            value={data.seguradora}
            onChange={(e) => setData(prev => ({ ...prev, seguradora: e.target.value }))}
            placeholder="Ex: Amil, SulAmérica, Bradesco..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="nomePlano">Nome do Plano</Label>
          <Input
            id="nomePlano"
            value={data.nomePlano}
            onChange={(e) => setData(prev => ({ ...prev, nomePlano: e.target.value }))}
            placeholder="Ex: TF Soluções, Empresarial Premium..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!canProceedStep1}>
          Próximo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Defina o valor mensal para cada faixa etária. Deixe em branco as faixas que não se aplicam.
        </p>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Faixa Etária</TableHead>
              <TableHead>Valor Mensal (R$)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FAIXAS_ETARIAS.map((faixa) => (
              <TableRow key={faixa.key}>
                <TableCell className="font-medium">{faixa.label}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.faixasPreco[faixa.key] || ''}
                    onChange={(e) => updateFaixaPreco(faixa.key, e.target.value)}
                    placeholder="0,00"
                    className="w-32"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleNext} disabled={!canProceedStep2}>
          Revisar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h4 className="font-medium">Informações do Plano</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Seguradora:</span>
              <p className="font-medium">{data.seguradora}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Nome do Plano:</span>
              <p className="font-medium">{data.nomePlano}</p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h4 className="font-medium">Preços por Faixa Etária</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {FAIXAS_ETARIAS
              .filter(faixa => data.faixasPreco[faixa.key] && data.faixasPreco[faixa.key] > 0)
              .map((faixa) => (
                <div key={faixa.key} className="flex justify-between">
                  <span className="text-muted-foreground">{faixa.label}:</span>
                  <span className="font-medium">
                    R$ {data.faixasPreco[faixa.key]?.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={createPlanoMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {createPlanoMutation.isPending ? (
            <>Salvando...</>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Salvar Plano
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Informações do Plano';
      case 2: return 'Preços por Faixa Etária';
      case 3: return 'Revisar e Salvar';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <span className="text-sm font-bold text-blue-600">{currentStep}</span>
            </div>
            {getStepTitle()}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="mt-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
