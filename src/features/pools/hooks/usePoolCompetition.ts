import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Competition, PoolId } from '@/types';
import { RankingService } from '@/services/rankingService';

interface UsePoolCompetitionResult {
  competition: Competition | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar a competição ativa de um pool
 */
export function usePoolCompetition(poolId: PoolId): UsePoolCompetitionResult {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tryCreateAutoCompetition = async () => {
    try {
      if (!poolId) {
        setCompetition(null);
        return;
      }

      // Buscar informações do pool para criar competição
      const { data: poolData, error: poolError } = await supabase
        .from('pools')
        .select('lottery_type, admin_id, has_ranking, ranking_period')
        .eq('id', poolId)
        .single();

      if (poolError || !poolData) {
        console.log('Pool não encontrado para criar competição automática');
        setCompetition(null);
        return;
      }

      // Só criar competição se o ranking estiver habilitado ou se o campo não existir (migração pendente)
      if (poolData.has_ranking === false) {
        setCompetition(null);
        return;
      }

      const period = poolData.ranking_period || 'mensal';
      
      // Tentar criar competição automaticamente
      const competitionId = await RankingService.createCompetitionForPool(
        poolId,
        period,
        poolData.lottery_type,
        poolData.admin_id
      );

      if (competitionId) {
        // Buscar a competição recém-criada
        await fetchCompetition();
      } else {
        setCompetition(null);
      }
    } catch (error) {
      console.error('Erro ao criar competição automática:', error);
      setCompetition(null);
    }
  };

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!poolId) {
        setCompetition(null);
        return;
      }

      // Primeiro verificar se a tabela competitions existe
      const { error: testError } = await supabase
        .from('competitions')
        .select('id')
        .limit(1);

      if (testError) {
        console.warn('Tabela competitions não existe ainda. Migração não foi executada:', testError.message);
        setCompetition(null);
        return;
      }

      // Buscar a competição ativa mais recente para este pool
      const { data, error: fetchError } = await supabase
        .from('competitions')
        .select('*')
        .eq('pool_id', poolId)
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Erro ao buscar competição:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        // Converter snake_case para camelCase
        const competitionData: Competition = {
          id: data.id,
          poolId: data.pool_id,
          name: data.name,
          description: data.description,
          period: data.period,
          startDate: data.start_date,
          endDate: data.end_date,
          lotteryType: data.lottery_type,
          status: data.status,
          pointsPerHit: data.points_per_hit,
          bonusPoints: data.bonus_points || {},
          createdBy: data.created_by,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };

        setCompetition(competitionData);
      } else {
        // Se não encontrou competição, tentar criar uma automaticamente
        await tryCreateAutoCompetition();
      }
    } catch (err) {
      console.error('Erro ao buscar competição do pool:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (poolId) {
      fetchCompetition();
    } else {
      setCompetition(null);
      setLoading(false);
    }
  }, [poolId]);

  return {
    competition,
    loading,
    error,
    refetch: fetchCompetition
  };
}