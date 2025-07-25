import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Configuration constants
const PERFORMANCE_CONFIG = {
  minPoolsForLowRisk: 5,
  highInvestmentThreshold: 1000,
  riskAdjustments: {
    fewPools: 20,
    highInvestment: 15,
    goodDiversification: -15,
    positiveReturn: -10,
    negativeReturn: 20
  },
  baseRiskScore: 50
} as const;

// Custom error class
class PerformanceInsightsError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'PerformanceInsightsError';
  }
}

// Properly typed interfaces
interface PoolData {
  readonly id: string;
  readonly status: string;
  readonly contribution_amount: number;
  readonly created_at: string;
  readonly participants: Array<{
    readonly user_id: string;
    readonly status: string;
  }>;
}

interface ResultData {
  readonly points_earned: number;
  readonly prize_value: number;
  readonly total_hits: number;
  readonly participant: {
    readonly user_id: string;
    readonly pool: {
      readonly contribution_amount: number;
    };
  };
}

interface PerformanceMetrics {
  readonly consistency: number;
  readonly diversification: number;
  readonly efficiency: number;
}

interface RiskAssessmentConfig {
  readonly minPoolsForLowRisk: number;
  readonly highInvestmentThreshold: number;
  readonly baseRiskScore: number;
}

interface PerformanceInsights {
  readonly totalPools: number;
  readonly activePools: number;
  readonly totalInvestment: number;
  readonly winRate: number;
  readonly avgReturn: number;
  readonly riskScore: number;
  readonly riskLevel: 'Baixo' | 'Médio' | 'Alto';
  readonly performanceMetrics: PerformanceMetrics;
  readonly lastUpdated: string | null;
  readonly loading: boolean;
  readonly error: string | null;
}

// State management with useReducer
interface InsightsState {
  poolsData: PoolData[] | null;
  resultsData: ResultData[] | null;
  poolsLoading: boolean;
  resultsLoading: boolean;
  poolsError: string | null;
  resultsError: string | null;
  lastUpdated: string | null;
}

type InsightsAction =
  | { type: 'POOLS_LOADING_START' }
  | { type: 'POOLS_LOADING_SUCCESS'; payload: PoolData[] }
  | { type: 'POOLS_LOADING_ERROR'; payload: string }
  | { type: 'RESULTS_LOADING_START' }
  | { type: 'RESULTS_LOADING_SUCCESS'; payload: ResultData[] }
  | { type: 'RESULTS_LOADING_ERROR'; payload: string }
  | { type: 'UPDATE_TIMESTAMP'; payload: string };

const initialState: InsightsState = {
  poolsData: null,
  resultsData: null,
  poolsLoading: false,
  resultsLoading: false,
  poolsError: null,
  resultsError: null,
  lastUpdated: null
};

const insightsReducer = (state: InsightsState, action: InsightsAction): InsightsState => {
  switch (action.type) {
    case 'POOLS_LOADING_START':
      return { ...state, poolsLoading: true, poolsError: null };
    case 'POOLS_LOADING_SUCCESS':
      return { ...state, poolsLoading: false, poolsData: action.payload };
    case 'POOLS_LOADING_ERROR':
      return { ...state, poolsLoading: false, poolsError: action.payload, poolsData: null };
    case 'RESULTS_LOADING_START':
      return { ...state, resultsLoading: true, resultsError: null };
    case 'RESULTS_LOADING_SUCCESS':
      return { ...state, resultsLoading: false, resultsData: action.payload };
    case 'RESULTS_LOADING_ERROR':
      return { ...state, resultsLoading: false, resultsError: action.payload };
    case 'UPDATE_TIMESTAMP':
      return { ...state, lastUpdated: action.payload };
    default:
      return state;
  }
};

// Utility functions
const calculateRiskScore = (
  poolsData: PoolData[],
  resultsData: ResultData[],
  config: RiskAssessmentConfig
): number => {
  let riskScore = config.baseRiskScore;
  
  const totalPools = poolsData.length;
  const totalInvestment = poolsData.reduce((sum, pool) => sum + pool.contribution_amount, 0);
  
  // Risk adjustments
  if (totalPools < 3) riskScore += PERFORMANCE_CONFIG.riskAdjustments.fewPools;
  if (totalInvestment > config.highInvestmentThreshold) {
    riskScore += PERFORMANCE_CONFIG.riskAdjustments.highInvestment;
  }
  if (totalPools >= config.minPoolsForLowRisk) {
    riskScore += PERFORMANCE_CONFIG.riskAdjustments.goodDiversification;
  }
  
  // Performance-based adjustments
  if (resultsData && resultsData.length > 0) {
    const totalPrizeValue = resultsData.reduce((sum, result) => sum + result.prize_value, 0);
    const totalInvested = resultsData.reduce((sum, result) => {
      return sum + result.participant.pool.contribution_amount;
    }, 0);
    
    if (totalInvested > 0) {
      const returnRate = ((totalPrizeValue - totalInvested) / totalInvested) * 100;
      if (returnRate > 0) riskScore += PERFORMANCE_CONFIG.riskAdjustments.positiveReturn;
      if (returnRate < -50) riskScore += PERFORMANCE_CONFIG.riskAdjustments.negativeReturn;
    }
  }
  
  return Math.max(0, Math.min(100, riskScore));
};

const calculatePerformanceMetrics = (
  poolsData: PoolData[],
  resultsData: ResultData[]
): PerformanceMetrics => {
  if (!poolsData || poolsData.length === 0) {
    return { consistency: 0, diversification: 0, efficiency: 0 };
  }
  
  // Diversification: based on number of pools and investment distribution
  const diversification = Math.min(100, (poolsData.length / 10) * 100);
  
  // Consistency: based on regular participation
  const activePools = poolsData.filter(p => p.status === 'ativo').length;
  const consistency = poolsData.length > 0 ? (activePools / poolsData.length) * 100 : 0;
  
  // Efficiency: based on return vs investment if results exist
  let efficiency = 50; // Default neutral efficiency
  if (resultsData && resultsData.length > 0) {
    const gamesWithPrize = resultsData.filter(result => result.prize_value > 0).length;
    efficiency = (gamesWithPrize / resultsData.length) * 100;
  }
  
  return {
    consistency: Math.round(consistency),
    diversification: Math.round(diversification),
    efficiency: Math.round(efficiency)
  };
};

const calculateInsights = (
  poolsData: PoolData[] | null,
  resultsData: ResultData[] | null
): Omit<PerformanceInsights, 'loading' | 'error' | 'lastUpdated'> => {
  if (!poolsData) {
    return {
      totalPools: 0,
      activePools: 0,
      totalInvestment: 0,
      winRate: 0,
      avgReturn: 0,
      riskScore: 0,
      riskLevel: 'Baixo',
      performanceMetrics: { consistency: 0, diversification: 0, efficiency: 0 }
    };
  }

  const totalPools = poolsData.length;
  const activePools = poolsData.filter(p => p.status === 'ativo').length;
  const totalInvestment = poolsData.reduce((sum, pool) => sum + pool.contribution_amount, 0);

  // Calculate real metrics based on results
  let winRate = 0;
  let avgReturn = 0;
  
  if (resultsData && resultsData.length > 0) {
    const totalPrizeValue = resultsData.reduce((sum, result) => sum + result.prize_value, 0);
    const totalInvested = resultsData.reduce((sum, result) => {
      return sum + result.participant.pool.contribution_amount;
    }, 0);
    
    // Calculate return rate
    if (totalInvested > 0) {
      avgReturn = ((totalPrizeValue - totalInvested) / totalInvested) * 100;
    }
    
    // Calculate win rate (games with prizes)
    const gamesWithPrize = resultsData.filter(result => result.prize_value > 0).length;
    winRate = (gamesWithPrize / resultsData.length) * 100;
  }

  // Calculate risk assessment
  const riskScore = calculateRiskScore(poolsData, resultsData || [], PERFORMANCE_CONFIG);
  const riskLevel: 'Baixo' | 'Médio' | 'Alto' = 
    riskScore > 70 ? 'Alto' : riskScore > 40 ? 'Médio' : 'Baixo';

  // Calculate performance metrics
  const performanceMetrics = calculatePerformanceMetrics(poolsData, resultsData || []);

  return {
    totalPools,
    activePools,
    totalInvestment,
    winRate: Math.round(winRate * 100) / 100,
    avgReturn: Math.round(avgReturn * 100) / 100,
    riskScore,
    riskLevel,
    performanceMetrics
  };
};

export function useUserPerformanceInsights(userId: string): PerformanceInsights {
  const [state, dispatch] = useReducer(insightsReducer, initialState);

  // Memoized fetch functions
  const fetchPoolsData = useCallback(async (signal: AbortSignal): Promise<PoolData[]> => {
    if (!userId) {
      throw new PerformanceInsightsError('ID do usuário é obrigatório', 'MISSING_USER_ID');
    }

    try {
      const { data, error } = await supabase
        .from('pools')
        .select(`
          id,
          status,
          contribution_amount,
          created_at,
          participants!inner(user_id, status)
        `)
        .or(`admin_id.eq.${userId},participants.user_id.eq.${userId}`)
        .abortSignal(signal);

      if (error) {
        throw new PerformanceInsightsError(
          `Erro ao buscar pools: ${error.message}`,
          'SUPABASE_POOLS_ERROR'
        );
      }

      // Validate and filter data
      return (data || []).filter((pool): pool is PoolData => {
        return pool && 
               typeof pool.contribution_amount === 'number' &&
               Array.isArray(pool.participants);
      });
    } catch (err) {
      if (err instanceof PerformanceInsightsError) {
        throw err;
      }
      throw new PerformanceInsightsError(
        err instanceof Error ? err.message : 'Erro desconhecido ao buscar pools',
        'UNKNOWN_POOLS_ERROR'
      );
    }
  }, [userId]);

  const fetchResultsData = useCallback(async (signal: AbortSignal): Promise<ResultData[]> => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('participant_draw_scores')
        .select(`
          points_earned,
          prize_value,
          total_hits,
          participant:participants!inner(
            user_id,
            pool:pools!inner(contribution_amount)
          )
        `)
        .eq('participant.user_id', userId)
        .abortSignal(signal);

      if (error) {
        // Results may not exist yet, so we don't throw for this
        console.warn('Não foi possível buscar resultados:', error.message);
        return [];
      }

      // Validate and filter data
      return (data || []).filter((result): result is ResultData => {
        return result && 
               typeof result.prize_value === 'number' &&
               result.participant &&
               result.participant.pool &&
               typeof result.participant.pool.contribution_amount === 'number';
      });
    } catch (err) {
      // Non-critical error, return empty array
      console.warn('Erro ao buscar resultados:', err);
      return [];
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const abortController = new AbortController();

    const loadData = async () => {
      try {
        // Load pools data
        dispatch({ type: 'POOLS_LOADING_START' });
        const poolsData = await fetchPoolsData(abortController.signal);
        
        if (!abortController.signal.aborted) {
          dispatch({ type: 'POOLS_LOADING_SUCCESS', payload: poolsData });
        }

        // Load results data (non-blocking)
        dispatch({ type: 'RESULTS_LOADING_START' });
        const resultsData = await fetchResultsData(abortController.signal);
        
        if (!abortController.signal.aborted) {
          dispatch({ type: 'RESULTS_LOADING_SUCCESS', payload: resultsData });
          dispatch({ type: 'UPDATE_TIMESTAMP', payload: new Date().toISOString() });
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          const error = err instanceof Error ? err.message : 'Erro desconhecido';
          dispatch({ type: 'POOLS_LOADING_ERROR', payload: error });
        }
      }
    };

    loadData();

    return () => {
      abortController.abort();
    };
  }, [userId, fetchPoolsData, fetchResultsData]);

  // Memoized insights calculation
  const insights = useMemo(() => {
    return calculateInsights(state.poolsData, state.resultsData);
  }, [state.poolsData, state.resultsData]);

  return {
    ...insights,
    lastUpdated: state.lastUpdated,
    loading: state.poolsLoading || state.resultsLoading,
    error: state.poolsError || state.resultsError
  };
}