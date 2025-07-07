import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import LotteryResultCard from '@/components/dashboard/LotteryResult';
import CreatePoolForm from '@/features/pools/components/CreatePoolForm';
import { Button } from '@/components/ui/button';
import { LotteryResult } from '@/types';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useUserPools } from '@/features/pools/hooks/useUserPools';
import { CalendarCheck2, Loader2, Ticket, Users } from 'lucide-react';

import { PoolCard } from '@/components/pool/PoolCard';
import { EmptyState } from '@/components/ui/EmptyState';





export default function Dashboard() {
  const { user } = useAuth();
  const { pools, participantsCount, loading } = useUserPools(user);

  const nextDrawDate = useMemo(() => {
    if (pools.length === 0) return null;

    const activePools = pools.filter(p => p.status === 'ativo');
    if (activePools.length === 0) return null;

    const now = new Date();
    const futurePools = activePools
      .filter(p => new Date(p.drawDate) > now)
      .sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime());

    if (futurePools.length > 0) {
      return new Date(futurePools[0].drawDate).toLocaleDateString('pt-BR');
    }

    return null;
  }, [pools]);

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
          <h2 className="text-xl font-semibold mb-4">Seus Bolões</h2>
          {loading ? (
            <div className="bg-card border border-border rounded-lg p-10 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pools.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pools.slice(0, 3).map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum bolão encontrado"
              description="Você ainda não participa de nenhum bolão. Crie um novo ou use o link de convite para participar."
              icon={<Ticket className="h-12 w-12 text-muted-foreground" />}
            >
              <CreatePoolForm />
            </EmptyState>
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
