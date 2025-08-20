import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardError } from '@/types/dashboard';

interface ErrorStateProps {
  error: Error | DashboardError;
  retry?: () => void;
  title?: string;
  description?: string;
}

export function ErrorState({ 
  error, 
  retry, 
  title = "Erro ao carregar dados",
  description 
}: ErrorStateProps) {
  const errorMessage = description || error.message || 'Não foi possível carregar os dados. Tente recarregar a página.';
  
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {errorMessage}
        </p>
        
        {retry && (
          <Button onClick={retry} className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ 
  title = "Nenhum dado encontrado",
  description = "Não há dados disponíveis para exibir no momento.",
  icon: Icon = AlertTriangle,
  action
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
        
        {action}
      </div>
    </div>
  );
}

export function ChartErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-lg">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-500 mb-4">Erro ao carregar gráfico</p>
        {retry && (
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  );
}

export function ChartEmptyState({ message = "Nenhum dado para exibir" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-lg">
      <div className="text-center">
        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}
