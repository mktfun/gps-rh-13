import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useEmpresaId } from '@/hooks/useEmpresaId';

export const HooksTest = () => {
  const { data: empresaId } = useEmpresaId();
  
  // Test the problematic hook
  const {
    funcionarios,
    totalCount,
    isLoading,
    error
  } = useFuncionarios({
    search: '',
    page: 0,
    pageSize: 10,
    empresaId: empresaId || undefined,
    statusFilter: undefined,
  });

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-green-800">
          🧪 Hooks Test - Funcionários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-2">
          <div><strong>Empresa ID:</strong> {empresaId || 'N/A'}</div>
          <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
          <div><strong>Error:</strong> {error ? error.message : 'None'}</div>
          <div><strong>Total Count:</strong> {totalCount}</div>
          <div><strong>Funcionários Count:</strong> {funcionarios?.length || 0}</div>
          {funcionarios?.length > 0 && (
            <div className="text-xs text-green-600">
              ✅ Hooks are working correctly - no conditional returns
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
