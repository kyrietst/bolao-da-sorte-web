
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import LotteryResultCard from '@/components/dashboard/LotteryResult';
import CreatePoolForm from '@/components/pools/CreatePoolForm';
import { Button } from '@/components/ui/button';
import { LotteryResult, LotteryType, Pool, SupabasePool } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { CalendarCheck2, Loader2, Ticket, Users } from 'lucide-react';

// Mock data - será substituído com dados reais
const mockResults: LotteryResult[] = [
  {
    id: '1',
    lotteryType: 'megasena' as LotteryType,
    drawNumber: '2650',
    drawDate: '2023-10-28',
    numbers: [4, 18, 29, 37, 39, 53],
    accumulated: true,
  },
  {
    id: '2',
    lotteryType: 'lotofacil' as LotteryType,
    drawNumber: '3000',
    drawDate: '2024-01-10',
    numbers: [1, 2, 3, 4, 5, 10],
    winners: 0,
    accumulated: false,
  },
  {
    id: '3',
    lotteryType: 'quina' as LotteryType,
    drawNumber: '6400',
    drawDate: '2024-03-26',
    numbers: [4, 24, 33, 50, 77],
    accumulated: true,
  },
];

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

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pools, setPools] = useState<Pool[]>([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nextDrawDate, setNextDrawDate] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserPools();
    }
  }, [user]);

  const fetchUserPools = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar bolões que o usuário é administrador
      const { data: adminPools, error: adminError } = await supabase
        .from('pools')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminError) throw adminError;
      
      // Buscar bolões que o usuário participa
      const { data: participantPools, error: participantError } = await supabase
        .from('participants')
        .select('pool_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      // Combinar os bolões
      // Transformamos o tipo explicitamente para garantir que o lottery_type seja reconhecido como LotteryType
      const adminPoolsTyped = adminPools?.map(pool => ({
        ...pool,
        lottery_type: pool.lottery_type as LotteryType
      })) as SupabasePool[] || [];
      
      let allPoolsList: SupabasePool[] = adminPoolsTyped;
      let participantPoolsData: SupabasePool[] = [];
      
      if (participantPools && participantPools.length > 0) {
        const participantPoolIds = participantPools.map(p => p.pool_id);
        
        const { data, error } = await supabase
          .from('pools')
          .select('*')
          .in('id', participantPoolIds)
          .not('admin_id', 'eq', user.id); // Exclui bolões que ele é admin (para evitar duplicações)
        
        if (!error && data) {
          // Aplicamos a mesma transformação aqui para garantir o tipo correto
          participantPoolsData = data.map(pool => ({
            ...pool,
            lottery_type: pool.lottery_type as LotteryType
          })) as SupabasePool[];
          
          allPoolsList = [...allPoolsList, ...participantPoolsData];
        }
      }

      // Converter para o formato Pool
      const formattedPools = allPoolsList.map(convertSupabasePoolToPool);
      setPools(formattedPools);

      // Calcular próximo sorteio
      const activePools = formattedPools.filter(p => p.status === 'ativo');
      if (activePools.length > 0) {
        const now = new Date();
        const futurePools = activePools
          .filter(p => new Date(p.drawDate) > now)
          .sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime());
        
        if (futurePools.length > 0) {
          setNextDrawDate(new Date(futurePools[0].drawDate).toLocaleDateString('pt-BR'));
        }
      }

      // Buscar contagem total de participantes nos bolões do usuário
      if (allPoolsList.length > 0) {
        const poolIds = allPoolsList.map(p => p.id);
        const { count, error } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .in('pool_id', poolIds);

        if (!error) {
          setParticipantsCount(count || 0);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro ao buscar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo(a), {user?.user_metadata?.name || 'Usuário'}! Visualize seus bolões ativos.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Total de Bolões"
            value={pools.length}
            description="Bolões que você participa"
            icon={<Ticket className="h-5 w-5 text-muted-foreground" />}
          />
          <StatCard
            title="Participações"
            value={participantsCount}
            description="Participantes nos seus bolões"
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
          />
          <StatCard
            title="Próximo Sorteio"
            value={nextDrawDate || "Nenhum sorteio"}
            description="Data do próximo sorteio"
            icon={<CalendarCheck2 className="h-5 w-5 text-muted-foreground" />}
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Últimos Resultados</h2>
            <Button variant="outline" size="sm">
              Ver todos
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {mockResults.map((result) => (
              <LotteryResultCard key={result.id} result={result} />
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Seus Bolões</h2>
          {loading ? (
            <div className="bg-card border border-border rounded-lg p-10 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pools.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pools.slice(0, 3).map((pool) => (
                <Link 
                  key={pool.id}
                  to={`/boloes/${pool.id}`}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary/20 hover:bg-muted/20 transition-colors"
                >
                  <h3 className="font-semibold text-lg mb-2">{pool.name}</h3>
                  <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <span>
                      {pool.lotteryType.charAt(0).toUpperCase() + pool.lotteryType.slice(1)}
                    </span>
                    <span>Sorteio: {new Date(pool.drawDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      pool.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {pool.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                    </span>
                    <span className="text-sm font-medium text-primary">Ver detalhes →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-10 text-center">
              <div className="mb-4 flex justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Nenhum bolão encontrado</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Você ainda não participa de nenhum bolão. Crie um novo ou use o link de convite para participar.
              </p>
              <CreatePoolForm />
            </div>
          )}
          
          {pools.length > 3 && (
            <div className="mt-4 text-center">
              <Link to="/meus-boloes">
                <Button variant="outline">Ver todos os bolões</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
