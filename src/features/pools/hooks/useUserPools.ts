import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Pool, SupabasePool, LotteryType, PoolId } from '@/types';
import { convertSupabasePoolToPool } from '@/lib/utils';
import { User } from '@supabase/supabase-js';

export const useUserPools = (user: User | null) => {
  const { toast } = useToast();
  // Este estado irá armazenar os dados já com os tipos corretos
  const [typedPools, setTypedPools] = useState<SupabasePool[]>([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPools = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Buscar bolões que o usuário é administrador
      const { data: adminPools, error: adminError } = await supabase
        .from('pools')
        .select('*')
        .eq('admin_id', user.id);

      if (adminError) throw adminError;

      // 2. Buscar IDs dos bolões que o usuário participa
      const { data: participantEntries, error: participantError } = await supabase
        .from('participants')
        .select('pool_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      let participantPools: any[] = [];
      if (participantEntries && participantEntries.length > 0) {
        const participantPoolIds = participantEntries.map(p => p.pool_id);
        
        // 3. Buscar dados completos dos bolões que o usuário participa
        const { data, error } = await supabase
          .from('pools')
          .select('*')
          .in('id', participantPoolIds)
          .not('admin_id', 'eq', user.id);
        
        if (error) throw error;
        if (data) participantPools = data;
      }

      const allPoolsFromApi = [...(adminPools || []), ...participantPools];

      // AQUI ESTÁ A CORREÇÃO: Converter os tipos logo após receber os dados
      const correctlyTypedPools = allPoolsFromApi.map(p => ({
        ...p,
        id: p.id as PoolId,
        lottery_type: p.lottery_type as LotteryType,
      })) as SupabasePool[];

      setTypedPools(correctlyTypedPools);

      // 4. Contar participantes de todos os bolões
      if (correctlyTypedPools.length > 0) {
        const allPoolIds = correctlyTypedPools.map(p => p.id);
        const { count, error: countError } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .in('pool_id', allPoolIds);

        if (countError) {
          console.error('Erro ao contar participantes:', countError);
          setParticipantsCount(0);
        } else {
          setParticipantsCount(count || 0);
        }
      } else {
        setParticipantsCount(0);
      }

    } catch (err: unknown) {
      const errorToSet = err instanceof Error ? err : new Error("Ocorreu um erro inesperado ao buscar os bolões.");
      setError(errorToSet);
      toast({
        title: "Erro ao buscar bolões",
        description: errorToSet.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const pools = useMemo(() => {
    const formatted = typedPools.map(convertSupabasePoolToPool);
    formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return formatted;
  }, [typedPools]);

  return { pools, participantsCount, loading, error };
};
