
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

type TicketResult = {
  ticket: Ticket;
  hits: number;
  matchedNumbers: number[];
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
        const matchedNumbers = ticket.numbers.filter(num => 
          lotteryResult.numbers.includes(num)
        );
        const hits = matchedNumbers.length;
        
        // Calcular prêmio baseado nos acertos (simulado)
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

      // Calcular estatísticas
      const maxHits = Math.max(...ticketResults.map(r => r.hits));
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

          {/* Lista de bilhetes com resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bilhetes Verificados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, index) => (
                <div key={result.ticket.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Bilhete {result.ticket.ticketNumber}</h4>
                      <Badge 
                        variant={result.hits >= 4 ? "default" : "secondary"}
                        className={result.hits >= 4 ? "bg-green-600" : ""}
                      >
                        {result.hits} {result.hits === 1 ? 'acerto' : 'acertos'}
                      </Badge>
                      {result.prizeValue > 0 && (
                        <Badge className="bg-yellow-500">
                          {formatCurrency(result.prizeValue)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Números jogados:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.ticket.numbers.map((num, idx) => (
                          <div
                            key={idx}
                            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              result.matchedNumbers.includes(num)
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {String(num).padStart(2, '0')}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {result.matchedNumbers.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Números acertados:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.matchedNumbers.map((num, idx) => (
                            <div
                              key={idx}
                              className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-medium"
                            >
                              {String(num).padStart(2, '0')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
