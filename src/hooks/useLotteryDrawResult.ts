import { useState, useEffect } from 'react';
import { LotteryType } from '@/types';
import { fetchLatestLotteryResult, fetchLotteryResultByDate, convertApiResponseToLotteryResult } from '@/services/lotteryApi';

export interface DrawResult {
  id: string;
  lotteryType: LotteryType;
  drawNumber: string;
  drawDate: string;
  numbers: number[];
  winners: number;
  accumulated: boolean;
  prizes?: Array<{
    hits: string;
    winners: number;
    prize: string;
  }>;
}

export interface DrawStatus {
  hasOccurred: boolean;
  isPending: boolean;
  isToday: boolean;
  daysUntil: number;
  message: string;
}

interface UseLotteryDrawResultState {
  loading: boolean;
  result: DrawResult | null;
  status: DrawStatus;
  error: string | null;
}


export function useLotteryDrawResult(lotteryType: LotteryType, drawDate: string) {
  const [state, setState] = useState<UseLotteryDrawResultState>({
    loading: true,
    result: null,
    status: {
      hasOccurred: false,
      isPending: true,
      isToday: false,
      daysUntil: 0,
      message: 'Verificando status do sorteio...'
    },
    error: null
  });

  const calculateDrawStatus = (drawDate: string): DrawStatus => {
    const today = new Date();
    
    // CORREÇÃO: Timezone-safe date parsing
    const [year, month, day] = drawDate.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    
    // Normalizar para comparação apenas de data (sem hora)
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isToday = diffDays === 0;
    const hasOccurred = diffDays < 0;
    const isPending = diffDays > 0;
    
    let message = '';
    if (hasOccurred) {
      message = `Sorteio realizado há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`;
    } else if (isToday) {
      message = 'Sorteio acontece hoje';
    } else if (isPending) {
      message = `Sorteio em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    }
    
    return {
      hasOccurred,
      isPending,
      isToday,
      daysUntil: diffDays,
      message
    };
  };

  const fetchDrawResult = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const status = calculateDrawStatus(drawDate);
      
      if (status.hasOccurred || status.isToday) {
        // Tentar buscar o resultado específico para a data
        try {
          console.log(`🎯 Buscando resultado para data: ${drawDate}`);
          const apiResponse = await fetchLotteryResultByDate(lotteryType, drawDate);
          const result = convertApiResponseToLotteryResult(apiResponse, lotteryType);
          
          setState({
            loading: false,
            result,
            status: {
              ...status,
              message: status.hasOccurred 
                ? `Resultado do concurso ${result.drawNumber}` 
                : 'Resultado disponível'
            },
            error: null
          });
          
        } catch (error) {
          // Se não conseguir buscar o resultado específico, buscar o último disponível
          console.log('⚠️ Não foi possível buscar resultado específico, buscando último disponível...');
          
          const latestApiResponse = await fetchLatestLotteryResult(lotteryType);
          const latestResult = convertApiResponseToLotteryResult(latestApiResponse, lotteryType);
          
          setState({
            loading: false,
            result: latestResult,
            status: {
              ...status,
              message: `Último resultado disponível (Concurso ${latestResult.drawNumber})`
            },
            error: null
          });
        }
        
      } else {
        // Sorteio ainda não aconteceu - buscar último resultado para referência
        try {
          const latestApiResponse = await fetchLatestLotteryResult(lotteryType);
          const latestResult = convertApiResponseToLotteryResult(latestApiResponse, lotteryType);
          
          setState({
            loading: false,
            result: latestResult,
            status: {
              ...status,
              message: `${status.message}. Último resultado: Concurso ${latestResult.drawNumber}`
            },
            error: null
          });
          
        } catch (latestError) {
          // Mesmo o último resultado falhou - mostrar apenas status
          setState({
            loading: false,
            result: null,
            status,
            error: null
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar resultado da loteria:', error);
      
      const status = calculateDrawStatus(drawDate);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState({
        loading: false,
        result: null,
        status: {
          ...status,
          message: status.isPending 
            ? status.message 
            : 'Erro ao carregar resultado'
        },
        error: errorMessage
      });
    }
  };

  const retry = () => {
    fetchDrawResult();
  };

  useEffect(() => {
    if (lotteryType && drawDate) {
      fetchDrawResult();
    }
  }, [lotteryType, drawDate]);

  return {
    ...state,
    retry
  };
}