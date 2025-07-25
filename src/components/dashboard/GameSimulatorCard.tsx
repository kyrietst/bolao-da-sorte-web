import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Play, RotateCcw, TrendingUp, DollarSign } from 'lucide-react';
import { LotteryType } from '@/types';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';

interface SimulationResult {
  hits: number;
  prize: number;
  probability: string;
}

interface GameSimulatorCardProps {
  selectedLottery?: LotteryType;
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

// Função para gerar números aleatórios
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

// NOTA: Simulação removida - não deve usar valores fictícios em app de dinheiro real
const simulateGame = (lottery: LotteryType, numbers: number[], investment: number): SimulationResult[] => {
  // Simulação desabilitada conforme solicitação do usuário
  // Aplicativo de loterias com dinheiro real não deve usar dados fictícios
  
  return [{
    hits: 0,
    prize: 0,
    probability: 'Simulação desabilitada - use dados reais apenas'
  }];
};

export default function GameSimulatorCard({ selectedLottery = 'megasena' }: GameSimulatorCardProps) {
  const [currentLottery, setCurrentLottery] = useState<LotteryType>(selectedLottery);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [investment, setInvestment] = useState<number>(5);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [hasSimulated, setHasSimulated] = useState(false);

  const config = lotteryConfigs[currentLottery];

  const handleNumberSelect = (number: number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else if (selectedNumbers.length < config.maxPicks) {
      setSelectedNumbers([...selectedNumbers, number].sort((a, b) => a - b));
    }
  };

  const generateRandomGame = () => {
    const numbers = generateRandomNumbers(config.min, config.max, config.picks);
    setSelectedNumbers(numbers);
    setHasSimulated(false);
    setSimulationResults([]);
  };

  const runSimulation = () => {
    if (selectedNumbers.length >= config.picks) {
      const results = simulateGame(currentLottery, selectedNumbers, investment);
      setSimulationResults(results);
      setHasSimulated(true);
    }
  };

  const resetSimulation = () => {
    setSelectedNumbers([]);
    setSimulationResults([]);
    setHasSimulated(false);
  };

  const handleLotteryChange = (value: LotteryType) => {
    setCurrentLottery(value);
    resetSimulation();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-purple-500" />
          Simulador de Jogos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Simule suas chances e calcule possíveis prêmios
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Seleção de loteria e investimento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Loteria</Label>
            <Select value={currentLottery} onValueChange={handleLotteryChange}>
              <SelectTrigger className="h-9">
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
          
          <div className="space-y-2">
            <Label className="text-xs">Investimento (R$)</Label>
            <Input
              type="number"
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
              min="1"
              className="h-9"
            />
          </div>
        </div>

        {/* Informações do jogo */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Escolha</p>
              <p className="text-sm font-semibold">
                {config.picks} números
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Selecionados</p>
              <p className="text-sm font-semibold">
                {selectedNumbers.length}/{config.picks}
              </p>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateRandomGame}
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Surpresinha
          </Button>
          <Button 
            size="sm" 
            onClick={runSimulation}
            disabled={selectedNumbers.length < config.picks}
            className="gap-1"
          >
            <Play className="h-3 w-3" />
            Simular
          </Button>
        </div>

        {/* Números selecionados */}
        {selectedNumbers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Números selecionados:</Label>
            <LotteryNumbers 
              type={currentLottery} 
              numbers={selectedNumbers} 
              size="sm" 
            />
          </div>
        )}

        {/* Resultados da simulação */}
        {hasSimulated && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium text-sm">Resultados da Simulação</span>
            </div>
            
            {simulationResults.length > 0 ? (
              <div className="space-y-2">
                {simulationResults.map((result, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {result.hits} acertos
                      </Badge>
                      <div className="flex items-center gap-1 text-green-700">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-semibold text-sm">
                          {formatCurrency(result.prize)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-green-600">
                      Probabilidade: {result.probability}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Nenhum prêmio nesta simulação
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tente novamente com outros números
                </p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetSimulation}
              className="w-full"
            >
              Nova Simulação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}