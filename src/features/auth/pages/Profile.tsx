import { useEffect, useState } from 'react';
import MainLayout from '@/layout/MainLayout';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast({
        title: 'Erro ao atualizar perfil',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais.</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize seus dados de perfil.</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  value={email}
                  disabled
                  placeholder="seu@email.com"
                />
                <p className="text-sm text-muted-foreground">O email não pode ser alterado.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}
