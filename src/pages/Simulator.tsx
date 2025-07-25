import { useState, useMemo } from 'react';
import MainLayout from '@/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Play, 
  RotateCcw, 
  Save, 
  Download,
  TrendingUp,
  DollarSign,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { LotteryType } from '@/types';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SimulationConfig {
  lottery: LotteryType;
  numbers: number[];
  investment: number;
  simulations: number;
}

interface SimulationResult {
  hits: number;
  prize: number;
  probability: string;
  occurrences: number;
  percentage: number;
}

interface DetailedResult {
  totalInvestment: number;
  totalPrize: number;
  netResult: number;
  roi: number;
  results: SimulationResult[];
  bestCase: SimulationResult;
  worstCase: SimulationResult;
  averagePrize: number;
}

const lotteryNames: Record<LotteryType, string> = {
  megasena: 'Mega-Sena',
};

const lotteryConfigs = {
  megasena: { min: 1, max: 60, picks: 6, maxPicks: 15 },
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

const generateRandomNumbers = (min: number, max: number, count: number): number[] => {
  const numbers = [];
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.sort((a, b) => a - b);
};

// Simulação avançada
const runAdvancedSimulation = (config: SimulationConfig): DetailedResult => {
  const { lottery, numbers, investment, simulations } = config;
  const prizeTable: Record<LotteryType, Record<number, number>> = {
    megasena: { 6: 50000000, 5: 50000, 4: 1000 },
  };

  const config_lottery = lotteryConfigs[lottery];
  const prizes = prizeTable[lottery];
  const results: SimulationResult[] = [];
  let totalPrize = 0;

  // Contadores para cada resultado
  const hitCounts: Record<number, number> = {};

  for (let i = 0; i < simulations; i++) {
    const drawnNumbers = generateRandomNumbers(config_lottery.min, config_lottery.max, config_lottery.picks);
    const hits = numbers.filter(num => drawnNumbers.includes(num)).length;
    
    hitCounts[hits] = (hitCounts[hits] || 0) + 1;
    
    if (prizes[hits]) {
      totalPrize += prizes[hits];
    }
  }

  // Processar resultados
  Object.entries(hitCounts).forEach(([hits, count]) => {
    const hitsNum = parseInt(hits);
    const prize = prizes[hitsNum] || 0;
    const percentage = (count / simulations) * 100;
    
    results.push({
      hits: hitsNum,
      prize,
      probability: `1 em ${Math.round(simulations / count)}`,
      occurrences: count,
      percentage
    });
  });

  results.sort((a, b) => b.hits - a.hits);

  const totalInvestment = investment * simulations;
  const netResult = totalPrize - totalInvestment;
  const roi = ((totalPrize - totalInvestment) / totalInvestment) * 100;
  const averagePrize = totalPrize / simulations;

  const bestCase = results.find(r => r.prize > 0) || results[0];
  const worstCase = results[results.length - 1];

  return {
    totalInvestment,
    totalPrize,
    netResult,
    roi,
    results: results.filter(r => r.occurrences > 0),
    bestCase,
    worstCase,
    averagePrize
  };
};

export default function Simulator() {
  const [config, setConfig] = useState<SimulationConfig>({
    lottery: 'megasena',
    numbers: [],
    investment: 5,
    simulations: 1000
  });
  
  const [result, setResult] = useState<DetailedResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [savedSims, setSavedSims] = useState<SimulationConfig[]>([]);

  const lotteryConfig = lotteryConfigs[config.lottery];

  const handleNumberSelect = (number: number) => {
    if (config.numbers.includes(number)) {
      setConfig(prev => ({
        ...prev,
        numbers: prev.numbers.filter(n => n !== number)
      }));
    } else if (config.numbers.length < lotteryConfig.maxPicks) {
      setConfig(prev => ({
        ...prev,
        numbers: [...prev.numbers, number].sort((a, b) => a - b)
      }));
    }
  };

  const generateRandomGame = () => {
    const numbers = generateRandomNumbers(lotteryConfig.min, lotteryConfig.max, lotteryConfig.picks);
    setConfig(prev => ({ ...prev, numbers }));
  };

  const runSimulation = async () => {
    if (config.numbers.length < lotteryConfig.picks) {
      toast.error(`Selecione pelo menos ${lotteryConfig.picks} números`);
      return;
    }

    setIsSimulating(true);
    
    // Simular delay para efeito visual
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const simulationResult = runAdvancedSimulation(config);
    setResult(simulationResult);
    setIsSimulating(false);
    
    toast.success(`Simulação concluída! ${config.simulations} jogos analisados.`);
  };

  const saveSimulation = () => {
    if (config.numbers.length >= lotteryConfig.picks) {
      setSavedSims(prev => [...prev, { ...config }]);
      toast.success('Simulação salva!');
    }
  };

  const exportResults = () => {
    if (!result) return;

    const content = `Simulação - ${lotteryNames[config.lottery]}
Gerado em: ${new Date().toLocaleDateString('pt-BR')}

CONFIGURAÇÃO:
- Loteria: ${lotteryNames[config.lottery]}
- Números: ${config.numbers.map(n => n.toString().padStart(2, '0')).join(' - ')}
- Investimento por jogo: ${formatCurrency(config.investment)}
- Total de simulações: ${config.simulations.toLocaleString('pt-BR')}

RESULTADO GERAL:
- Investimento total: ${formatCurrency(result.totalInvestment)}
- Prêmios obtidos: ${formatCurrency(result.totalPrize)}
- Resultado líquido: ${formatCurrency(result.netResult)}
- ROI: ${result.roi.toFixed(2)}%
- Prêmio médio: ${formatCurrency(result.averagePrize)}

DETALHAMENTO POR ACERTOS:
${result.results.map(r => 
  `${r.hits} acertos: ${r.occurrences} vezes (${r.percentage.toFixed(2)}%) - Prêmio: ${formatCurrency(r.prize)}`
).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacao-${config.lottery}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetSimulation = () => {
    setConfig(prev => ({ ...prev, numbers: [] }));
    setResult(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Simulador de Jogos</h1>
            <p className="text-muted-foreground">
              Teste diferentes estratégias e analise suas chances de ganhar
            </p>
          </div>
          {result && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportResults} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button variant="outline" onClick={resetSimulation} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuração da Simulação */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-purple-500" />
                  Configuração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seleção de Loteria */}
                <div className="space-y-2">
                  <Label>Loteria</Label>
                  <Select 
                    value={config.lottery} 
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      lottery: value as LotteryType, 
                      numbers: [] 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(lotteryNames).map(([key, name]) => (
                        <SelectItem key={key} value={key}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Investimento */}
                <div className="space-y-2">
                  <Label>Investimento por jogo (R$)</Label>
                  <Input
                    type="number"
                    value={config.investment}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      investment: Number(e.target.value) 
                    }))}
                    min="1"
                    step="0.50"
                  />
                </div>

                {/* Número de simulações */}
                <div className="space-y-2">
                  <Label>Número de simulações</Label>
                  <Select 
                    value={config.simulations.toString()} 
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      simulations: Number(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 simulações</SelectItem>
                      <SelectItem value="1000">1.000 simulações</SelectItem>
                      <SelectItem value="10000">10.000 simulações</SelectItem>
                      <SelectItem value="100000">100.000 simulações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Informações do jogo */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Escolher</p>
                    <p className="text-sm font-semibold">{lotteryConfig.picks}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Selecionados</p>
                    <p className="text-sm font-semibold">
                      {config.numbers.length}/{lotteryConfig.picks}
                    </p>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={generateRandomGame}
                    className="w-full gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Surpresinha
                  </Button>
                  
                  <Button 
                    onClick={runSimulation}
                    disabled={config.numbers.length < lotteryConfig.picks || isSimulating}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isSimulating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Simulando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Simular
                      </>
                    )}
                  </Button>

                  {config.numbers.length >= lotteryConfig.picks && (
                    <Button 
                      variant="outline"
                      onClick={saveSimulation}
                      className="w-full gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Simulações Salvas */}
            {savedSims.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Simulações Salvas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {savedSims.slice(-3).map((sim, index) => (
                      <div 
                        key={index}
                        className="p-2 border rounded cursor-pointer hover:bg-muted/50"
                        onClick={() => setConfig(sim)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {lotteryNames[sim.lottery]}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {sim.simulations}x
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {sim.numbers.slice(0, 6).map(n => n.toString().padStart(2, '0')).join('-')}
                          {sim.numbers.length > 6 && '...'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seleção de Números */}
            <Card>
              <CardHeader>
                <CardTitle>Selecione seus números</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Escolha {lotteryConfig.picks} números de {lotteryConfig.min} a {lotteryConfig.max}
                </p>
              </CardHeader>
              <CardContent>
                {/* Números selecionados */}
                {config.numbers.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-sm">Números selecionados:</Label>
                    <div className="mt-2">
                      <LotteryNumbers 
                        type={config.lottery}
                        numbers={config.numbers}
                        size="sm"
                      />
                    </div>
                  </div>
                )}

                {/* Grid de números */}
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: lotteryConfig.max - lotteryConfig.min + 1 }, (_, i) => {
                    const number = lotteryConfig.min + i;
                    const isSelected = config.numbers.includes(number);
                    return (
                      <Button
                        key={number}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 text-xs",
                          isSelected && "bg-blue-500 hover:bg-blue-600"
                        )}
                        onClick={() => handleNumberSelect(number)}
                      >
                        {number.toString().padStart(2, '0')}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Resultados */}
            {result && (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="detailed">Detalhado</TabsTrigger>
                  <TabsTrigger value="analysis">Análise</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Resumo dos Resultados */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <div className="text-lg font-bold">{formatCurrency(result.totalPrize)}</div>
                        <div className="text-xs text-muted-foreground">Total de Prêmios</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-lg font-bold">{formatCurrency(result.totalInvestment)}</div>
                        <div className="text-xs text-muted-foreground">Investimento Total</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        {result.netResult >= 0 ? (
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        ) : (
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-red-500 rotate-180" />
                        )}
                        <div className={cn(
                          "text-lg font-bold",
                          result.netResult >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(result.netResult)}
                        </div>
                        <div className="text-xs text-muted-foreground">Resultado Líquido</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                        <div className={cn(
                          "text-lg font-bold",
                          result.roi >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {result.roi.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">ROI</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Resultados por Acertos */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Resultados por Número de Acertos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.results.map((res) => (
                          <div key={res.hits} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={res.hits >= lotteryConfig.picks - 1 ? "default" : "outline"}
                                className="w-12 h-8 rounded-full flex items-center justify-center"
                              >
                                {res.hits}
                              </Badge>
                              <div>
                                <div className="font-medium">
                                  {res.hits} acerto{res.hits !== 1 ? 's' : ''}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {res.occurrences} vezes ({res.percentage.toFixed(2)}%)
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                {formatCurrency(res.prize)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {res.probability}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="detailed" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Análise Detalhada</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Melhor resultado obtido:</Label>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium">
                                {result.bestCase.hits} acertos - {formatCurrency(result.bestCase.prize)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Prêmio médio por jogo:</Label>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">
                                {formatCurrency(result.averagePrize)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Probabilidade de ganhar qualquer prêmio:</Label>
                        <div className="space-y-2">
                          {result.results.filter(r => r.prize > 0).map((res) => (
                            <div key={res.hits} className="flex items-center justify-between">
                              <span className="text-sm">
                                {res.hits} acerto{res.hits !== 1 ? 's' : ''}:
                              </span>
                              <div className="flex items-center gap-2">
                                <Progress value={res.percentage} className="w-24" />
                                <span className="text-sm font-medium w-16 text-right">
                                  {res.percentage.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Análise de Viabilidade</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {result.roi >= 0 ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            )}
                            <span className="font-medium">Viabilidade Financeira</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {result.roi >= 0 
                              ? "Esta estratégia mostrou resultado positivo na simulação."
                              : "Esta estratégia resultou em perda na simulação."}
                          </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-5 w-5 text-blue-500" />
                            <span className="font-medium">Probabilidade</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {result.results.filter(r => r.prize > 0).length > 0
                              ? `Você teve ${result.results.filter(r => r.prize > 0).reduce((acc, r) => acc + r.percentage, 0).toFixed(1)}% de chance de ganhar algum prêmio.`
                              : "Baixa probabilidade de ganhar prêmios com esta combinação."}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-yellow-800 mb-1">Aviso Importante</div>
                            <p className="text-sm text-yellow-700">
                              Esta simulação é baseada em probabilidades matemáticas e não garante resultados futuros. 
                              Jogue com responsabilidade e apenas invista o que pode perder.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}