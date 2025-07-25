
import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Após o sistema de autenticação terminar de carregar, não estamos mais inicializando
    if (!loading) {
      setInitializing(false);
    }
  }, [loading]);

  // Mostra um loader enquanto verificamos o estado da autenticação
  if (initializing || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para a página de login
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Se estiver autenticado, renderiza os filhos
  return children;
}
