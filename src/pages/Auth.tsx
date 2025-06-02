
import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function Auth() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();
  
  // Estados para formulário de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Estados para formulário de cadastro
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  // Estados para recuperação de senha
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Estados para redefinição de senha
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Verificar se é uma redefinição de senha
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'reset-password') {
      setActiveTab('reset-password');
    }
  }, [searchParams]);

  // Redireciona para a dashboard se já estiver autenticado
  if (user && !loading) {
    return <Navigate to="/dashboard" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    await signIn(loginEmail, loginPassword);
    setLoginLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    await signUp(signupEmail, signupPassword, signupName);
    setSignupLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    await resetPassword(forgotEmail);
    setForgotLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setResetLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Erro ao redefinir senha",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Senha redefinida com sucesso",
          description: "Sua senha foi alterada. Você será redirecionado em breve.",
        });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
            >
              <path d="M4.5 22h-2a.5.5 0 0 1-.5-.5v-19a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v19a.5.5 0 0 1-.5.5Z" />
              <path d="M22 11.5v4a1.5 1.5 0 0 1-3 0v-4a1.5 1.5 0 0 1 3 0Z" />
              <path d="M15 11.5v4a1.5 1.5 0 0 1-3 0v-4a1.5 1.5 0 0 1 3 0Z" />
              <path d="M8 11.5v4a1.5 1.5 0 0 1-3 0v-4a1.5 1.5 0 0 1 3 0Z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">SortePlay</h1>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Cadastro</TabsTrigger>
            <TabsTrigger value="forgot" className="text-xs">Esqueci</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Entre com sua conta para acessar o sistema.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="********" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab('forgot')}
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loginLoading}>
                    {loginLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Criar Conta</CardTitle>
                <CardDescription>
                  Cadastre-se para começar a usar o sistema.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="Seu nome" 
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      placeholder="********" 
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={signupLoading}>
                    {signupLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="forgot">
            <Card>
              <CardHeader>
                <CardTitle>Recuperar Senha</CardTitle>
                <CardDescription>
                  Digite seu email para receber instruções de recuperação.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleForgotPassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input 
                      id="forgot-email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Button type="submit" className="w-full" disabled={forgotLoading}>
                    {forgotLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Email"
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Voltar ao login
                  </button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="reset-password">
            <Card>
              <CardHeader>
                <CardTitle>Nova Senha</CardTitle>
                <CardDescription>
                  Digite sua nova senha abaixo.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      placeholder="********" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      placeholder="********" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={resetLoading}>
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redefinindo...
                      </>
                    ) : (
                      "Redefinir Senha"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
