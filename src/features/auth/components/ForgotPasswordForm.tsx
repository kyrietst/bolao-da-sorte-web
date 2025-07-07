import { useState } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await resetPassword(email);
    setLoading(false);
  };

  return (
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
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
            onClick={onBackToLogin}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Voltar ao login
          </button>
        </CardFooter>
      </form>
    </Card>
  );
};