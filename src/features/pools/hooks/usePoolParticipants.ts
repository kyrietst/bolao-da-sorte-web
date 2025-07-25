import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { PoolId } from '@/types';

export const usePoolParticipants = (poolIds: PoolId[]) => {
  const { toast } = useToast();
  const [participantsCounts, setParticipantsCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoizar o array de poolIds para evitar re-renders desnecessários
  const memoizedPoolIds = useMemo(() => poolIds, [poolIds.join(',')]);

  const fetchParticipantsCounts = useCallback(async () => {
    if (memoizedPoolIds.length === 0) {
      setParticipantsCounts({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Buscar contagem de participantes para cada pool
      const { data, error } = await supabase
        .from('participants')
        .select('pool_id')
        .in('pool_id', memoizedPoolIds);

      if (error) throw error;

      // Agrupar por pool_id e contar
      const counts: Record<string, number> = {};
      memoizedPoolIds.forEach(poolId => {
        counts[poolId] = 0;
      });

      if (data) {
        data.forEach(participant => {
          counts[participant.pool_id] = (counts[participant.pool_id] || 0) + 1;
        });
      }

      setParticipantsCounts(counts);
    } catch (err: unknown) {
      const errorToSet = err instanceof Error ? err : new Error("Erro ao buscar participantes.");
      setError(errorToSet);
      toast({
        title: "Erro ao buscar participantes",
        description: errorToSet.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [memoizedPoolIds, toast]);

  useEffect(() => {
    fetchParticipantsCounts();
  }, [fetchParticipantsCounts]);

  return { participantsCounts, loading, error, refetch: fetchParticipantsCounts };
};