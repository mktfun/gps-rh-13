
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCsvParser } from '@/hooks/useCsvParser';
import { useBulkImport } from '@/hooks/useBulkImport';
import { ColumnMappingStep } from './ColumnMappingStep';
import { ImportPreviewTable } from './ImportPreviewTable';
import { ImportResultsModal } from './ImportResultsModal';
import { Upload, FileText, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { 
  ParsedCsvData, 
  ColumnMapping, 
  ValidationResult, 
  ImportResults, 
  ImportOptions,
  SYSTEM_FIELDS 
} from '@/types/import';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cnpjId: string;
  plano: {
    id: string;
    seguradora: string;
    valor_mensal: number;
  };
}

type Step = 'upload' | 'mapping' | 'preview' | 'processing' | 'results';

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  cnpjId,
  plano
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [csvData, setCsvData] = useState<ParsedCsvData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Opções de importação com valores padrão
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skip_duplicates: false,
    update_existing: true,
    strict_validation: false,
    ignore_errors: false,
    duplicate_handling: 'update'
  });

  const { parseFile, isLoading: isParsing, error: parseError } = useCsvParser();
  const { validateData, importData, isImporting, isValidating, progress } = useBulkImport();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseFile(file);
      setCsvData(data);
      
      // Auto-mapping inteligente
      const autoMapping: ColumnMapping = {};
      data.headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('nome')) autoMapping[header] = 'nome';
        else if (lowerHeader.includes('cpf')) autoMapping[header] = 'cpf';
        else if (lowerHeader.includes('nascimento')) autoMapping[header] = 'data_nascimento';
        else if (lowerHeader.includes('cargo')) autoMapping[header] = 'cargo';
        else if (lowerHeader.includes('salario') || lowerHeader.includes('salário')) autoMapping[header] = 'salario';
        else if (lowerHeader.includes('email')) autoMapping[header] = 'email';
        else if (lowerHeader.includes('civil')) autoMapping[header] = 'estado_civil';
        else autoMapping[header] = 'ignore';
      });
      
      setColumnMapping(autoMapping);
      setCurrentStep('mapping');
    } catch (error) {
      console.error('Erro ao fazer parse do arquivo:', error);
    }
  };

  const handleMappingNext = async () => {
    if (!csvData) return;

    // Validar mapeamento
    const requiredFields = Object.keys(SYSTEM_FIELDS.required);
    const mappedFields = Object.values(columnMapping).filter(field => field !== 'ignore');
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));

    if (missingRequired.length > 0) {
      alert(`Campos obrigatórios não mapeados: ${missingRequired.join(', ')}`);
      return;
    }

    // Validar dados com detecção de duplicatas
    try {
      const results = await validateData(cnpjId, csvData.data, columnMapping);
      setValidationResults(results);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Erro na validação:', error);
    }
  };

  const handleImport = async () => {
    if (!csvData) return;

    try {
      setCurrentStep('processing');
      const results = await importData(cnpjId, csvData.data, columnMapping, importOptions);
      setImportResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Erro na importação:', error);
      setCurrentStep('preview');
    }
  };

  const resetModal = () => {
    setCurrentStep('upload');
    setCsvData(null);
    setColumnMapping({});
    setValidationResults([]);
    setImportResults(null);
    setShowResults(false);
    setImportOptions({
      skip_duplicates: false,
      update_existing: true,
      strict_validation: false,
      ignore_errors: false,
      duplicate_handling: 'update'
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const canProceedFromPreview = () => {
    const errorCount = validationResults.filter(r => r.status === 'error').length;
    return errorCount === 0 || importOptions.ignore_errors;
  };

  const getImportButtonText = () => {
    if (!canProceedFromPreview()) {
      return 'Corrija os erros para continuar';
    }

    const validCount = validationResults.filter(r => r.status === 'valid' && !r.isDuplicate).length;
    const duplicateCount = validationResults.filter(r => r.isDuplicate).length;
    const errorCount = validationResults.filter(r => r.status === 'error').length;
    
    let count = validCount;
    
    // Adicionar duplicatas se serão processadas
    if (importOptions.duplicate_handling !== 'ignore') {
      count += duplicateCount;
    }
    
    // Subtrair erros se serão ignorados
    if (importOptions.ignore_errors && errorCount > 0) {
      return `Importar ${count} funcionários (${errorCount} erros serão ignorados)`;
    }
    
    return `Importar ${count} funcionários`;
  };

  return (
    <>
      <Dialog open={isOpen && !showResults} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importação em Massa de Funcionários
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {plano.seguradora} - Valor mensal: R$ {plano.valor_mensal.toFixed(2)}
            </p>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 py-4">
            {[
              { key: 'upload', label: 'Upload' },
              { key: 'mapping', label: 'Mapeamento' },
              { key: 'preview', label: 'Preview' },
              { key: 'processing', label: 'Processamento' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep === step.key || 
                    (['mapping', 'preview', 'processing'].includes(currentStep) && step.key === 'upload') ||
                    (['preview', 'processing'].includes(currentStep) && step.key === 'mapping') ||
                    (currentStep === 'processing' && step.key === 'preview')
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {index + 1}
                </div>
                <span className="ml-2 text-sm">{step.label}</span>
                {index < 3 && <ArrowRight className="h-4 w-4 ml-4 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="mt-6">
            {currentStep === 'upload' && (
              <div className="space-y-6">
                <Card className="border-dashed border-2 border-muted-foreground/25">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Selecione o arquivo CSV</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Faça upload de um arquivo CSV contendo os dados dos funcionários
                    </p>
                    
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                      disabled={isParsing}
                    />
                    <label htmlFor="csv-upload">
                      <Button asChild disabled={isParsing}>
                        <span>
                          {isParsing ? 'Processando...' : 'Selecionar Arquivo'}
                        </span>
                      </Button>
                    </label>
                  </CardContent>
                </Card>

                {parseError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      Erro ao processar arquivo: {parseError}
                    </AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Formato esperado do CSV:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Arquivo deve ter cabeçalho na primeira linha</li>
                      <li>Campos obrigatórios: Nome, CPF, Data Nascimento, Cargo, Salário</li>
                      <li>Data no formato DD/MM/AAAA</li>
                      <li>CPF pode ter ou não formatação (pontos e hífen)</li>
                      <li>Estado civil: solteiro, casado, divorciado, viuvo, uniao_estavel</li>
                      <li>Funcionários duplicados serão detectados automaticamente</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 'mapping' && csvData && (
              <ColumnMappingStep
                headers={csvData.headers}
                preview={csvData.preview}
                mapping={columnMapping}
                onMappingChange={setColumnMapping}
              />
            )}

            {currentStep === 'preview' && (
              <>
                {isValidating ? (
                  <div className="space-y-6 text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Validando dados...</h3>
                      <p className="text-sm text-muted-foreground">
                        Verificando duplicatas e validando informações
                      </p>
                    </div>
                  </div>
                ) : (
                  <ImportPreviewTable 
                    validationResults={validationResults}
                    options={importOptions}
                    onUpdateOptions={(updates) => 
                      setImportOptions(prev => ({ ...prev, ...updates }))
                    }
                  />
                )}
              </>
            )}

            {currentStep === 'processing' && (
              <div className="space-y-6 text-center py-12">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Importando funcionários...</h3>
                  <p className="text-sm text-muted-foreground">
                    Processando dados com as configurações selecionadas
                  </p>
                </div>
                <div className="max-w-md mx-auto">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {progress}% concluído
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {currentStep !== 'upload' && currentStep !== 'processing' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 'mapping') setCurrentStep('upload');
                    else if (currentStep === 'preview') setCurrentStep('mapping');
                  }}
                  disabled={isParsing || isImporting || isValidating}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isParsing || isImporting || isValidating}
              >
                Cancelar
              </Button>
              
              {currentStep === 'mapping' && (
                <Button 
                  onClick={handleMappingNext} 
                  disabled={isParsing || isValidating}
                >
                  {isValidating ? 'Validando...' : 'Continuar'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              {currentStep === 'preview' && !isValidating && (
                <Button 
                  onClick={handleImport} 
                  disabled={!canProceedFromPreview() || isImporting}
                >
                  {getImportButtonText()}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <ImportResultsModal
        isOpen={showResults}
        onClose={() => {
          setShowResults(false);
          handleClose();
        }}
        results={importResults}
      />
    </>
  );
};
