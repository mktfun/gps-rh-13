
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImportResults } from '@/types/import';
import { CheckCircle, XCircle, AlertCircle, Download, Clock, Copy, Eye } from 'lucide-react';

interface ImportResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ImportResults | null;
}

export const ImportResultsModal: React.FC<ImportResultsModalProps> = ({
  isOpen,
  onClose,
  results
}) => {
  const downloadErrorReport = () => {
    if (!results?.detailed_results.errors.length) return;

    const errorData = results.detailed_results.errors.map(error => ({
      Linha: error.row,
      Erros: error.errors.map(e => e.message).join('; '),
      ...error.data
    }));

    const csvContent = [
      Object.keys(errorData[0]).join(','),
      ...errorData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio_erros_importacao.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!results) return null;

  const successRate = (results.successful_imports / results.total_rows) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Importação Concluída
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {results.total_rows}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total</p>
                    <p className="text-xs text-blue-600">Processadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Sucesso</p>
                    <p className="text-xs text-green-600">{successRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Erros</p>
                    <p className="text-xs text-red-600">{results.failed_imports} linhas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Copy className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Duplicatas</p>
                    <p className="text-xs text-orange-600">{results.duplicates_handled} tratadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Ignoradas</p>
                    <p className="text-xs text-yellow-600">{results.ignored_errors} linhas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-8 w-8 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Tempo</p>
                    <p className="text-xs text-gray-600">{results.processing_time}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes das Ações */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Funcionários Importados ({results.successful_imports})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Novos funcionários:</span>
                    <Badge variant="default">
                      {results.successful_imports - results.updated_records}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Funcionários atualizados:</span>
                    <Badge variant="secondary">
                      {results.updated_records}
                    </Badge>
                  </div>
                </div>

                {results.detailed_results.success.length > 0 && (
                  <div className="mt-4 max-h-32 overflow-y-auto">
                    <p className="text-sm font-medium mb-2">Últimos importados:</p>
                    {results.detailed_results.success.slice(0, 5).map((success) => (
                      <div key={success.funcionario_id} className="text-sm text-muted-foreground">
                        Linha {success.row}: {success.nome} ({success.action === 'created' ? 'criado' : 'atualizado'})
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Duplicatas Tratadas */}
            {results.duplicates_handled > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-700 flex items-center gap-2">
                    <Copy className="h-5 w-5" />
                    Duplicatas Tratadas ({results.duplicates_handled})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.detailed_results.duplicates.slice(0, 5).map((duplicate, idx) => (
                      <div key={idx} className="p-2 bg-orange-50 rounded text-sm">
                        <span className="font-medium">Linha {duplicate.row}:</span>
                        <div className="text-orange-700">
                          {duplicate.action === 'ignored' && 'Ignorada (mantido existente)'}
                          {duplicate.action === 'updated' && 'Dados atualizados'}
                          {duplicate.action === 'created_anyway' && 'Criada como duplicata'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Linhas Ignoradas */}
          {results.ignored_errors > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-700 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Linhas Ignoradas ({results.ignored_errors})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.detailed_results.ignored.slice(0, 3).map((ignored, idx) => (
                    <div key={idx} className="text-sm text-yellow-800">
                      Linha {ignored.row}: {ignored.reason}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Erros */}
          {results.failed_imports > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Erros de Importação ({results.failed_imports})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.detailed_results.errors.slice(0, 5).map((error, idx) => (
                    <div key={idx} className="p-2 bg-red-50 rounded text-sm">
                      <span className="font-medium">Linha {error.row}:</span>
                      <div className="text-red-700">
                        {error.errors.slice(0, 2).map(e => e.message).join(', ')}
                      </div>
                    </div>
                  ))}
                  
                  {results.detailed_results.errors.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      E mais {results.detailed_results.errors.length - 5} erros...
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadErrorReport}
                  className="mt-4 w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Relatório de Erros
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {results.warnings > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Avisos ({results.warnings})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.detailed_results.warnings.slice(0, 3).map((warning, idx) => (
                    <div key={idx} className="text-sm text-yellow-800">
                      Linha {warning.row}: {warning.warnings.map(w => w.message).join(', ')}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
