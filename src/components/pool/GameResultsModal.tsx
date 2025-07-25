import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Search, 
  Trophy, 
  Target, 
  DollarSign,
  TrendingUp,
  Calendar,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';
import { usePoolResults } from '@/hooks/usePoolResults';
import { Pool, Ticket } from '@/types';
import { DrawResult } from '@/hooks/useLotteryDrawResult';
import VolanteAnalysisTab from './VolanteAnalysisTab';
import PersonalSummaryTab from './PersonalSummaryTab';

interface GameResultsModalProps {
  pool: Pool;
  tickets: Ticket[];
  drawResult: DrawResult | null;
  children: React.ReactNode;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

const getPrizeForHits = (lotteryType: string, hits: number, drawResult?: DrawResult | null): number => {
  // Usar dados reais da API quando disponível
  if (drawResult?.prizes && drawResult.prizes.length > 0) {
    const prizeInfo = drawResult.prizes.find(p => parseInt(p.hits) === hits);
    if (prizeInfo && prizeInfo.prize) {
      // Converter string para número (ex: "R$ 1.234,56" -> 1234.56)
      const prizeStr = prizeInfo.prize.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(prizeStr) || 0;
    }
  }
  
  // Retornar 0 se não houver dados reais de prêmio
  return 0;
};

export default function GameResultsModal({ pool, tickets, drawResult, children }: GameResultsModalProps) {
  const [open, setOpen] = useState(false);
  const { loading, results, stats, error, checkResults } = usePoolResults(pool, tickets);

  const handleCheckGames = () => {
    checkResults();
  };

  const organizeVolantes = (tickets: Ticket[]) => {
    return tickets.map(ticket => {
      const jogos = [];
      const numbersPerJogo = pool.lotteryType === 'megasena' ? 6 : 15;
      const maxJogos = Math.floor(ticket.numbers.length / numbersPerJogo);
      
      for (let i = 0; i < maxJogos; i++) {
        const startIndex = i * numbersPerJogo;
        const endIndex = startIndex + numbersPerJogo;
        const gameNumbers = ticket.numbers.slice(startIndex, endIndex);
        
        if (gameNumbers.length === numbersPerJogo) {
          jogos.push({
            numero: i + 1,
            numbers: gameNumbers.sort((a, b) => a - b)
          });
        }
      }
      
      return {
        ticket,
        volante: ticket.ticketNumber,
        jogos
      };
    });
  };

  const checkGameResults = (gameNumbers: number[], drawnNumbers: number[]) => {
    const matches = gameNumbers.filter(num => drawnNumbers.includes(num));
    const hits = matches.length;
    const prize = getPrizeForHits(pool.lotteryType, hits, drawResult);
    
    return {
      hits,
      matches,
      prize,
      isWinner: prize > 0
    };
  };

  const volantes = organizeVolantes(tickets);
  const drawnNumbers = drawResult?.numbers || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            Conferir Meus Jogos - {pool.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="check" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="check">Conferir Jogos</TabsTrigger>
            <TabsTrigger value="analysis">Análise Inteligente</TabsTrigger>
            <TabsTrigger value="summary">Meu Dashboard</TabsTrigger>
          </TabsList>

          {/* Aba Conferir Jogos */}
          <TabsContent value="check" className="space-y-4">
            {/* Informações do Sorteio */}
            {drawResult && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Resultado do Sorteio - Concurso {drawResult.drawNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Números sorteados:</span>
                      <div className="mt-1">
                        <LotteryNumbers 
                          type={drawResult.lotteryType}
                          numbers={drawResult.numbers}
                          size="sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(drawResult.drawDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      <Badge variant={drawResult.accumulated ? "destructive" : "default"}>
                        {drawResult.accumulated ? 'Acumulou' : `${drawResult.winners} ganhador${drawResult.winners !== 1 ? 'es' : ''}`}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conferência por Volante */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Conferência por Volante</h3>
                <Button 
                  onClick={handleCheckGames} 
                  disabled={loading || !drawResult}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {loading ? 'Conferindo...' : 'Conferir Todos'}
                </Button>
              </div>

              {!drawResult && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Resultado do sorteio ainda não disponível. A conferência será feita automaticamente após o sorteio.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {volantes.map((volante, index) => (
                  <Card key={volante.ticket.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Volante {volante.volante}
                        </CardTitle>
                        <Badge variant="outline">
                          {volante.jogos.length} jogos
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {volante.jogos.map((jogo) => {
                        const resultado = drawnNumbers.length > 0 
                          ? checkGameResults(jogo.numbers, drawnNumbers)
                          : null;

                        return (
                          <div 
                            key={`volante-${volante.ticket.id}-jogo-${jogo.numero}`} 
                            className={`p-3 rounded-lg border ${
                              resultado?.isWinner 
                                ? 'bg-green-50 border-green-200' 
                                : resultado?.hits > 0 
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                Jogo {jogo.numero.toString().padStart(2, '0')}
                              </span>
                              {resultado && (
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={resultado.isWinner ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {resultado.hits} acerto{resultado.hits !== 1 ? 's' : ''}
                                  </Badge>
                                  {resultado.isWinner && (
                                    <Badge variant="default" className="bg-green-600 text-xs">
                                      {formatCurrency(resultado.prize)}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-1 flex-wrap">
                              {jogo.numbers.map((number, numberIndex) => {
                                const isMatch = resultado?.matches.includes(number);
                                return (
                                  <Badge 
                                    key={`jogo-${jogo.numero}-number-${numberIndex}-${number}`}
                                    variant={isMatch ? "default" : "secondary"}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                      isMatch 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    {number.toString().padStart(2, '0')}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Aba Análise Inteligente */}
          <TabsContent value="analysis" className="space-y-4">
            <VolanteAnalysisTab 
              tickets={tickets}
              lotteryType={pool.lotteryType}
            />
          </TabsContent>

          {/* Aba Meu Dashboard */}
          <TabsContent value="summary" className="space-y-4">
            <PersonalSummaryTab 
              pool={pool}
              tickets={tickets}
              drawResult={drawResult}
              userParticipations={5} // Exemplo - pode vir de props ou context
              userWinHistory={[
                // Exemplo - pode vir de uma API
                {
                  poolName: "Bolão dos Amigos - Dezembro",
                  date: "2024-12-15",
                  prize: 850.00,
                  hits: 4
                }
              ]}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}