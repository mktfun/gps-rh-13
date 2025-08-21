import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class DashboardErrorBoundary extends React.Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md border">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Erro ao carregar dashboard
            </h2>
            
            <p className="text-muted-foreground mb-6">
              Erro desconhecido. Verifique o console para mais detalhes.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}