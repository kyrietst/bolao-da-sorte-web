
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pool, Ticket, LotteryType } from '@/types';
import { fetchLatestLotteryResult, convertApiResponseToLotteryResult } from '@/services/lotteryApi';
import { useToast } from '@/components/ui/use-toast';
import ResultsStats from './ResultsStats';
import DrawnNumbersDisplay from './DrawnNumbersDisplay';
import TicketResultDisplay from './TicketResultDisplay';
import EmptyResultsState from './EmptyResultsState';

type PoolResultsProps = {
  pool: Pool;
  tickets: Ticket[];
};

type GameResult = {
  gameNumbers: number[];
  hits: number;
  matchedNumbers: number[];
};

type TicketResult = {
  ticket: Ticket;
  totalHits: number;
  gameResults: GameResult[];
  prizeValue: number;
};

type ResultStats = {
  maxHits: number;
  prizeWinners: number;
  totalPrize: number;
  drawNumbers: number[];
  drawNumber: string;
};

export default function PoolResults({ pool, tickets }: PoolResultsProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TicketResult[]>([]);
  const [stats, setStats] = useState<ResultStats | null>(null);
  const { toast } = useToast();

  const checkResults = async () => {
    if (tickets.length === 0) {
      toast({
        title: "Nenhum bilhete encontrado",
        description: "Este bolão não possui bilhetes cadastrados para verificar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar o último resultado da loteria
      const apiResponse = await fetchLatestLotteryResult(pool.lotteryType as LotteryType);
      const lotteryResult = convertApiResponseToLotteryResult(apiResponse);
      
      // Verificar cada bilhete contra o resultado
      const ticketResults: TicketResult[] = tickets.map(ticket => {
        // Dividir os números do bilhete em volantes/jogos de 6 números
        const gamesPerTicket = 10;
        const numbersPerGame = 6;
        const games = [];
        const totalNumbers = ticket.numbers.length;
        const numbersUsed = Math.min(totalNumbers, gamesPerTicket * numbersPerGame);
        
        for (let i = 0; i < gamesPerTicket && i * numbersPerGame < numbersUsed; i++) {
          const gameNumbers = ticket.numbers.slice(
            i * numbersPerGame, 
            (i + 1) * numbersPerGame
          );
          if (gameNumbers.length === numbersPerGame) {
            games.push(gameNumbers.sort((a, b) => a - b));
          }
        }

        // Verificar acertos para cada volante/jogo
        const gameResults: GameResult[] = games.map(gameNumbers => {
          const matchedNumbers = gameNumbers.filter(num => 
            lotteryResult.numbers.includes(num)
          );
          return {
            gameNumbers,
            hits: matchedNumbers.length,
            matchedNumbers
          };
        });

        const totalHits = gameResults.reduce((sum, game) => sum + game.hits, 0);
        
        // Calcular prêmio baseado nos acertos totais (simulado)
        let prizeValue = 0;
        if (pool.lotteryType === 'megasena') {
          const maxGameHits = Math.max(...gameResults.map(g => g.hits), 0);
          if (maxGameHits === 6) prizeValue = 50000000;
          else if (maxGameHits === 5) prizeValue = 50000;
          else if (maxGameHits === 4) prizeValue = 1000;
        } else if (pool.lotteryType === 'lotofacil') {
          if (totalHits >= 15) prizeValue = 1500000;
          else if (totalHits >= 14) prizeValue = 1500;
          else if (totalHits >= 13) prizeValue = 25;
          else if (totalHits >= 12) prizeValue = 10;
          else if (totalHits >= 11) prizeValue = 5;
        }

        return {
          ticket,
          totalHits,
          gameResults,
          prizeValue
        };
      });

      // Calcular estatísticas
      const maxHits = Math.max(...ticketResults.map(r => r.totalHits));
      const prizeWinners = ticketResults.filter(r => r.prizeValue > 0).length;
      const totalPrize = ticketResults.reduce((sum, r) => sum + r.prizeValue, 0);

      setResults(ticketResults);
      setStats({
        maxHits,
        prizeWinners,
        totalPrize,
        drawNumbers: lotteryResult.numbers,
        drawNumber: lotteryResult.drawNumber
      });

      toast({
        title: "Resultados verificados!",
        description: `${ticketResults.length} bilhetes verificados contra o concurso ${lotteryResult.drawNumber}`,
      });

    } catch (error: any) {
      toast({
        title: "Erro ao verificar resultados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const lotteryColors = {
    megasena: 'bg-lottery-megasena',
    lotofacil: 'bg-lottery-lotofacil',
    quina: 'bg-lottery-quina',
    lotomania: 'bg-lottery-lotomania',
    timemania: 'bg-lottery-timemania',
    duplasena: 'bg-lottery-duplasena',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resultados - {pool.name}</h3>
        <Button 
          onClick={checkResults} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Verificando...' : 'Verificar Resultados'}
        </Button>
      </div>

      {stats && (
        <>
          <DrawnNumbersDisplay
            drawNumbers={stats.drawNumbers}
            drawNumber={stats.drawNumber}
            lotteryType={pool.lotteryType as LotteryType}
          />

          <ResultsStats
            maxHits={stats.maxHits}
            prizeWinners={stats.prizeWinners}
            totalPrize={stats.totalPrize}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bilhetes Verificados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {results.map((result) => (
                <TicketResultDisplay
                  key={result.ticket.id}
                  result={result}
                  lotteryColors={lotteryColors}
                  lotteryType={pool.lotteryType}
                />
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {!stats && (
        <EmptyResultsState pool={pool} ticketsCount={tickets.length} />
      )}
    </div>
  );
}
