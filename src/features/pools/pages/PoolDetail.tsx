
import { useMemo, useCallback } from 'react';
import MainLayout from '@/layout/MainLayout';
import PoolDetailLayout from '@/features/pools/components/PoolDetailLayout';
import VolanteCarousel from '@/features/pools/components/VolanteCarousel';
import ParticipantsTable from '@/features/pools/components/ParticipantsTable';
import AddVolanteForm from '@/features/pools/components/AddVolanteForm';
import { usePoolDetail } from '@/features/pools/providers/PoolDetailProvider';
import { usePoolCompetition } from '@/features/pools/hooks/usePoolCompetition';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function PoolDetail() {
  const { pool, participants, tickets, isAdmin, loading, error, refreshData } = usePoolDetail();
  const { user } = useAuth();
  
  // Buscar competição ativa do pool (buscar se ranking habilitado ou undefined - migração pendente)
  const { competition: activeCompetition } = usePoolCompetition(
    (pool?.hasRanking === true || pool?.hasRanking === undefined) && pool?.id ? pool.id : null as any
  );

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!pool || !participants) return { totalPrize: 0, confirmedParticipants: 0 };
    
    const confirmedParticipants = participants.filter(p => p.status === 'confirmed').length;
    const totalPrize = pool.contributionAmount * participants.length;
    
    return { totalPrize, confirmedParticipants };
  }, [pool, participants]);

  // Callback para refresh após adicionar volante
  const handleVolanteAdded = useCallback(() => {
    if (refreshData) {
      refreshData();
    }
  }, [refreshData]);

  if (loading) {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error || !pool) {
    return (
      <MainLayout>
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold">Bolão não encontrado</h2>
          <p className="text-muted-foreground mt-2">O bolão solicitado não existe ou você não tem acesso a ele.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <PoolDetailLayout
      pool={pool}
      participantsCount={participants.length}
      totalPrize={stats.totalPrize}
      isAdmin={isAdmin}
      tickets={tickets}
      activeCompetition={activeCompetition}
      currentUserId={user?.id}
    >
      <div className="space-y-6">
        {/* Formulário para adicionar volante (só para admin) */}
        {isAdmin && (
          <AddVolanteForm 
            poolId={pool.id} 
            onVolanteAdded={handleVolanteAdded}
          />
        )}
        
        {/* Volantes com Carousel */}
        <VolanteCarousel tickets={tickets} />
        
        {/* Participantes */}
        <ParticipantsTable participants={participants} />
      </div>
    </PoolDetailLayout>
  );
}
