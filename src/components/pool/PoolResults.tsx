
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pool, Ticket, LotteryType } from '@/types';
import { fetchLatestLotteryResult, convertApiResponseToLotteryResult } from '@/services/lotteryApi';
import { useToast } from '@/components/ui/use-toast';
import DrawnNumbersDisplay from './DrawnNumbersDisplay';
import EmptyResultsState from './EmptyResultsState';
import CompactTicketResult from './CompactTicketResult';
import EnhancedResultsStats from './EnhancedResultsStats';
import { Filter, SortDesc } from 'lucide-react';

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

type PoolResultsProps = {
  pool: Pool;
  tickets: Ticket[];
};

// Função para gerar números sorteados simulados
const generateMockDrawNumbers = (lotteryType: LotteryType): number[] => {
  const ranges = {
    megasena: { min: 1, max: 60, count: 6 },
    lotofacil: { min: 1, max: 25, count: 15 },
    quina: { min: 1, max: 80, count: 5 },
    lotomania: { min: 0, max: 99, count: 20 },
    timemania: { min: 1, max: 80, count: 10 },
    duplasena: { min: 1, max: 50, count: 6 }
  };

  const config = ranges[lotteryType];
  const numbers = new Set<number>();
  
  while (numbers.size < config.count) {
    const num = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    numbers.add(num);
  }
  
  return Array.from(numbers).sort((a, b) => a - b);
};

export default function PoolResults({ pool, tickets }: PoolResultsProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TicketResult[]>([]);
  const [stats, setStats] = useState<ResultStats | null>(null);
  const [sortBy, setSortBy] = useState<'hits' | 'prize' | 'ticket'>('hits');
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
      let lotteryResult;
      
      try {
        // Tentar buscar o resultado real da API
        const apiResponse = await fetchLatestLotteryResult(pool.lotteryType as LotteryType);
        lotteryResult = convertApiResponseToLotteryResult(apiResponse);
      } catch (apiError) {
        // Se a API falhar, usar dados simulados
        console.log('API indisponível, usando dados simulados:', apiError);
        
        lotteryResult = {
          numbers: generateMockDrawNumbers(pool.lotteryType as LotteryType),
          drawNumber: '2024-DEMO',
          date: new Date().toISOString()
        };

        toast({
          title: "Usando dados simulados",
          description: "A API da Caixa está indisponível. Usando números sorteados simulados para demonstração.",
          variant: "default",
        });
      }
      
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

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'hits':
        return b.totalHits - a.totalHits;
      case 'prize':
        return b.prizeValue - a.prizeValue;
      case 'ticket':
        return a.ticket.ticketNumber.localeCompare(b.ticket.ticketNumber);
      default:
        return 0;
    }
  });

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
        <div>
          <h3 className="text-xl font-bold">Resultados - {pool.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Verificação de bilhetes contra o último sorteio
          </p>
        </div>
        <Button 
          onClick={checkResults} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
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

          <EnhancedResultsStats
            maxHits={stats.maxHits}
            prizeWinners={stats.prizeWinners}
            totalPrize={stats.totalPrize}
            totalTickets={results.length}
          />

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Bilhetes Verificados</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'hits' | 'prize' | 'ticket')}
                    className="text-sm border rounded px-2 py-1 bg-white"
                  >
                    <option value="hits">Ordenar por Acertos</option>
                    <option value="prize">Ordenar por Prêmio</option>
                    <option value="ticket">Ordenar por Bilhete</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{results.length} bilhetes</Badge>
                <Badge variant="outline">{stats.prizeWinners} premiados</Badge>
                {stats.maxHits >= 4 && (
                  <Badge className="bg-green-600">
                    Melhor resultado: {stats.maxHits} acertos
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedResults.map((result) => (
                <CompactTicketResult
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
