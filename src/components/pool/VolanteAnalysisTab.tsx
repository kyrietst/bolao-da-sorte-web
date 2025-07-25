import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Heart,
  Star,
  Zap,
  Users,
  Calculator,
  PieChart,
  Award
} from 'lucide-react';
import { Ticket } from '@/types';

interface VolanteAnalysisTabProps {
  tickets: Ticket[];
  lotteryType: string;
}

interface NumberAnalysis {
  number: number;
  frequency: number;
  isFrequent: boolean;
  isRare: boolean;
  lastAppearance?: string;
}

interface GameStrategy {
  name: string;
  description: string;
  games: number[];
  confidence: 'alta' | 'média' | 'baixa';
  icon: React.ReactNode;
}

export default function VolanteAnalysisTab({ tickets, lotteryType }: VolanteAnalysisTabProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  
  // Analisar números mais e menos escolhidos
  const analyzeNumbers = (): NumberAnalysis[] => {
    const numberCount: Record<number, number> = {};
    
    tickets.forEach(ticket => {
      const numbersPerGame = lotteryType === 'megasena' ? 6 : 15;
      for (let i = 0; i < ticket.numbers.length; i += numbersPerGame) {
        const gameNumbers = ticket.numbers.slice(i, i + numbersPerGame);
        gameNumbers.forEach(num => {
          numberCount[num] = (numberCount[num] || 0) + 1;
        });
      }
    });

    const totalGames = Object.values(numberCount).reduce((sum, count) => sum + count, 0);
    const avgFrequency = totalGames / Object.keys(numberCount).length;

    return Object.entries(numberCount).map(([number, frequency]) => ({
      number: parseInt(number),
      frequency,
      isFrequent: frequency > avgFrequency * 1.5,
      isRare: frequency < avgFrequency * 0.5,
    })).sort((a, b) => b.frequency - a.frequency);
  };

  // Organizar jogos por estratégias
  const organizeByStrategy = (): GameStrategy[] => {
    const numbersPerGame = lotteryType === 'megasena' ? 6 : 15;
    const strategies: GameStrategy[] = [];
    let globalGameCounter = 1; // Contador global para todos os jogos
    
    tickets.forEach((ticket, ticketIndex) => {
      for (let i = 0; i < ticket.numbers.length; i += numbersPerGame) {
        const gameNumbers = ticket.numbers.slice(i, i + numbersPerGame);
        const currentGameNumber = globalGameCounter++;
        
        // Analisar padrão do jogo
        const sortedNumbers = [...gameNumbers].sort((a, b) => a - b);
        
        // Verificar números sequenciais (pelo menos 2 pares consecutivos)
        let consecutivePairs = 0;
        for (let j = 0; j < sortedNumbers.length - 1; j++) {
          if (sortedNumbers[j + 1] === sortedNumbers[j] + 1) {
            consecutivePairs++;
          }
        }
        const isSequential = consecutivePairs >= 2;
        
        // Verificar terminação 0 (pelo menos 1 número terminado em 0)
        const hasPattern = gameNumbers.filter(num => num % 10 === 0).length >= 1;
        
        // Verificar distribuição equilibrada (números bem distribuídos entre baixo/alto)
        const lowNumbers = gameNumbers.filter(num => num <= 30).length;
        const highNumbers = gameNumbers.filter(num => num > 30).length;
        const isBalanced = Math.abs(lowNumbers - highNumbers) <= 2; // Diferença máxima de 2
        
        if (isSequential) {
          const existing = strategies.find(s => s.name === 'Números Sequenciais');
          if (existing) {
            existing.games.push(currentGameNumber);
          } else {
            strategies.push({
              name: 'Números Sequenciais',
              description: 'Jogos com 2 ou mais pares de números consecutivos',
              games: [currentGameNumber],
              confidence: 'média',
              icon: <TrendingUp className="h-4 w-4" />
            });
          }
        }
        
        if (hasPattern) {
          const existing = strategies.find(s => s.name === 'Terminação 0');
          if (existing) {
            existing.games.push(currentGameNumber);
          } else {
            strategies.push({
              name: 'Terminação 0',
              description: 'Jogos com números terminados em 0',
              games: [currentGameNumber],
              confidence: 'baixa',
              icon: <Target className="h-4 w-4" />
            });
          }
        }
        
        if (isBalanced) {
          const existing = strategies.find(s => s.name === 'Distribuição Equilibrada');
          if (existing) {
            existing.games.push(currentGameNumber);
          } else {
            strategies.push({
              name: 'Distribuição Equilibrada',
              description: 'Números equilibrados entre baixo (1-30) e alto (31-60)',
              games: [currentGameNumber],
              confidence: 'alta',
              icon: <BarChart3 className="h-4 w-4" />
            });
          }
        }
      }
    });

    return strategies;
  };

  const numberAnalysis = analyzeNumbers();
  const strategies = organizeByStrategy();
  const totalGames = tickets.reduce((sum, ticket) => {
    const numbersPerGame = lotteryType === 'megasena' ? 6 : 15;
    return sum + Math.floor(ticket.numbers.length / numbersPerGame);
  }, 0);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Análise dos Números</TabsTrigger>
          <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          <TabsTrigger value="favorites">Meus Favoritos</TabsTrigger>
        </TabsList>

        {/* Aba Análise dos Números */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Calculator className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{totalGames}</div>
                <div className="text-xs text-muted-foreground">Total de Jogos</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <PieChart className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{numberAnalysis.filter(n => n.isFrequent).length}</div>
                <div className="text-xs text-muted-foreground">Números Frequentes</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{strategies.length}</div>
                <div className="text-xs text-muted-foreground">Estratégias Identificadas</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análise de Frequência dos Números</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Números Mais Escolhidos
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {numberAnalysis.filter(n => n.isFrequent).slice(0, 10).map(analysis => (
                      <div key={analysis.number} className="text-center">
                        <Badge className="bg-green-100 text-green-800 w-12 h-12 rounded-full flex items-center justify-center">
                          {analysis.number.toString().padStart(2, '0')}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {analysis.frequency}x
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    Números Raramente Escolhidos
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {numberAnalysis.filter(n => n.isRare).slice(0, 10).map(analysis => (
                      <div key={analysis.number} className="text-center">
                        <Badge className="bg-orange-100 text-orange-800 w-12 h-12 rounded-full flex items-center justify-center">
                          {analysis.number.toString().padStart(2, '0')}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {analysis.frequency}x
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Estratégias */}
        <TabsContent value="strategies" className="space-y-4">
          <div className="grid gap-4">
            {strategies.map((strategy, index) => (
              <Card key={`strategy-${strategy.name}-${index}`} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {strategy.icon}
                      <CardTitle className="text-base">{strategy.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          strategy.confidence === 'alta' ? 'default' : 
                          strategy.confidence === 'média' ? 'secondary' : 'outline'
                        }
                      >
                        Confiança {strategy.confidence}
                      </Badge>
                      <Badge variant="outline">
                        {strategy.games.length} jogos
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Jogos:</span>
                    <div className="flex flex-wrap gap-1">
                      {strategy.games.slice(0, 10).map((gameNum, gameIndex) => (
                        <Badge key={`${strategy.name}-game-${gameNum}-${gameIndex}`} variant="outline" className="text-xs">
                          {gameNum.toString().padStart(2, '0')}
                        </Badge>
                      ))}
                      {strategy.games.length > 10 && (
                        <Badge key={`${strategy.name}-more`} variant="outline" className="text-xs">
                          +{strategy.games.length - 10}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {strategies.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-medium mb-2">Nenhuma estratégia identificada</h3>
                  <p className="text-sm text-muted-foreground">
                    Seus jogos não seguem padrões específicos detectáveis.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Aba Favoritos */}
        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Marcar Jogos Favoritos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Marque seus jogos favoritos para acompanhar o desempenho especificamente.
              </p>
              <Button variant="outline" className="w-full">
                <Star className="h-4 w-4 mr-2" />
                Gerenciar Favoritos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}