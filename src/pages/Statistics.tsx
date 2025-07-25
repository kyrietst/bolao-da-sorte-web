import { useState, useMemo } from 'react';
import MainLayout from '@/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Zap, 
  Calendar,
  RefreshCw,
  Download
} from 'lucide-react';
import { LotteryType } from '@/types';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';

interface FrequencyData {
  number: number;
  count: number;
  percentage: number;
}

interface DelayData {
  number: number;
  delay: number;
  lastDraw: string;
}

interface HotColdData {
  hot: number[];
  cold: number[];
  neutral: number[];
}

const lotteryNames: Record<LotteryType, string> = {
  megasena: 'Mega-Sena',
};

const lotteryColors: Record<LotteryType, string> = {
  megasena: 'border-green-500',
};

// Mock data - em produção viria da API/banco
const generateMockData = (lottery: LotteryType) => {
  const configs = {
    megasena: { min: 1, max: 60, picks: 6 },
  };

  const config = configs[lottery];
  const frequency: FrequencyData[] = [];
  const delays: DelayData[] = [];

  // Gerar dados de frequência
  for (let i = config.min; i <= config.max; i++) {
    const count = Math.floor(Math.random() * 50) + 1;
    frequency.push({
      number: i,
      count,
      percentage: (count / 100) * 100
    });
  }

  // Gerar dados de atraso
  for (let i = config.min; i <= config.max; i++) {
    delays.push({
      number: i,
      delay: Math.floor(Math.random() * 20) + 1,
      lastDraw: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
    });
  }

  // Classificar números quentes/frios
  const sortedByFreq = [...frequency].sort((a, b) => b.count - a.count);
  const hot = sortedByFreq.slice(0, 10).map(item => item.number);
  const cold = sortedByFreq.slice(-10).map(item => item.number);
  const neutral = sortedByFreq.slice(10, -10).map(item => item.number);

  const hotCold: HotColdData = { hot, cold, neutral };

  return { frequency, delays, hotCold };
};

export default function Statistics() {
  const [selectedLottery, setSelectedLottery] = useState<LotteryType>('megasena');
  const [activeTab, setActiveTab] = useState('frequency');

  const data = useMemo(() => generateMockData(selectedLottery), [selectedLottery]);

  const topFrequent = data.frequency
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const leastFrequent = data.frequency
    .sort((a, b) => a.count - b.count)
    .slice(0, 10);

  const mostDelayed = data.delays
    .sort((a, b) => b.delay - a.delay)
    .slice(0, 10);

  const exportData = () => {
    const content = `Estatísticas - ${lotteryNames[selectedLottery]}
Gerado em: ${new Date().toLocaleDateString('pt-BR')}

=== NÚMEROS MAIS FREQUENTES ===
${topFrequent.map(item => `${item.number.toString().padStart(2, '0')}: ${item.count} vezes (${item.percentage.toFixed(1)}%)`).join('\n')}

=== NÚMEROS MENOS FREQUENTES ===
${leastFrequent.map(item => `${item.number.toString().padStart(2, '0')}: ${item.count} vezes (${item.percentage.toFixed(1)}%)`).join('\n')}

=== NÚMEROS COM MAIOR ATRASO ===
${mostDelayed.map(item => `${item.number.toString().padStart(2, '0')}: ${item.delay} sorteios (último: ${item.lastDraw})`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estatisticas-${selectedLottery}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Estatísticas das Loterias</h1>
            <p className="text-muted-foreground">
              Analise padrões, frequências e tendências dos sorteios
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Seletor de Loteria */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Analisar:</span>
              </div>
              <Select value={selectedLottery} onValueChange={(value) => setSelectedLottery(value as LotteryType)}>
                <SelectTrigger className="w-48">
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
              <div className="text-sm text-muted-foreground">
                Últimos 100 sorteios analisados
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Geral */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Mais Sorteado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{topFrequent[0]?.number.toString().padStart(2, '0')}</div>
                <div className="text-sm text-muted-foreground">
                  {topFrequent[0]?.count} vezes ({topFrequent[0]?.percentage.toFixed(1)}%)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Menos Sorteado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{leastFrequent[0]?.number.toString().padStart(2, '0')}</div>
                <div className="text-sm text-muted-foreground">
                  {leastFrequent[0]?.count} vezes ({leastFrequent[0]?.percentage.toFixed(1)}%)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Maior Atraso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{mostDelayed[0]?.number.toString().padStart(2, '0')}</div>
                <div className="text-sm text-muted-foreground">
                  {mostDelayed[0]?.delay} sorteios
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Números Quentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{data.hotCold.hot.length}</div>
                <div className="text-sm text-muted-foreground">
                  números em alta
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com Análises Detalhadas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="frequency">Frequência</TabsTrigger>
            <TabsTrigger value="delay">Atrasos</TabsTrigger>
            <TabsTrigger value="hotcold">Quentes/Frios</TabsTrigger>
            <TabsTrigger value="patterns">Padrões</TabsTrigger>
          </TabsList>

          {/* Aba Frequência */}
          <TabsContent value="frequency" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Mais Frequentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topFrequent.map((item, index) => (
                      <div key={item.number} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="font-mono text-lg font-bold">
                            {item.number.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={item.percentage} className="w-20" />
                          <span className="text-sm font-medium w-12 text-right">
                            {item.count}×
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    Menos Frequentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leastFrequent.map((item, index) => (
                      <div key={item.number} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="font-mono text-lg font-bold">
                            {item.number.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={item.percentage} className="w-20" />
                          <span className="text-sm font-medium w-12 text-right">
                            {item.count}×
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Atrasos */}
          <TabsContent value="delay" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Números com Maior Atraso
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Números que não saem há mais tempo
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {mostDelayed.map((item, index) => (
                    <div key={item.number} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <span className="font-mono text-lg font-bold">
                            {item.number.toString().padStart(2, '0')}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Último: {new Date(item.lastDraw).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">
                          {item.delay}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          sorteios
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Quentes/Frios */}
          <TabsContent value="hotcold" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-red-500" />
                    Números Quentes
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Saíram com mais frequência
                  </p>
                </CardHeader>
                <CardContent>
                  <LotteryNumbers 
                    type={selectedLottery}
                    numbers={data.hotCold.hot.slice(0, 15)}
                    size="sm"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Números Neutros
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Frequência média
                  </p>
                </CardHeader>
                <CardContent>
                  <LotteryNumbers 
                    type={selectedLottery}
                    numbers={data.hotCold.neutral.slice(0, 15)}
                    size="sm"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    Números Frios
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Saíram com menos frequência
                  </p>
                </CardHeader>
                <CardContent>
                  <LotteryNumbers 
                    type={selectedLottery}
                    numbers={data.hotCold.cold.slice(0, 15)}
                    size="sm"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Padrões */}
          <TabsContent value="patterns" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Padrões de Distribuição
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Números baixos (1-30)</span>
                      <Badge variant="outline">45%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Números altos (31-60)</span>
                      <Badge variant="outline">55%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Números pares</span>
                      <Badge variant="outline">52%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Números ímpares</span>
                      <Badge variant="outline">48%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    Tendências Temporais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Últimos 10 sorteios</span>
                      <Badge variant="outline">Estável</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Últimos 30 sorteios</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Crescente
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Último trimestre</span>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        Variável
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}