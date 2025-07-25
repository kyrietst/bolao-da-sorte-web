import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LotteryType } from '@/types';

// Constants for configuration
const LOTTERY_CONFIG = {
  megasena: {
    numbersPerGame: 6,
    maxNumber: 60,
    minNumber: 1
  }
} as const;

const DEFAULT_CONFIG = {
  topCount: 6,
  bottomCount: 6,
  hotThreshold: 1.5,
  coldThreshold: 0.5
} as const;

// Custom error class for better error handling
class FrequencyAnalysisError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FrequencyAnalysisError';
  }
}

// Properly typed interfaces
interface TicketData {
  readonly numbers: number[];
  readonly pool: {
    readonly admin_id: string;
    readonly lottery_type: LotteryType;
    readonly participants: Array<{
      readonly user_id: string;
    }>;
  };
}

interface NumberFrequency {
  readonly number: number;
  readonly frequency: number;
  readonly percentage: number;
  readonly isHot: boolean;
  readonly isCold: boolean;
}

interface FrequencyAnalysisConfig {
  readonly lotteryType: LotteryType;
  readonly topCount: number;
  readonly bottomCount: number;
  readonly hotThreshold: number;
  readonly coldThreshold: number;
}

interface FrequencyAnalysis {
  readonly topNumbers: NumberFrequency[];
  readonly coldNumbers: NumberFrequency[];
  readonly totalGames: number;
  readonly totalNumbersTracked: number;
  readonly averageFrequency: number;
  readonly lastUpdated: string | null;
  readonly loading: boolean;
  readonly error: string | null;
}

// Utility functions
const validateNumber = (num: number, lotteryType: LotteryType): boolean => {
  const config = LOTTERY_CONFIG[lotteryType];
  return num >= config.minNumber && num <= config.maxNumber;
};

const validateGameNumbers = (numbers: number[], lotteryType: LotteryType): boolean => {
  const config = LOTTERY_CONFIG[lotteryType];
  return numbers.length === config.numbersPerGame && 
         numbers.every(num => validateNumber(num, lotteryType));
};

const calculateFrequencyAnalysis = (
  ticketsData: TicketData[],
  config: FrequencyAnalysisConfig
): Omit<FrequencyAnalysis, 'loading' | 'error' | 'lastUpdated'> => {
  if (!ticketsData || ticketsData.length === 0) {
    return {
      topNumbers: [],
      coldNumbers: [],
      totalGames: 0,
      totalNumbersTracked: 0,
      averageFrequency: 0
    };
  }

  // Use Map for better performance
  const numberCount = new Map<number, number>();
  let totalGames = 0;
  let validGames = 0;

  // Process all tickets
  ticketsData.forEach(ticket => {
    const numbersPerGame = LOTTERY_CONFIG[config.lotteryType].numbersPerGame;
    
    for (let i = 0; i < ticket.numbers.length; i += numbersPerGame) {
      const gameNumbers = ticket.numbers.slice(i, i + numbersPerGame);
      totalGames++;
      
      // Validate game numbers
      if (validateGameNumbers(gameNumbers, config.lotteryType)) {
        validGames++;
        gameNumbers.forEach(num => {
          numberCount.set(num, (numberCount.get(num) || 0) + 1);
        });
      }
    }
  });

  // If no valid games found
  if (validGames === 0 || numberCount.size === 0) {
    return {
      topNumbers: [],
      coldNumbers: [],
      totalGames,
      totalNumbersTracked: 0,
      averageFrequency: 0
    };
  }

  // Calculate statistics
  const totalFrequency = Array.from(numberCount.values()).reduce((sum, count) => sum + count, 0);
  const averageFrequency = totalFrequency / numberCount.size;

  // Create frequency analysis with percentages
  const frequencyData = Array.from(numberCount.entries()).map(([number, frequency]) => {
    const percentage = (frequency / validGames) * 100;
    
    return {
      number,
      frequency,
      percentage,
      isHot: frequency > averageFrequency * config.hotThreshold,
      isCold: frequency < averageFrequency * config.coldThreshold,
    } as const;
  }).sort((a, b) => b.frequency - a.frequency);

  return {
    topNumbers: frequencyData.slice(0, config.topCount),
    coldNumbers: frequencyData.slice(-config.bottomCount).reverse(),
    totalGames,
    totalNumbersTracked: numberCount.size,
    averageFrequency: Math.round(averageFrequency * 100) / 100
  };
};

export function useNumberFrequencyAnalysis(
  userId: string,
  config: Partial<FrequencyAnalysisConfig> = {}
): FrequencyAnalysis {
  // Merge with default config
  const analysisConfig: FrequencyAnalysisConfig = {
    lotteryType: 'megasena',
    ...DEFAULT_CONFIG,
    ...config
  };

  const [ticketsData, setTicketsData] = useState<TicketData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchData = useCallback(async (signal: AbortSignal) => {
    if (!userId) {
      throw new FrequencyAnalysisError('ID do usuário é obrigatório', 'MISSING_USER_ID');
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from('tickets')
        .select(`
          numbers,
          pool:pools!inner(
            admin_id,
            lottery_type,
            participants!inner(user_id)
          )
        `)
        .eq('pool.lottery_type', analysisConfig.lotteryType)
        .or(`pool.admin_id.eq.${userId},pool.participants.user_id.eq.${userId}`)
        .abortSignal(signal);

      if (supabaseError) {
        throw new FrequencyAnalysisError(
          `Erro ao buscar dados: ${supabaseError.message}`,
          'SUPABASE_ERROR'
        );
      }

      // Validate and filter data
      const validData = (data || []).filter((ticket): ticket is TicketData => {
        return Array.isArray(ticket.numbers) && 
               ticket.numbers.length > 0 &&
               ticket.pool &&
               ticket.pool.lottery_type === analysisConfig.lotteryType;
      });

      return validData;
    } catch (err) {
      if (err instanceof FrequencyAnalysisError) {
        throw err;
      }
      throw new FrequencyAnalysisError(
        err instanceof Error ? err.message : 'Erro desconhecido',
        'UNKNOWN_ERROR'
      );
    }
  }, [userId, analysisConfig.lotteryType]);

  useEffect(() => {
    if (!userId) return;

    const abortController = new AbortController();
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchData(abortController.signal);
        
        if (!abortController.signal.aborted) {
          setTicketsData(data);
          setLastUpdated(new Date().toISOString());
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
          setTicketsData(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Cleanup function to prevent memory leaks
    return () => {
      abortController.abort();
    };
  }, [userId, fetchData]);

  // Memoized analysis calculation
  const analysis = useMemo(() => {
    return calculateFrequencyAnalysis(ticketsData || [], analysisConfig);
  }, [ticketsData, analysisConfig]);

  return {
    ...analysis,
    lastUpdated,
    loading,
    error
  };
}