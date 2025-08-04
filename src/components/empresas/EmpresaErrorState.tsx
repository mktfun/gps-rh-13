
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EmpresaErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export const EmpresaErrorState = ({ error, onRetry }: EmpresaErrorStateProps) => {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erro ao carregar empresas</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{error.message}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
