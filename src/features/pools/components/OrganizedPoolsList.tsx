import { useMemo } from 'react';
import { Ticket } from 'lucide-react';
import CreatePoolForm from './CreatePoolForm';
import PoolsDisplay from './PoolsDisplay';
import { usePoolParticipants } from '../hooks/usePoolParticipants';
import { Pool } from '@/types';

interface OrganizedPoolsListProps {
  pools?: Pool[];
  loading: boolean;
}

export default function OrganizedPoolsList({ pools = [], loading }: OrganizedPoolsListProps) {
  const poolIds = useMemo(() => pools.map(pool => pool.id), [pools]);
  const { participantsCounts, loading: participantsLoading } = usePoolParticipants(poolIds);

  return (
    <PoolsDisplay
      pools={pools}
      loading={loading || participantsLoading}
      isAdmin={true}
      emptyStateIcon={<Ticket className="h-12 w-12 text-muted-foreground" />}
      emptyStateTitle="Nenhum bolão organizado"
      emptyStateDescription="Você ainda não organizou nenhum bolão. Crie um novo para começar!"
      emptyStateAction={<CreatePoolForm />}
      participantsCounts={participantsCounts}
    />
  );
}