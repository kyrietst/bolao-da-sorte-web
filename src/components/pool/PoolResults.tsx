
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';
import { Pool, Ticket, LotteryType } from '@/types';
import { fetchLatestLotteryResult, convertApiResponseToLotteryResult } from '@/services/lotteryApi';
import { useToast } from '@/components/ui/use-toast';
import { Trophy, Target, Award } from 'lucide-react';

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

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
          {/* Números sorteados */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Números Sorteados - Concurso {stats.drawNumber}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LotteryNumbers 
                type={pool.lotteryType as LotteryType} 
                numbers={stats.drawNumbers} 
                size="md" 
              />
            </CardContent>
          </Card>

          {/* Estatísticas resumidas */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-900">{stats.maxHits}</div>
                <p className="text-sm text-blue-700">Maior Acerto</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <div className="text-2xl font-bold text-yellow-900">{stats.prizeWinners}</div>
                <p className="text-sm text-yellow-700">Bilhetes Premiados</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Award className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalPrize)}</div>
                <p className="text-sm text-green-700">Prêmio Total</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de bilhetes com resultados organizados por volantes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bilhetes Verificados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {results.map((result) => (
                <div key={result.ticket.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Bilhete {result.ticket.ticketNumber}</h4>
                      <Badge 
                        variant={result.totalHits >= 4 ? "default" : "secondary"}
                        className={result.totalHits >= 4 ? "bg-green-600" : ""}
                      >
                        {result.totalHits} {result.totalHits === 1 ? 'acerto total' : 'acertos totais'}
                      </Badge>
                      {result.prizeValue > 0 && (
                        <Badge className="bg-yellow-500">
                          {formatCurrency(result.prizeValue)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Volantes jogados:</h5>
                    <div className="space-y-4">
                      {result.gameResults.map((gameResult, gameIndex) => (
                        <div key={gameIndex} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              Volante {String(gameIndex + 1).padStart(2, '0')}
                            </span>
                            <Badge 
                              variant={gameResult.hits > 0 ? "default" : "secondary"} 
                              className={`text-xs ${gameResult.hits > 0 ? 'bg-green-600 text-white' : ''}`}
                            >
                              {gameResult.hits} {gameResult.hits === 1 ? 'acerto' : 'acertos'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {gameResult.gameNumbers.map((number, numberIndex) => {
                              const isWinning = gameResult.matchedNumbers.includes(number);
                              return (
                                <div
                                  key={numberIndex}
                                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                                    isWinning 
                                      ? 'bg-green-500 ring-2 ring-green-300' 
                                      : lotteryColors[pool.lotteryType as LotteryType]
                                  }`}
                                >
                                  {String(number).padStart(2, '0')}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {!stats && (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Verificar Resultados dos Bilhetes
            </h3>
            <p className="text-gray-600 mb-4">
              Clique em "Verificar Resultados" para conferir os bilhetes deste bolão 
              contra o último sorteio da {pool.lotteryType}.
            </p>
            <p className="text-sm text-gray-500">
              {tickets.length} {tickets.length === 1 ? 'bilhete cadastrado' : 'bilhetes cadastrados'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
