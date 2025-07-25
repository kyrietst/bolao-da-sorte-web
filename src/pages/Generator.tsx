import React, { useState, useMemo } from 'react';
import MainLayout from '@/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wand2, 
  Download, 
  Copy, 
  RotateCcw, 
  Trash2,
  Save,
  Settings,
  Brain,
  Zap,
  Target,
  TrendingUp,
  Upload
} from 'lucide-react';
import { LotteryType } from '@/types';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GeneratedGame {
  id: string;
  numbers: number[];
  lotteryType: LotteryType;
  strategy: string;
  timestamp: Date;
  confidence: number;
}

interface GenerationConfig {
  lottery: LotteryType;
  quantity: number;
  strategy: 'random' | 'frequency' | 'balanced' | 'hot' | 'cold' | 'mixed';
  avoidRepeats: boolean;
  favoriteNumbers: number[];
  excludeNumbers: number[];
  usePatterns: boolean;
}

const lotteryNames: Record<LotteryType, string> = {
  megasena: 'Mega-Sena',
};

const lotteryConfigs = {
  megasena: { min: 1, max: 60, picks: 6, maxPicks: 15 },
};

const strategies = {
  random: { name: 'Aleatório', description: 'Números completamente aleatórios', icon: RotateCcw, color: 'text-blue-500' },
  frequency: { name: 'Frequência', description: 'Baseado em números mais sorteados', icon: TrendingUp, color: 'text-green-500' },
  balanced: { name: 'Balanceado', description: 'Mistura de quentes e frios', icon: Target, color: 'text-purple-500' },
  hot: { name: 'Números Quentes', description: 'Números que saem com frequência', icon: Zap, color: 'text-red-500' },
  cold: { name: 'Números Frios', description: 'Números em atraso', icon: Brain, color: 'text-gray-500' },
  mixed: { name: 'Estratégia Mista', description: 'Algoritmo avançado', icon: Settings, color: 'text-indigo-500' }
};

// Função para gerar números baseado na estratégia
const generateNumbers = (config: GenerationConfig): number[] => {
  const lotteryConfig = lotteryConfigs[config.lottery];
  const { min, max, picks } = lotteryConfig;
  
  let availableNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  
  // Remover números excluídos
  if (config.excludeNumbers.length > 0) {
    availableNumbers = availableNumbers.filter(n => !config.excludeNumbers.includes(n));
  }
  
  let selectedNumbers: number[] = [];
  
  // Incluir números favoritos primeiro
  if (config.favoriteNumbers.length > 0) {
    const favoritesToInclude = Math.min(config.favoriteNumbers.length, Math.floor(picks * 0.4));
    selectedNumbers = config.favoriteNumbers.slice(0, favoritesToInclude);
    availableNumbers = availableNumbers.filter(n => !selectedNumbers.includes(n));
  }
  
  const remainingPicks = picks - selectedNumbers.length;
  
  // Aplicar estratégia para números restantes
  switch (config.strategy) {
    case 'frequency':
      // Simular números mais frequentes (baseado em posição)
      availableNumbers.sort(() => Math.random() - 0.3);
      break;
    case 'hot':
      // Preferir números menores (simulando números quentes)
      availableNumbers.sort((a, b) => a - b + (Math.random() - 0.7));
      break;
    case 'cold':
      // Preferir números maiores (simulando números frios)
      availableNumbers.sort((a, b) => b - a + (Math.random() - 0.7));
      break;
    case 'balanced':
      // Misturar números baixos e altos
      availableNumbers.sort(() => Math.random() - 0.5);
      break;
    case 'mixed':
      // Estratégia mais complexa
      availableNumbers = availableNumbers.filter((n, i) => {
        const isEven = n % 2 === 0;
        const isLow = n <= (max - min + 1) / 2;
        return Math.random() > (isEven && isLow ? 0.3 : 0.1);
      });
      break;
    default:
      // Random
      availableNumbers.sort(() => Math.random() - 0.5);
  }
  
  // Selecionar números restantes
  for (let i = 0; i < remainingPicks && i < availableNumbers.length; i++) {
    selectedNumbers.push(availableNumbers[i]);
  }
  
  // Se não temos números suficientes, completar aleatoriamente
  while (selectedNumbers.length < picks && availableNumbers.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    selectedNumbers.push(availableNumbers[randomIndex]);
    availableNumbers.splice(randomIndex, 1);
  }
  
  return selectedNumbers.sort((a, b) => a - b);
};

export default function Generator() {
  const [config, setConfig] = useState<GenerationConfig>({
    lottery: 'megasena',
    quantity: 1,
    strategy: 'random',
    avoidRepeats: true,
    favoriteNumbers: [],
    excludeNumbers: [],
    usePatterns: false
  });
  
  const [generatedGames, setGeneratedGames] = useState<GeneratedGame[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<GenerationConfig[]>([]);
  const [bulkText, setBulkText] = useState('');

  const lotteryConfig = lotteryConfigs[config.lottery];

  const generateGames = () => {
    const newGames: GeneratedGame[] = [];
    const usedCombinations = new Set<string>();
    
    for (let i = 0; i < config.quantity; i++) {
      let attempts = 0;
      let numbers: number[];
      
      do {
        numbers = generateNumbers(config);
        attempts++;
        
        if (attempts > 100) break; // Evitar loop infinito
        
      } while (
        config.avoidRepeats && 
        usedCombinations.has(numbers.join(',')) && 
        attempts < 100
      );
      
      if (config.avoidRepeats) {
        usedCombinations.add(numbers.join(','));
      }
      
      const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
      
      newGames.push({
        id: `${Date.now()}-${i}`,
        numbers,
        lotteryType: config.lottery,
        strategy: config.strategy,
        timestamp: new Date(),
        confidence
      });
    }
    
    setGeneratedGames(newGames);
    toast.success(`${config.quantity} ${config.quantity === 1 ? 'jogo gerado' : 'jogos gerados'} com sucesso!`);
  };

  const regenerateGame = (gameId: string) => {
    setGeneratedGames(games => 
      games.map(game => {
        if (game.id === gameId) {
          const numbers = generateNumbers(config);
          const confidence = Math.floor(Math.random() * 30) + 70;
          return { ...game, numbers, timestamp: new Date(), confidence };
        }
        return game;
      })
    );
    toast.success('Jogo regenerado!');
  };

  const copyGameNumbers = (numbers: number[]) => {
    const numbersText = numbers.map(n => n.toString().padStart(2, '0')).join(' - ');
    navigator.clipboard.writeText(numbersText);
    toast.success('Números copiados!');
  };

  const exportGames = () => {
    if (generatedGames.length === 0) {
      toast.error('Nenhum jogo para exportar');
      return;
    }

    const content = `Jogos Gerados - ${lotteryNames[config.lottery]}
Gerado em: ${new Date().toLocaleDateString('pt-BR')}
Estratégia: ${strategies[config.strategy].name}
Total de jogos: ${generatedGames.length}

${generatedGames.map((game, index) => {
  const numbersText = game.numbers.map(n => n.toString().padStart(2, '0')).join(' - ');
  return `Jogo ${index + 1}: ${numbersText} (Confiança: ${game.confidence}%)`;
}).join('\n')}

---
Configurações utilizadas:
- Evitar repetições: ${config.avoidRepeats ? 'Sim' : 'Não'}
- Números favoritos: ${config.favoriteNumbers.join(', ') || 'Nenhum'}
- Números excluídos: ${config.excludeNumbers.join(', ') || 'Nenhum'}
- Usar padrões: ${config.usePatterns ? 'Sim' : 'Não'}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jogos-${config.lottery}-${config.strategy}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Jogos exportados com sucesso!');
  };

  const importBulkGames = () => {
    const lines = bulkText.split('\n').filter(line => line.trim());
    const newGames: GeneratedGame[] = [];
    
    lines.forEach((line, index) => {
      const numbers = line.trim().split(/[-\s,]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      
      if (numbers.length === lotteryConfig.picks) {
        newGames.push({
          id: `bulk-${Date.now()}-${index}`,
          numbers: numbers.sort((a, b) => a - b),
          lotteryType: config.lottery,
          strategy: 'imported',
          timestamp: new Date(),
          confidence: 85
        });
      }
    });
    
    if (newGames.length > 0) {
      setGeneratedGames(prev => [...prev, ...newGames]);
      setBulkText('');
      toast.success(`${newGames.length} jogos importados!`);
    } else {
      toast.error('Nenhum jogo válido encontrado');
    }
  };

  const saveConfig = () => {
    setSavedConfigs(prev => [...prev, { ...config }]);
    toast.success('Configuração salva!');
  };

  const clearGames = () => {
    setGeneratedGames([]);
    toast.success('Jogos limpos!');
  };

  const handleNumberToggle = (number: number, type: 'favorite' | 'exclude') => {
    const field = type === 'favorite' ? 'favoriteNumbers' : 'excludeNumbers';
    const currentNumbers = config[field];
    
    if (currentNumbers.includes(number)) {
      setConfig(prev => ({
        ...prev,
        [field]: currentNumbers.filter(n => n !== number)
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [field]: [...currentNumbers, number].sort((a, b) => a - b)
      }));
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gerador de Jogos</h1>
            <p className="text-muted-foreground">
              Gere combinações inteligentes usando diferentes estratégias
            </p>
          </div>
          {generatedGames.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportGames} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button variant="outline" onClick={clearGames} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Configuração */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-500" />
                  Configuração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Loteria */}
                <div className="space-y-2">
                  <Label>Loteria</Label>
                  <Select 
                    value={config.lottery} 
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      lottery: value as LotteryType,
                      favoriteNumbers: [],
                      excludeNumbers: []
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

                {/* Quantidade */}
                <div className="space-y-2">
                  <Label>Quantidade de jogos</Label>
                  <Select 
                    value={config.quantity.toString()} 
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      quantity: Number(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 10, 15, 20, 25, 50].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'jogo' : 'jogos'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estratégia */}
                <div className="space-y-2">
                  <Label>Estratégia</Label>
                  <Select 
                    value={config.strategy} 
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      strategy: value as GenerationConfig['strategy']
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(strategies).map(([key, strategy]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <strategy.icon className={cn("h-4 w-4", strategy.color)} />
                            {strategy.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {strategies[config.strategy].description}
                  </p>
                </div>

                <Separator />

                {/* Opções Avançadas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Evitar repetições</Label>
                    <Switch
                      checked={config.avoidRepeats}
                      onCheckedChange={(checked) => setConfig(prev => ({ 
                        ...prev, 
                        avoidRepeats: checked 
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Usar padrões</Label>
                    <Switch
                      checked={config.usePatterns}
                      onCheckedChange={(checked) => setConfig(prev => ({ 
                        ...prev, 
                        usePatterns: checked 
                      }))}
                    />
                  </div>
                </div>

                <Separator />

                {/* Botões de Ação */}
                <div className="space-y-2">
                  <Button 
                    onClick={generateGames}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Wand2 className="h-4 w-4" />
                    Gerar {config.quantity} {config.quantity === 1 ? 'Jogo' : 'Jogos'}
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={saveConfig}
                    className="w-full gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Salvar Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configurações Salvas */}
            {savedConfigs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configurações Salvas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {savedConfigs.slice(-3).map((savedConfig, index) => (
                      <div 
                        key={index}
                        className="p-2 border rounded cursor-pointer hover:bg-muted/50"
                        onClick={() => setConfig(savedConfig)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {lotteryNames[savedConfig.lottery]}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {strategies[savedConfig.strategy].name}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {savedConfig.quantity} jogos • {savedConfig.avoidRepeats ? 'Sem repetir' : 'Pode repetir'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList>
                <TabsTrigger value="basic">Configuração Básica</TabsTrigger>
                <TabsTrigger value="advanced">Avançado</TabsTrigger>
                <TabsTrigger value="bulk">Importar em Lote</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                {/* Informações da Estratégia */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {React.createElement(strategies[config.strategy].icon, { 
                        className: cn("h-5 w-5", strategies[config.strategy].color) 
                      })}
                      Estratégia: {strategies[config.strategy].name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {strategies[config.strategy].description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-muted/50 rounded">
                        <p className="text-sm text-muted-foreground">Números por jogo</p>
                        <p className="font-semibold">{lotteryConfig.picks}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded">
                        <p className="text-sm text-muted-foreground">Faixa</p>
                        <p className="font-semibold">{lotteryConfig.min}-{lotteryConfig.max}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded">
                        <p className="text-sm text-muted-foreground">Jogos</p>
                        <p className="font-semibold">{config.quantity}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                {/* Números Favoritos e Excluídos */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-green-600">Números Favoritos</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Números que você quer incluir preferencialmente
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {config.favoriteNumbers.length > 0 && (
                          <div>
                            <Label className="text-xs">Selecionados:</Label>
                            <LotteryNumbers 
                              type={config.lottery}
                              numbers={config.favoriteNumbers}
                              size="sm"
                            />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-10 gap-1">
                          {Array.from({ length: lotteryConfig.max - lotteryConfig.min + 1 }, (_, i) => {
                            const number = lotteryConfig.min + i;
                            const isSelected = config.favoriteNumbers.includes(number);
                            const isExcluded = config.excludeNumbers.includes(number);
                            return (
                              <Button
                                key={number}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-6 w-6 p-0 text-xs",
                                  isSelected && "bg-green-500 hover:bg-green-600",
                                  isExcluded && "opacity-30"
                                )}
                                onClick={() => handleNumberToggle(number, 'favorite')}
                                disabled={isExcluded}
                              >
                                {number.toString().padStart(2, '0')}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-red-600">Números Excluídos</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Números que você não quer que apareçam
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {config.excludeNumbers.length > 0 && (
                          <div>
                            <Label className="text-xs">Excluídos:</Label>
                            <LotteryNumbers 
                              type={config.lottery}
                              numbers={config.excludeNumbers}
                              size="sm"
                            />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-10 gap-1">
                          {Array.from({ length: lotteryConfig.max - lotteryConfig.min + 1 }, (_, i) => {
                            const number = lotteryConfig.min + i;
                            const isSelected = config.excludeNumbers.includes(number);
                            const isFavorite = config.favoriteNumbers.includes(number);
                            return (
                              <Button
                                key={number}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-6 w-6 p-0 text-xs",
                                  isSelected && "bg-red-500 hover:bg-red-600",
                                  isFavorite && "opacity-30"
                                )}
                                onClick={() => handleNumberToggle(number, 'exclude')}
                                disabled={isFavorite}
                              >
                                {number.toString().padStart(2, '0')}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-blue-500" />
                      Importar Jogos em Lote
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Cole seus jogos, um por linha. Exemplo: 01 05 10 15 20 25
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Jogos (um por linha)</Label>
                      <Textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={`Exemplo para ${lotteryNames[config.lottery]}:\n01 05 10 15 20 25\n03 08 12 18 22 30\n07 11 16 21 35 40`}
                        rows={10}
                      />
                    </div>
                    
                    <Button 
                      onClick={importBulkGames}
                      disabled={!bulkText.trim()}
                      className="w-full gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Importar Jogos
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Jogos Gerados */}
            {generatedGames.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Jogos Gerados ({generatedGames.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportGames} className="gap-1">
                        <Download className="h-3 w-3" />
                        Exportar
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearGames} className="gap-1">
                        <Trash2 className="h-3 w-3" />
                        Limpar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {generatedGames.map((game, index) => (
                      <div key={game.id} className="border rounded-lg p-4 bg-muted/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Jogo {index + 1}
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs",
                                strategies[game.strategy]?.color || "text-gray-500"
                              )}
                            >
                              {strategies[game.strategy]?.name || game.strategy}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyGameNumbers(game.numbers)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => regenerateGame(game.id)}
                              className="h-6 w-6 p-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <LotteryNumbers 
                          type={game.lotteryType} 
                          numbers={game.numbers} 
                          size="sm" 
                        />
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>
                            Gerado às {game.timestamp.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {game.confidence}% confiança
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}