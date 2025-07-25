import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Target, 
  DollarSign,
  Calendar,
  Award,
  Users,
  Percent,
  BarChart3,
  PieChart,
  Calculator,
  Crown,
  Flame,
  Info
} from 'lucide-react';
import { Pool, Ticket } from '@/types';
import { DrawResult } from '@/hooks/useLotteryDrawResult';

interface PersonalSummaryTabProps {
  pool: Pool;
  tickets: Ticket[];
  drawResult: DrawResult | null;
  userParticipations?: number; // Quantos bolões o usuário já participou
  userWinHistory?: Array<{
    poolName: string;
    date: string;
    prize: number;
    hits: number;
  }>;
}

interface PersonalStats {
  totalInvested: number;
  totalGames: number;
  averagePerGame: number;
  contributionShare: number;
  expectedReturn: number;
  riskLevel: 'baixo' | 'médio' | 'alto';
  diversityScore: number;
}

export default function PersonalSummaryTab({ 
  pool, 
  tickets, 
  drawResult,
  userParticipations = 0,
  userWinHistory = []
}: PersonalSummaryTabProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('investment');

  // Calcular estatísticas pessoais
  const personalStats = useMemo((): PersonalStats => {
    const numbersPerGame = pool.lotteryType === 'megasena' ? 6 : 6;
    
    // Calcular total de jogos baseado nos tickets do usuário
    const totalGames = tickets.reduce((sum, ticket) => 
      sum + Math.floor(ticket.numbers.length / numbersPerGame), 0
    );
    
    // Investimento total baseado na contribuição do usuário no pool
    const totalInvested = pool.contributionAmount;
    
    // Custo por jogo individual
    const averagePerGame = totalGames > 0 ? totalInvested / totalGames : 0;
    
    // Calcular diversidade dos números escolhidos pelo usuário
    const allNumbers = new Set<number>();
    tickets.forEach(ticket => {
      ticket.numbers.forEach(num => allNumbers.add(num));
    });
    
    // Faixa de números baseada no tipo de loteria
    const maxPossibleNumbers = pool.lotteryType === 'megasena' ? 60 : 60;
    
    const diversityScore = allNumbers.size > 0 ? (allNumbers.size / maxPossibleNumbers) * 100 : 0;
    
    // Calcular nível de risco baseado na diversidade e distribuição
    let riskLevel: 'baixo' | 'médio' | 'alto' = 'médio';
    if (diversityScore > 50 && totalGames >= 5) riskLevel = 'baixo';
    else if (diversityScore < 25 || totalGames < 3) riskLevel = 'alto';
    
    // Calcular participação real no pool
    const contributionShare = totalGames > 0 ? (totalGames / (pool.numTickets * Math.floor(60 / numbersPerGame))) * 100 : 0;
    
    // Retorno esperado baseado em estatísticas reais das loterias brasileiras
    const lotteryReturnRates = {
      megasena: 0.46,
    };
    const returnRate = lotteryReturnRates[pool.lotteryType as keyof typeof lotteryReturnRates] || 0.43;
    const expectedReturn = totalInvested * returnRate;
    
    return {
      totalInvested,
      totalGames,
      averagePerGame,
      contributionShare: Math.min(contributionShare, 100), // Limitar a 100%
      expectedReturn,
      riskLevel,
      diversityScore: Math.round(diversityScore)
    };
  }, [pool, tickets]);

  // Analisar padrões de números
  const numberPatterns = useMemo(() => {
    const patterns = {
      consecutive: 0,
      evenOdd: { even: 0, odd: 0 },
      lowHigh: { low: 0, high: 0 },
      endings: {} as Record<number, number>
    };

    const numbersPerGame = pool.lotteryType === 'megasena' ? 6 : 6;
    const midPoint = pool.lotteryType === 'megasena' ? 30 : 12; // Ponto médio para baixo/alto
    
    tickets.forEach(ticket => {
      for (let i = 0; i < ticket.numbers.length; i += numbersPerGame) {
        const gameNumbers = ticket.numbers.slice(i, i + numbersPerGame);
        
        if (gameNumbers.length === numbersPerGame) {
          const sortedNumbers = [...gameNumbers].sort((a, b) => a - b);
          
          // Contar pares consecutivos
          for (let j = 0; j < sortedNumbers.length - 1; j++) {
            if (sortedNumbers[j + 1] === sortedNumbers[j] + 1) {
              patterns.consecutive++;
            }
          }
          
          // Analisar cada número do jogo
          gameNumbers.forEach(num => {
            // Par vs Ímpar
            if (num % 2 === 0) patterns.evenOdd.even++;
            else patterns.evenOdd.odd++;
            
            // Baixo vs Alto (baseado no tipo de loteria)
            if (num <= midPoint) patterns.lowHigh.low++;
            else patterns.lowHigh.high++;
            
            // Terminações
            const ending = num % 10;
            patterns.endings[ending] = (patterns.endings[ending] || 0) + 1;
          });
        }
      }
    });

    return patterns;
  }, [tickets, pool.lotteryType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getConfidenceLevel = () => {
    const factors = [
      personalStats.diversityScore > 50 ? 1 : 0,
      personalStats.totalGames >= 5 ? 1 : 0,
      personalStats.riskLevel === 'baixo' ? 1 : personalStats.riskLevel === 'médio' ? 0.5 : 0,
      userParticipations > 3 ? 1 : 0
    ];
    
    const score = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    return Math.round(score * 100);
  };

  const confidenceLevel = getConfidenceLevel();

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-lg font-bold">{formatCurrency(personalStats.totalInvested)}</div>
            <div className="text-xs text-muted-foreground">Investimento</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calculator className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-lg font-bold">{personalStats.totalGames}</div>
            <div className="text-xs text-muted-foreground">Jogos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-lg font-bold">{personalStats.diversityScore}%</div>
            <div className="text-xs text-muted-foreground">Diversidade</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-lg font-bold">{confidenceLevel}%</div>
            <div className="text-xs text-muted-foreground">Confiança</div>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Risco e Retorno */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análise de Investimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Custo por jogo:</span>
                <span className="font-medium">{formatCurrency(personalStats.averagePerGame)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Participação no bolão:</span>
                <span className="font-medium">{personalStats.contributionShare.toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Retorno esperado:</span>
                <span className="font-medium text-green-600">{formatCurrency(personalStats.expectedReturn)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Nível de risco:</span>
                <Badge 
                  variant={
                    personalStats.riskLevel === 'baixo' ? 'default' : 
                    personalStats.riskLevel === 'médio' ? 'secondary' : 'destructive'
                  }
                >
                  {personalStats.riskLevel.charAt(0).toUpperCase() + personalStats.riskLevel.slice(1)}
                </Badge>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Valores baseados em análise estatística histórica das loterias brasileiras.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Padrões dos Números
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Par vs Ímpar</span>
                  <span className="text-xs text-muted-foreground">
                    {numberPatterns.evenOdd.even + numberPatterns.evenOdd.odd > 0 
                      ? Math.round((numberPatterns.evenOdd.even / (numberPatterns.evenOdd.even + numberPatterns.evenOdd.odd)) * 100)
                      : 0}% pares
                  </span>
                </div>
                <Progress 
                  value={numberPatterns.evenOdd.even + numberPatterns.evenOdd.odd > 0 
                    ? (numberPatterns.evenOdd.even / (numberPatterns.evenOdd.even + numberPatterns.evenOdd.odd)) * 100 
                    : 0} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">
                    Baixo vs Alto ({pool.lotteryType === 'megasena' ? '1-30 / 31-60' : '1-12 / 13-25'})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {numberPatterns.lowHigh.low + numberPatterns.lowHigh.high > 0 
                      ? Math.round((numberPatterns.lowHigh.low / (numberPatterns.lowHigh.low + numberPatterns.lowHigh.high)) * 100)
                      : 0}% baixos
                  </span>
                </div>
                <Progress 
                  value={numberPatterns.lowHigh.low + numberPatterns.lowHigh.high > 0 
                    ? (numberPatterns.lowHigh.low / (numberPatterns.lowHigh.low + numberPatterns.lowHigh.high)) * 100 
                    : 0} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Números consecutivos</span>
                  <span className="text-xs text-muted-foreground">
                    {numberPatterns.consecutive} ocorrências
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-2">Terminações mais usadas:</h4>
              <div className="flex flex-wrap gap-1">
                {Object.entries(numberPatterns.endings)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([ending, count]) => (
                    <Badge key={ending} variant="outline" className="text-xs">
                      {ending}: {count}x
                    </Badge>
                  ))
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Performance */}
      {userWinHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Histórico de Ganhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userWinHistory.slice(0, 5).map((win, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <div className="font-medium text-sm">{win.poolName}</div>
                    <div className="text-xs text-muted-foreground">
                      {win.hits} acertos • {new Date(win.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-green-600">
                    {formatCurrency(win.prize)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Recomendações Personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {personalStats.diversityScore < 40 && (
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <strong>Diversifique mais:</strong> Seus números cobrem apenas {personalStats.diversityScore}% do volante. 
                  Considere escolher números de faixas diferentes.
                </AlertDescription>
              </Alert>
            )}
            
            {personalStats.totalGames < 5 && (
              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertDescription>
                  <strong>Aumente suas chances:</strong> Com apenas {personalStats.totalGames} jogos, 
                  considere investir um pouco mais para ter mais combinações.
                </AlertDescription>
              </Alert>
            )}
            
            {numberPatterns.consecutive === 0 && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Experimente sequências:</strong> Números consecutivos aparecem em ~70% dos sorteios. 
                  Considere incluir pelo menos um par consecutivo.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}