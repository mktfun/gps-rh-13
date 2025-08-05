
import React from 'react';

interface ReactAvailabilityCheckProps {
  children: React.ReactNode;
}

export const ReactAvailabilityCheck: React.FC<ReactAvailabilityCheckProps> = ({ children }) => {
  // Check if React hooks are available
  if (typeof React === 'undefined' || !React.useEffect) {
    console.error('❌ React is not properly loaded');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Erro de Carregamento</h1>
          <p className="text-muted-foreground">
            React não está disponível. Por favor, recarregue a página.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
