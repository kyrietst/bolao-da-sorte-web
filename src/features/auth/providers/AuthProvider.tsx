
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Configuração do evento de mudança de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Verificar se há uma sessão existente e definir o estado de loading
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Conta criada com sucesso",
        description: "Verifique seu email para confirmar sua conta.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?tab=reset-password`,
      });
      
      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Email enviado com sucesso",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast({
        title: "Erro ao enviar email",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado com sucesso",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast({
        title: "Erro ao fazer logout",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword
      }}>
      {children}
    </AuthContext.Provider>
  );
};
