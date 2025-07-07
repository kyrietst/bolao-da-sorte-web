import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você também pode registrar o erro em um serviço de relatórios de erro
    // ex: console.error("Uncaught error:", error, errorInfo);
    // logErrorToMyService(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Você pode renderizar qualquer UI de fallback personalizada
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
          <h1 className="text-4xl font-bold text-destructive mb-4">Oops! Algo deu errado.</h1>
          <p className="text-lg mb-6">Nossa equipe foi notificada e já estamos trabalhando para corrigir o problema.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Detalhes do erro: {this.state.error?.message}
          </p>
          <Button onClick={this.handleReload}>Recarregar a Página</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
