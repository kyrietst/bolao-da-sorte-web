import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { 
  Copy, 
  Share2, 
  DollarSign,
  Users,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Pool, Participant } from '@/types';

interface PoolParticipant {
  id: string;
  name: string;
  email: string;
  status: string;
  shares_count: number;
  total_contribution: number;
  created_at: string;
}

interface PoolData {
  id: string;
  name: string;
  lottery_type: string;
  draw_date: string;
  max_participants: number;
  contribution_amount: number;
  admin_id: string;
  status: string;
  created_at: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

export default function ManagePool() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<PoolData | null>(null);
  const [participants, setParticipants] = useState<PoolParticipant[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!poolId || !user) return;
    fetchPoolData();
  }, [poolId, user]);

  const fetchPoolData = async () => {
    try {
      setLoading(true);

      // Buscar dados do pool
      const { data: poolData, error: poolError } = await supabase
        .from('pools')
        .select('*')
        .eq('id', poolId)
        .eq('admin_id', user?.id) // Apenas admin pode gerenciar
        .single();

      if (poolError) throw poolError;
      if (!poolData) {
        throw new Error('Pool não encontrado ou você não tem permissão para gerenciá-lo');
      }

      setPool(poolData);

      // Buscar participantes
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('pool_id', poolId)
        .order('created_at', { ascending: true });

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      navigate('/meus-boloes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePool = async () => {
    if (!pool) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('pools')
        .delete()
        .eq('id', pool.id)
        .eq('admin_id', user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Bolão excluído com sucesso",
      });

      navigate('/meus-boloes');
    } catch (error: any) {
      toast({
        title: "Erro ao excluir bolão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleTogglePaymentStatus = async (participantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pendente' ? 'confirmado' : 'pendente';
    
    try {
      const { error } = await supabase
        .from('participants')
        .update({ status: newStatus })
        .eq('id', participantId);

      if (error) throw error;

      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, status: newStatus } : p
      ));

      toast({
        title: "Status atualizado",
        description: `Pagamento marcado como ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/pools/${poolId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "Link de convite copiado para a área de transferência",
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Carregando informações do bolão...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!pool) {
    return (
      <MainLayout>
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold">Bolão não encontrado</h2>
          <p className="text-muted-foreground mt-2">O bolão solicitado não existe ou você não tem permissão para gerenciá-lo.</p>
          <Button onClick={() => navigate('/meus-boloes')} className="mt-4">
            Voltar aos Meus Bolões
          </Button>
        </div>
      </MainLayout>
    );
  }

  const confirmedParticipants = participants.filter(p => p.status === 'confirmado');
  const pendingParticipants = participants.filter(p => p.status === 'pendente');
  const totalConfirmed = confirmedParticipants.reduce((sum, p) => sum + (p.total_contribution || 0), 0);
  const commission = totalConfirmed * 0.1; // 10% de comissão
  const valueForGames = totalConfirmed - commission;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar: {pool.name}</h1>
              <p className="text-muted-foreground">
                {pool.lottery_type.toUpperCase()} • {new Date(pool.draw_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <Badge variant={pool.status === 'ativo' ? 'default' : 'secondary'}>
            {pool.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gerenciamento de Participantes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gerenciamento de Participantes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Marque as cotas como pagas assim que confirmar o recebimento.
                </p>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum participante ainda</p>
                    <p className="text-sm">Compartilhe o link para convidar pessoas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header da tabela */}
                    <div className="grid grid-cols-4 gap-4 py-2 border-b font-medium text-sm text-muted-foreground">
                      <div>Participante</div>
                      <div className="text-center">Cotas</div>
                      <div className="text-center">Pagamento Confirmado</div>
                      <div></div>
                    </div>

                    {/* Lista de participantes */}
                    {participants.map((participant) => (
                      <div key={participant.id} className="grid grid-cols-4 gap-4 py-3 items-center border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-sm text-muted-foreground">{participant.email}</p>
                        </div>
                        
                        <div className="text-center">
                          <span className="font-medium">{participant.shares_count}</span>
                        </div>
                        
                        <div className="flex justify-center">
                          <Switch
                            checked={participant.status === 'confirmado'}
                            onCheckedChange={() => handleTogglePaymentStatus(participant.id, participant.status)}
                          />
                          <span className="ml-2 text-sm">
                            {participant.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                          </span>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`mailto:${participant.email}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Convites e Resumo */}
          <div className="space-y-6">
            {/* Convidar Participantes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Convidar Participantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Link de Convite</label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      value={`${window.location.origin}/pools/${poolId}`}
                      readOnly
                      className="text-xs"
                    />
                    <Button size="sm" onClick={copyInviteLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <Button className="w-full" onClick={copyInviteLink}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </CardContent>
            </Card>

            {/* Resumo Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Arrecadado (Confirmado)</span>
                  <span className="font-semibold text-lg">{formatCurrency(totalConfirmed)}</span>
                </div>
                
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Sua Comissão (10%)</span>
                  <span className="font-semibold">{formatCurrency(commission)}</span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm">💰 Valor para Jogos</span>
                  <span className="font-semibold">{formatCurrency(valueForGames)}</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Os valores são calculados com base nas cotas com pagamento confirmado.
                </div>
              </CardContent>
            </Card>

            {/* Zona de Perigo */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-700">Zona de Perigo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Excluir o bolão é uma ação irreversível e afetará todos os participantes.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  variant="destructive" 
                  className="w-full gap-2"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Bolão
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de Confirmação de Exclusão */}
        <DeleteConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeletePool}
          title="Excluir Bolão"
          description={`Tem certeza que deseja excluir o bolão "${pool?.name}"? Esta ação não pode ser desfeita e todos os participantes serão removidos.`}
          isDeleting={isDeleting}
        />
      </div>
    </MainLayout>
  );
}