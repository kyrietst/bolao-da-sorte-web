import { useReducer } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Pool, Ticket, LotteryType } from '@/types';
import { fetchLatestLotteryResult, convertApiResponseToLotteryResult } from '@/services/lotteryApi';

// Interfaces
export interface TicketResult {
  ticket: Ticket;
  hits: number;
  matchedNumbers: number[];
  prizeValue: number;
}

export interface ResultStats {
  maxHits: number;
  prizeWinners: number;
  totalPrize: number;
  drawNumbers: number[];
  drawNumber: string;
}

// Reducer State and Actions
interface State {
  loading: boolean;
  results: TicketResult[];
  stats: ResultStats | null;
  error: string | null;
}

type Action =
  | { type: 'CHECK_START' }
  | { type: 'CHECK_SUCCESS'; payload: { results: TicketResult[]; stats: ResultStats } }
  | { type: 'CHECK_ERROR'; payload: string };

const initialState: State = {
  loading: false,
  results: [],
  stats: null,
  error: null,
};

const resultsReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'CHECK_START':
      return { ...initialState, loading: true };
    case 'CHECK_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        results: action.payload.results,
        stats: action.payload.stats,
      };
    case 'CHECK_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

// Custom Hook
export const usePoolResults = (pool: Pool | null, tickets: Ticket[]) => {
  const [state, dispatch] = useReducer(resultsReducer, initialState);
  const { toast } = useToast();

  const checkResults = async () => {
    if (!pool) {
        toast({ title: "Erro", description: "Dados do bolão não carregados.", variant: "destructive" });
        return;
    }
    if (tickets.length === 0) {
      toast({
        title: "Nenhum bilhete encontrado",
        description: "Este bolão não possui bilhetes cadastrados para verificar.",
        variant: "destructive",
      });
      return;
    }

    dispatch({ type: 'CHECK_START' });
    try {
      const apiResponse = await fetchLatestLotteryResult(pool.lotteryType as LotteryType);
      const lotteryResult = convertApiResponseToLotteryResult(apiResponse);

      const ticketResults: TicketResult[] = tickets.map(ticket => {
        const matchedNumbers = ticket.numbers.filter(num =>
          lotteryResult.numbers.includes(num)
        );
        const hits = matchedNumbers.length;

        let prizeValue = 0;
        if (pool.lotteryType === 'megasena') {
          if (hits === 6) prizeValue = 50000000;
          else if (hits === 5) prizeValue = 50000;
          else if (hits === 4) prizeValue = 1000;
        } else if (pool.lotteryType === 'lotofacil') {
          if (hits === 15) prizeValue = 1500000;
          else if (hits === 14) prizeValue = 1500;
          else if (hits === 13) prizeValue = 25;
          else if (hits === 12) prizeValue = 10;
          else if (hits === 11) prizeValue = 5;
        }

        return {
          ticket,
          hits,
          matchedNumbers,
          prizeValue
        };
      });

      const maxHits = Math.max(...ticketResults.map(r => r.hits));
      const prizeWinners = ticketResults.filter(r => r.prizeValue > 0).length;
      const totalPrize = ticketResults.reduce((sum, r) => sum + r.prizeValue, 0);

      const stats: ResultStats = {
        maxHits,
        prizeWinners,
        totalPrize,
        drawNumbers: lotteryResult.numbers,
        drawNumber: lotteryResult.drawNumber
      };

      dispatch({ type: 'CHECK_SUCCESS', payload: { results: ticketResults, stats } });

      toast({
        title: "Resultados verificados!",
        description: `${ticketResults.length} bilhetes verificados contra o concurso ${lotteryResult.drawNumber}`,
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado ao verificar os resultados.";
      dispatch({ type: 'CHECK_ERROR', payload: errorMessage });
      toast({
        title: "Erro ao verificar resultados",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return { ...state, checkResults };
};
