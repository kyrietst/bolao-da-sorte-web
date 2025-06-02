import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ParticipantList from '@/components/participants/ParticipantList';
import TicketGamesDisplay from '@/components/lottery/TicketGamesDisplay';
import PoolResults from '@/components/pool/PoolResults';
import { Participant, Pool, SupabasePool, Ticket, LotteryType, SupabaseParticipant, SupabaseTicket } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const convertSupabasePoolToPool = (pool: SupabasePool): Pool => {
  return {
    id: pool.id,
    name: pool.name,
    lotteryType: pool.lottery_type,
    drawDate: pool.draw_date,
    numTickets: pool.num_tickets,
    maxParticipants: pool.max_participants,
    contributionAmount: Number(pool.contribution_amount),
    adminId: pool.admin_id,
    status: pool.status,
    createdAt: pool.created_at,
  };
};

const convertSupabaseParticipantToParticipant = (participant: SupabaseParticipant): Participant => {
  return {
    id: participant.id,
    userId: participant.user_id,
    poolId: participant.pool_id,
    name: participant.name,
    email: participant.email,
    status: participant.status,
  };
};

const convertSupabaseTicketToTicket = (ticket: SupabaseTicket): Ticket => {
  return {
    id: ticket.id,
    poolId: ticket.pool_id,
    ticketNumber: ticket.ticket_number,
    numbers: ticket.numbers,
  };
};

export default function PoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('participantes');
  
  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<Pool | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchPoolData();
    }
  }, [id, user]);

  const fetchPoolData = async () => {
    if (!id || !user) return;

    setLoading(true);
    try {
      // Buscar informações do bolão
      const { data: poolData, error: poolError } = await supabase
        .from('pools')
        .select('*')
        .eq('id', id)
        .single();

      if (poolError) throw poolError;
      if (!poolData) {
        toast({
          title: "Bolão não encontrado",
          description: "O bolão solicitado não existe ou você não tem acesso a ele.",
          variant: "destructive",
        });
        navigate('/meus-boloes');
        return;
      }

      const convertedPool = convertSupabasePoolToPool(poolData as SupabasePool);
      setPool(convertedPool);
      setIsAdmin(poolData.admin_id === user.id);

      // Buscar participantes do bolão
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('pool_id', id);

      if (participantsError) throw participantsError;
      
      setParticipants(
        (participantsData || []).map((p: SupabaseParticipant) => 
          convertSupabaseParticipantToParticipant(p)
        )
      );

      // Buscar bilhetes do bolão
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('pool_id', id);

      if (ticketsError) throw ticketsError;
      
      setTickets(
        (ticketsData || []).map((t: SupabaseTicket) => 
          convertSupabaseTicketToTicket(t)
        )
      );

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
      navigate('/meus-boloes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!pool) {
    return (
      <MainLayout>
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold">Bolão não encontrado</h2>
          <p className="text-muted-foreground mt-2">O bolão solicitado não existe ou você não tem acesso a ele.</p>
        </div>
      </MainLayout>
    );
  }

  const lotteryNames: Record<string, string> = {
    megasena: 'Mega-Sena',
    lotofacil: 'Lotofácil',
    quina: 'Quina',
    lotomania: 'Lotomania',
    timemania: 'Timemania',
    duplasena: 'Dupla Sena'
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{pool.name}</h1>
            <Badge variant="outline" className={pool.status === 'ativo' ? 
              "bg-green-100 text-green-800 hover:bg-green-100" : 
              "bg-gray-100 text-gray-800 hover:bg-gray-100"
            }>
              {pool.status === 'ativo' ? 'Ativo' : 'Finalizado'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {lotteryNames[pool.lotteryType] || pool.lotteryType} • Sorteio: {new Date(pool.drawDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants.length} / {pool.maxParticipants}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contribuição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {pool.contributionAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Bilhetes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length} / {pool.numTickets}</div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="participantes">Participantes</TabsTrigger>
            <TabsTrigger value="bilhetes">Bilhetes</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
            <TabsTrigger value="premios">Prêmios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="participantes" className="pt-6">
            <Card>
              <CardContent className="p-0">
                <ParticipantList participants={participants} isAdmin={isAdmin} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bilhetes" className="pt-6">
            {tickets.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {tickets.map(ticket => (
                  <TicketGamesDisplay 
                    key={ticket.id} 
                    ticket={ticket} 
                    type={pool.lotteryType as LotteryType}
                    gamesPerTicket={10}
                    numbersPerGame={6}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Nenhum bilhete registrado para este bolão ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="resultados" className="pt-6">
            <PoolResults pool={pool} tickets={tickets} />
          </TabsContent>
          
          <TabsContent value="premios" className="pt-6">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  Nenhum prêmio registrado para este bolão ainda.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
