import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pool, Ticket, LotteryType } from '@/types';
import { fetchLotteryResultByDate, convertApiResponseToLotteryResult, testApiConnection } from '@/services/lotteryApi';
import { useToast } from '@/hooks/use-toast';
import DrawnNumbersDisplay from './DrawnNumbersDisplay';
import EmptyResultsState from './EmptyResultsState';
import CompactTicketResult from './CompactTicketResult';
import EnhancedResultsStats from './EnhancedResultsStats';
import { Filter, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

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
  isExactDateMatch: boolean;
  resultDate: string;
};

type PoolResultsProps = {
  pool: Pool;
  tickets: Ticket[];
};

export default function PoolResults({ pool, tickets }: PoolResultsProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TicketResult[]>([]);
  const [stats, setStats] = useState<ResultStats | null>(null);
  const [sortBy, setSortBy] = useState<'hits' | 'prize' | 'ticket'>('hits');
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
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
    setRetryCount(prev => prev + 1);
    
    try {
      console.log('=== INICIANDO VERIFICAÇÃO DE RESULTADOS ===');
      console.log('Pool:', { 
        name: pool.name, 
        drawDate: pool.drawDate, 
        lotteryType: pool.lotteryType,
        ticketsCount: tickets.length 
      });
      
      // Testar conectividade primeiro
      console.log('🧪 Testando conectividade...');
      const isConnected = await testApiConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (!isConnected) {
        throw new Error('Não foi possível conectar com o serviço da API. Verifique sua conexão com a internet.');
      }

      // Converter a data do bolão para o formato esperado pela API
      const poolDate = new Date(pool.drawDate);
      const targetDate = poolDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log(`📅 Data alvo formatada: ${targetDate}`);
      
      toast({
        title: "🔍 Consultando resultados...",
        description: `Buscando resultado para ${poolDate.toLocaleDateString('pt-BR')}`,
      });

      // Buscar resultado pela data específica
      const apiResponse = await fetchLotteryResultByDate(pool.lotteryType as LotteryType, targetDate);
      const lotteryResult = convertApiResponseToLotteryResult(apiResponse);
      
      // Verificar se as datas correspondem exatamente
      const poolDrawDate = new Date(pool.drawDate);
      const resultDrawDate = new Date(lotteryResult.drawDate);
      const isExactDateMatch = poolDrawDate.toDateString() === resultDrawDate.toDateString();
      
      console.log('📊 Comparação de datas:', {
        poolDate: poolDrawDate.toDateString(),
        resultDate: resultDrawDate.toDateString(),
        isExactMatch: isExactDateMatch
      });
      
      if (isExactDateMatch) {
        toast({
          title: "✅ Resultado encontrado!",
          description: `Concurso ${lotteryResult.drawNumber} de ${resultDrawDate.toLocaleDateString('pt-BR')} carregado com sucesso.`,
        });
      } else {
        toast({
          title: "⚠️ Usando resultado mais recente",
          description: `Resultado do concurso ${lotteryResult.drawNumber} de ${resultDrawDate.toLocaleDateString('pt-BR')} (bolão configurado para ${poolDrawDate.toLocaleDateString('pt-BR')}).`,
          variant: "default",
        });
      }

      // Verificar cada bilhete contra o resultado
      console.log('🎫 Iniciando verificação de bilhetes...');
      const ticketResults: TicketResult[] = tickets.map((ticket, index) => {
        console.log(`🔍 Verificando bilhete ${index + 1}/${tickets.length}: ${ticket.ticketNumber}`);
        
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

        const gameResults: GameResult[] = games.map((gameNumbers, gameIndex) => {
          const matchedNumbers = gameNumbers.filter(num => 
            lotteryResult.numbers.includes(num)
          );
          
          console.log(`  Volante ${gameIndex + 1}: ${gameNumbers.join(',')} → ${matchedNumbers.length} acertos`);
          
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
        drawNumber: lotteryResult.drawNumber,
        isExactDateMatch,
        resultDate: lotteryResult.drawDate
      });

      console.log('✅ Verificação concluída com sucesso!', {
        totalTickets: ticketResults.length,
        maxHits,
        prizeWinners,
        totalPrize
      });
      
      toast({
        title: "✅ Verificação concluída!",
        description: `${ticketResults.length} bilhetes verificados contra o concurso ${lotteryResult.drawNumber}`,
      });

    } catch (error: any) {
      console.error('=== ERRO NA VERIFICAÇÃO ===');
      console.error('Tipo do erro:', error.name);
      console.error('Mensagem:', error.message);
      console.error('Stack trace:', error.stack);
      
      setConnectionStatus('disconnected');
      
      let errorTitle = "Erro ao verificar resultados";
      let errorMessage = "Não foi possível obter os resultados da loteria.";
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Falha ao conectar') || error.message.includes('conectar com o serviço')) {
        errorTitle = "Erro de conexão";
        errorMessage = "Problemas de conectividade com o serviço de resultados. Verifique sua conexão e tente novamente.";
      } else if (error.message.includes('não encontrado') || error.message.includes('404')) {
        errorTitle = "Resultado não encontrado";
        errorMessage = `Resultado não encontrado para ${pool.lotteryType}. Verifique se o sorteio já ocorreu.`;
      } else if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        errorTitle = "Tempo esgotado";
        errorMessage = "A consulta demorou muito para responder. Tente novamente.";
      } else if (error.message.includes('JSON') || error.message.includes('parse')) {
        errorTitle = "Erro nos dados";
        errorMessage = "Resposta inválida do serviço. Tente novamente em alguns instantes.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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
            Verificação de bilhetes para o sorteio de {new Date(pool.drawDate).toLocaleDateString('pt-BR')}
          </p>
          <div className="flex items-center gap-4 mt-2">
            {retryCount > 0 && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-blue-600">
                  Tentativa {retryCount}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && <Wifi className="h-4 w-4 text-green-500" />}
              {connectionStatus === 'disconnected' && <WifiOff className="h-4 w-4 text-red-500" />}
              {connectionStatus === 'unknown' && <AlertCircle className="h-4 w-4 text-gray-500" />}
              <span className="text-xs text-muted-foreground">
                {connectionStatus === 'connected' && 'Conectado à API'}
                {connectionStatus === 'disconnected' && 'Desconectado'}
                {connectionStatus === 'unknown' && 'Status desconhecido'}
              </span>
            </div>
          </div>
        </div>
        <Button 
          onClick={checkResults} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Verificando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              {retryCount > 0 ? 'Tentar Novamente' : 'Verificar Resultados'}
            </div>
          )}
        </Button>
      </div>

      {stats && (
        <>
          <DrawnNumbersDisplay
            drawNumbers={stats.drawNumbers}
            drawNumber={stats.drawNumber}
            lotteryType={pool.lotteryType as LotteryType}
          />

          {!stats.isExactDateMatch && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <p className="text-sm text-orange-800">
                    <strong>Atenção:</strong> Este bolão foi configurado para o sorteio de {new Date(pool.drawDate).toLocaleDateString('pt-BR')}, 
                    mas o resultado exibido é do concurso {stats.drawNumber} de {new Date(stats.resultDate).toLocaleDateString('pt-BR')} 
                    (último resultado disponível).
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
                  lotteryColors={{
                    megasena: 'bg-lottery-megasena',
                    lotofacil: 'bg-lottery-lotofacil',
                    quina: 'bg-lottery-quina',
                    lotomania: 'bg-lottery-lotomania',
                    timemania: 'bg-lottery-timemania',
                    duplasena: 'bg-lottery-duplasena',
                  }}
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
