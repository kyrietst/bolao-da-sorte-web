import { useMemo } from 'react';
import { Users } from 'lucide-react';
import PoolsDisplay from './PoolsDisplay';
import { usePoolParticipants } from '../hooks/usePoolParticipants';
import { Pool } from '@/types';

interface ParticipatingPoolsListProps {
  pools?: Pool[];
  loading: boolean;
}

export default function ParticipatingPoolsList({ pools = [], loading }: ParticipatingPoolsListProps) {
  const poolIds = useMemo(() => pools.map(pool => pool.id), [pools]);
  const { participantsCounts, loading: participantsLoading } = usePoolParticipants(poolIds);

  return (
    <PoolsDisplay
      pools={pools}
      loading={loading || participantsLoading}
      isAdmin={false}
      emptyStateIcon={<Users className="h-12 w-12 text-muted-foreground" />}
      emptyStateTitle="Nenhuma participação"
      emptyStateDescription="Você ainda não participa de nenhum bolão. Aguarde um convite ou procure bolões disponíveis!"
      participantsCounts={participantsCounts}
    />
  );
}