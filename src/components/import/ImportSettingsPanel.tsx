
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportOptions } from '@/types/import';
import { Settings, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface ImportSettingsPanelProps {
  options: ImportOptions;
  onUpdateOptions: (updates: Partial<ImportOptions>) => void;
  errorCount: number;
  duplicateCount: number;
  validCount: number;
}

export const ImportSettingsPanel: React.FC<ImportSettingsPanelProps> = ({
  options,
  onUpdateOptions,
  errorCount,
  duplicateCount,
  validCount
}) => {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Settings className="h-5 w-5" />
          Configurações de Importação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tratamento de Erros */}
        {errorCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ignore_errors"
                checked={options.ignore_errors}
                onCheckedChange={(checked) => 
                  onUpdateOptions({ ignore_errors: !!checked })
                }
              />
              <Label htmlFor="ignore_errors" className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Ignorar {errorCount} linha(s) com erro e continuar importação
              </Label>
            </div>
            
            {options.ignore_errors && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-orange-700">
                  {errorCount} linha(s) com erro serão ignoradas. Apenas {validCount} funcionários válidos serão importados.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Tratamento de Duplicatas */}
        {duplicateCount > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-blue-800">
              Tratamento de Duplicatas ({duplicateCount} encontrada(s)):
            </Label>
            
            <RadioGroup
              value={options.duplicate_handling}
              onValueChange={(value: 'ignore' | 'update' | 'create_anyway') => 
                onUpdateOptions({ duplicate_handling: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ignore" id="dup_ignore" />
                <Label htmlFor="dup_ignore" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-500" />
                  Ignorar duplicatas (manter dados existentes)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="dup_update" />
                <Label htmlFor="dup_update" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  Atualizar dados dos funcionários existentes
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create_anyway" id="dup_create" />
                <Label htmlFor="dup_create" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Criar duplicatas mesmo assim (não recomendado)
                </Label>
              </div>
            </RadioGroup>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-700">
                {options.duplicate_handling === 'ignore' && 
                  `${duplicateCount} funcionário(s) duplicado(s) será(ão) ignorado(s).`
                }
                {options.duplicate_handling === 'update' && 
                  `${duplicateCount} funcionário(s) existente(s) será(ão) atualizado(s).`
                }
                {options.duplicate_handling === 'create_anyway' && 
                  `${duplicateCount} funcionário(s) duplicado(s) será(ão) criado(s) mesmo assim.`
                }
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Outras opções */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="strict_validation"
              checked={options.strict_validation}
              onCheckedChange={(checked) => 
                onUpdateOptions({ strict_validation: !!checked })
              }
            />
            <Label htmlFor="strict_validation">
              Validação rigorosa (campos opcionais obrigatórios)
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
