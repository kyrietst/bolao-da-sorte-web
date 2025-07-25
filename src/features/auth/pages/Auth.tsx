
import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/providers/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export default function Auth() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'reset-password') {
      setActiveTab('reset-password');
    }
  }, [searchParams]);

  if (user && !loading) {
    return <Navigate to="/dashboard" />;
  }

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
            <LoginForm onForgotPassword={() => setActiveTab('forgot')} />
          </TabsContent>
          
          <TabsContent value="register">
            <RegisterForm />
          </TabsContent>

          <TabsContent value="forgot">
            <ForgotPasswordForm onBackToLogin={() => setActiveTab('login')} />
          </TabsContent>

          <TabsContent value="reset-password">
            <ResetPasswordForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
