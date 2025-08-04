
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportSettingsPanel } from './ImportSettingsPanel';
import { ValidationResult, ImportOptions, SYSTEM_FIELDS } from '@/types/import';
import { CheckCircle, AlertCircle, XCircle, Copy, Database } from 'lucide-react';

interface ImportPreviewTableProps {
  validationResults: ValidationResult[];
  options: ImportOptions;
  onUpdateOptions: (updates: Partial<ImportOptions>) => void;
}

export const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({
  validationResults,
  options,
  onUpdateOptions
}) => {
  const stats = {
    valid: validationResults.filter(r => r.status === 'valid' && !r.isDuplicate).length,
    warnings: validationResults.filter(r => r.status === 'warning' && !r.isDuplicate).length,
    errors: validationResults.filter(r => r.status === 'error').length,
    duplicates: validationResults.filter(r => r.isDuplicate).length,
    total: validationResults.length
  };

  const getStatusIcon = (status: string, isDuplicate?: boolean) => {
    if (isDuplicate) {
      return <Copy className="h-4 w-4 text-orange-500" />;
    }
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string, isDuplicate?: boolean) => {
    if (isDuplicate) return 'secondary' as const;
    switch (status) {
      case 'valid':
        return 'default' as const;
      case 'warning':
        return 'secondary' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getRowStatus = (result: ValidationResult) => {
    if (result.isDuplicate) return 'Duplicata';
    switch (result.status) {
      case 'valid': return 'Válido';
      case 'warning': return 'Aviso';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  // Mostrar apenas as primeiras 10 linhas na preview
  const previewData = validationResults.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Válidas</p>
                <p className="text-2xl font-bold text-green-900">{stats.valid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Avisos</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.warnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Erros</p>
                <p className="text-2xl font-bold text-red-900">{stats.errors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">Duplicatas</p>
                <p className="text-2xl font-bold text-orange-900">{stats.duplicates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Total</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações de Importação */}
      <ImportSettingsPanel
        options={options}
        onUpdateOptions={onUpdateOptions}
        errorCount={stats.errors}
        duplicateCount={stats.duplicates}
        validCount={stats.valid}
      />

      {/* Alertas */}
      {stats.errors > 0 && !options.ignore_errors && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Existem {stats.errors} linha(s) com erros que impedirão a importação. 
            Ative a opção "Ignorar linhas com erro" para continuar apenas com as linhas válidas.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Preview dos Dados
            <Badge variant="outline">
              {previewData.length} de {stats.total} linhas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Salário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Problemas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((result) => (
                  <TableRow 
                    key={result.row}
                    className={result.isDuplicate ? 'bg-orange-50' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status, result.isDuplicate)}
                        <div className="flex flex-col gap-1">
                          <Badge variant={getStatusVariant(result.status, result.isDuplicate)} className="text-xs">
                            {result.row}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getRowStatus(result)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {result.data.nome || '-'}
                      {result.isDuplicate && result.duplicateInfo?.duplicateType === 'database_existing' && (
                        <div className="text-xs text-orange-600 mt-1">
                          <Database className="h-3 w-3 inline mr-1" />
                          Já existe no sistema
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{result.data.cpf || '-'}</TableCell>
                    <TableCell>{result.data.cargo || '-'}</TableCell>
                    <TableCell>{result.data.salario || '-'}</TableCell>
                    <TableCell>{result.data.email || '-'}</TableCell>
                    <TableCell>
                      {result.issues.length > 0 ? (
                        <div className="space-y-1">
                          {result.issues.slice(0, 2).map((issue, idx) => (
                            <Badge
                              key={idx}
                              variant={issue.severity === 'error' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {issue.message}
                            </Badge>
                          ))}
                          {result.issues.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{result.issues.length - 2} mais
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {stats.total > 10 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Mostrando apenas as primeiras 10 linhas. {stats.total - 10} linhas adicionais serão processadas.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
