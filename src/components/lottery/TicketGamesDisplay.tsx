
import { Ticket, LotteryType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type TicketGamesDisplayProps = {
  ticket: Ticket;
  type: LotteryType;
  gamesPerTicket?: number;
  numbersPerGame?: number;
  showResults?: boolean;
  drawNumber?: string;
};

type GameResult = {
  gameIndex: number;
  hits: number;
  matchedNumbers: number[];
};

export default function TicketGamesDisplay({ 
  ticket, 
  type, 
  gamesPerTicket = 10, 
  numbersPerGame = 6,
  showResults = false,
  drawNumber
}: TicketGamesDisplayProps) {
  const [winningNumbers, setWinningNumbers] = useState<number[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [totalHits, setTotalHits] = useState(0);

  // Dividir os números do bilhete em jogos/volantes
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

  useEffect(() => {
    if (showResults && drawNumber) {
      fetchDrawResults();
    }
  }, [showResults, drawNumber, type]);

  const fetchDrawResults = async () => {
    try {
      const { data: result, error } = await supabase
        .from('lottery_results_cache')
        .select('response')
        .eq('lottery_type', type)
        .eq('draw_number', drawNumber)
        .single();

      if (error || !result) {
        console.error('Erro ao buscar resultado:', error);
        return;
      }

      const response = result.response as any;
      const numbers = response.dezenas?.map((num: string) => parseInt(num)) || [];
      setWinningNumbers(numbers);

      // Calcular acertos para cada jogo
      const results: GameResult[] = [];
      let totalGameHits = 0;

      games.forEach((gameNumbers, gameIndex) => {
        const matchedNumbers = gameNumbers.filter(num => numbers.includes(num));
        const hits = matchedNumbers.length;
        totalGameHits += hits;
        
        results.push({
          gameIndex,
          hits,
          matchedNumbers
        });
      });

      setGameResults(results);
      setTotalHits(totalGameHits);
    } catch (error) {
      console.error('Erro ao processar resultados:', error);
    }
  };

  const isNumberWinning = (number: number, gameIndex: number) => {
    if (!showResults) return false;
    const gameResult = gameResults.find(result => result.gameIndex === gameIndex);
    return gameResult?.matchedNumbers.includes(number) || false;
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Bilhete {ticket.ticketNumber}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {games.length} {games.length === 1 ? 'volante' : 'volantes'}
            </Badge>
            {showResults && totalHits > 0 && (
              <Badge className="text-xs bg-green-600 text-white">
                {totalHits} acertos totais
              </Badge>
            )}
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {games.map((gameNumbers, gameIndex) => {
          const gameResult = gameResults.find(result => result.gameIndex === gameIndex);
          const gameHits = gameResult?.hits || 0;
          
          return (
            <div key={gameIndex} className="flex items-center gap-3 py-2">
              <span className="text-sm font-mono text-gray-600 w-6">
                {String(gameIndex + 1).padStart(2, '0')}
              </span>
              <div className="flex gap-2">
                {gameNumbers.map((number, numberIndex) => {
                  const isWinning = isNumberWinning(number, gameIndex);
                  return (
                    <div
                      key={numberIndex}
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm',
                        isWinning 
                          ? 'bg-green-500 ring-2 ring-green-300' 
                          : lotteryColors[type]
                      )}
                    >
                      {String(number).padStart(2, '0')}
                    </div>
                  );
                })}
              </div>
              {showResults && gameHits > 0 && (
                <Badge variant="secondary" className="text-xs ml-2">
                  {gameHits}
                </Badge>
              )}
            </div>
          );
        })}
        
        {games.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Números insuficientes para formar volantes</p>
            <p className="text-xs">
              Este bilhete tem {ticket.numbers.length} números, 
              mas são necessários {gamesPerTicket * numbersPerGame} números 
              para {gamesPerTicket} volantes de {numbersPerGame} números cada.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
