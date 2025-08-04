
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColumnMapping, SYSTEM_FIELDS } from '@/types/import';

interface ColumnMappingStepProps {
  headers: string[];
  preview: any[][];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

export const ColumnMappingStep: React.FC<ColumnMappingStepProps> = ({
  headers,
  preview,
  mapping,
  onMappingChange
}) => {
  const handleMappingChange = (csvColumn: string, systemField: string) => {
    const newMapping = { ...mapping, [csvColumn]: systemField };
    onMappingChange(newMapping);
  };

  const getMappedFieldsCount = () => {
    const requiredFields = Object.keys(SYSTEM_FIELDS.required);
    const mappedRequired = requiredFields.filter(field => 
      Object.values(mapping).includes(field)
    );
    return {
      mapped: mappedRequired.length,
      total: requiredFields.length
    };
  };

  const { mapped, total } = getMappedFieldsCount();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mapeamento de Colunas</h3>
          <p className="text-sm text-muted-foreground">
            Associe as colunas do seu CSV aos campos do sistema
          </p>
        </div>
        <Badge variant={mapped === total ? "default" : "secondary"}>
          {mapped}/{total} campos obrigatórios mapeados
        </Badge>
      </div>

      <div className="grid gap-4">
        {headers.map((header, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <h4 className="font-medium">{header}</h4>
                <div className="text-sm text-muted-foreground mt-1">
                  Preview: {preview.slice(0, 3).map(row => row[index]).join(', ')}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <Select
                  value={mapping[header] || ''}
                  onValueChange={(value) => handleMappingChange(header, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o campo correspondente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ignore">Ignorar esta coluna</SelectItem>
                    
                    {/* Campos obrigatórios */}
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Campos Obrigatórios
                    </div>
                    {Object.entries(SYSTEM_FIELDS.required).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {label}
                          <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Campos opcionais */}
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">
                      Campos Opcionais
                    </div>
                    {Object.entries(SYSTEM_FIELDS.optional).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {mapped < total && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              ⚠️ Campos Obrigatórios Não Mapeados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              Você precisa mapear todos os campos obrigatórios antes de continuar:
            </p>
            <ul className="mt-2 list-disc list-inside text-orange-700">
              {Object.entries(SYSTEM_FIELDS.required)
                .filter(([key]) => !Object.values(mapping).includes(key))
                .map(([key, label]) => (
                  <li key={key}>{label}</li>
                ))
              }
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
