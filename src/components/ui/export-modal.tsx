
import React from 'react';
import { Download, FileText, FileSpreadsheet, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ExportOptions, ExportField } from '@/hooks/useExportData';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportOptions: ExportOptions;
  onUpdateOptions: (updates: Partial<ExportOptions>) => void;
  onToggleField: (fieldKey: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExecuteExport: () => void;
  isExporting: boolean;
  dataCount: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  exportOptions,
  onUpdateOptions,
  onToggleField,
  onSelectAll,
  onDeselectAll,
  onExecuteExport,
  isExporting,
  dataCount
}) => {
  const selectedFieldsCount = exportOptions.fields.filter(f => f.selected).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-hidden">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{dataCount}</div>
              <div className="text-sm text-muted-foreground">Total de registros</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{selectedFieldsCount}</div>
              <div className="text-sm text-muted-foreground">Campos selecionados</div>
            </div>
          </div>

          {/* Configurações do arquivo */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="filename">Nome do arquivo</Label>
              <Input
                id="filename"
                value={exportOptions.filename}
                onChange={(e) => onUpdateOptions({ filename: e.target.value })}
                placeholder="nome_do_arquivo"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Formato do arquivo</Label>
              <RadioGroup
                value={exportOptions.format}
                onValueChange={(value: 'csv' | 'xlsx') => onUpdateOptions({ format: value })}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="xlsx" id="xlsx" />
                  <Label htmlFor="xlsx" className="flex items-center gap-2 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Excel (.xlsx)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-blue-600" />
                    CSV (.csv)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeHeaders"
                checked={exportOptions.includeHeaders}
                onCheckedChange={(checked) => onUpdateOptions({ includeHeaders: !!checked })}
              />
              <Label htmlFor="includeHeaders">Incluir cabeçalhos</Label>
            </div>
          </div>

          <Separator />

          {/* Seleção de campos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Campos para exportar</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onSelectAll}
                  disabled={selectedFieldsCount === exportOptions.fields.length}
                >
                  Selecionar todos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onDeselectAll}
                  disabled={selectedFieldsCount === 0}
                >
                  Desmarcar todos
                </Button>
              </div>
            </div>

            <ScrollArea className="h-48 border rounded-md p-4">
              <div className="space-y-3">
                {exportOptions.fields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={field.selected}
                        onCheckedChange={() => onToggleField(field.key)}
                      />
                      <Label htmlFor={field.key} className="cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                    {field.selected && (
                      <Badge variant="secondary" className="text-xs">
                        Selecionado
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button 
            onClick={onExecuteExport} 
            disabled={isExporting || selectedFieldsCount === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>Exportando...</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar {dataCount} {dataCount === 1 ? 'registro' : 'registros'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
