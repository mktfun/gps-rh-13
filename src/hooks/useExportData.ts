
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

export interface ExportField {
  key: string;
  label: string;
  selected: boolean;
  format?: (value: any) => string;
}

export interface ExportOptions {
  filename: string;
  format: 'csv' | 'xlsx';
  fields: ExportField[];
  includeHeaders: boolean;
}

export const useExportData = <T extends Record<string, any>>() => {
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [exportData, setExportData] = useState<T[]>([]);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    filename: 'export',
    format: 'xlsx',
    fields: [],
    includeHeaders: true
  });
  const { toast } = useToast();

  const openExportPreview = (data: T[], fields: ExportField[], defaultFilename: string) => {
    setExportData(data);
    setExportOptions(prev => ({
      ...prev,
      filename: defaultFilename,
      fields: fields.map(field => ({ ...field, selected: true }))
    }));
    setIsPreviewOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const processData = () => {
    const selectedFields = exportOptions.fields.filter(field => field.selected);
    
    return exportData.map(item => {
      const processedItem: Record<string, any> = {};
      
      selectedFields.forEach(field => {
        const value = item[field.key];
        const label = exportOptions.includeHeaders ? field.label : field.key;
        
        if (field.format && value !== null && value !== undefined) {
          processedItem[label] = field.format(value);
        } else {
          processedItem[label] = value || '';
        }
      });
      
      return processedItem;
    });
  };

  const executeExport = async () => {
    if (exportData.length === 0) {
      toast({
        title: 'Erro na exportação',
        description: 'Não há dados para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const selectedFields = exportOptions.fields.filter(field => field.selected);
    
    if (selectedFields.length === 0) {
      toast({
        title: 'Erro na exportação',
        description: 'Selecione pelo menos um campo para exportar.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const processedData = processData();
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      const workbook = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

      const filename = `${exportOptions.filename}_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      
      if (exportOptions.format === 'csv') {
        XLSX.writeFile(workbook, filename, { bookType: 'csv' });
      } else {
        XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
      }

      toast({
        title: 'Exportação concluída',
        description: `Arquivo ${filename} baixado com sucesso.`,
      });

      setIsPreviewOpen(false);
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Ocorreu um erro ao exportar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  };

  const toggleField = (fieldKey: string) => {
    setExportOptions(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.key === fieldKey
          ? { ...field, selected: !field.selected }
          : field
      )
    }));
  };

  const selectAllFields = () => {
    setExportOptions(prev => ({
      ...prev,
      fields: prev.fields.map(field => ({ ...field, selected: true }))
    }));
  };

  const deselectAllFields = () => {
    setExportOptions(prev => ({
      ...prev,
      fields: prev.fields.map(field => ({ ...field, selected: false }))
    }));
  };

  return {
    isExporting,
    isPreviewOpen,
    exportOptions,
    exportData,
    openExportPreview,
    executeExport,
    updateExportOptions,
    toggleField,
    selectAllFields,
    deselectAllFields,
    setIsPreviewOpen,
    formatCurrency,
    formatCPF,
    formatCNPJ,
    formatDate,
    formatDateTime
  };
};
