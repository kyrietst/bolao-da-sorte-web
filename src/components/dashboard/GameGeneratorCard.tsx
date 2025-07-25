import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Wand2, Download, Copy, RotateCcw, Trash2 } from 'lucide-react';
import { LotteryType } from '@/types';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';
import { toast } from 'sonner';

interface GeneratedGame {
  id: string;
  numbers: number[];
  lotteryType: LotteryType;
  timestamp: Date;
}

interface GameGeneratorCardProps {
  selectedLottery?: LotteryType;
}

const lotteryNames: Record<LotteryType, string> = {
  megasena: 'Mega-Sena',
};

const lotteryConfigs = {
  megasena: { min: 1, max: 60, picks: 6, maxPicks: 15 },
};

// Função para gerar números aleatórios únicos
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

export default function GameGeneratorCard({ selectedLottery = 'megasena' }: GameGeneratorCardProps) {
  const [currentLottery, setCurrentLottery] = useState<LotteryType>(selectedLottery);
  const [numberOfGames, setNumberOfGames] = useState<number>(1);
  const [generatedGames, setGeneratedGames] = useState<GeneratedGame[]>([]);

  const config = lotteryConfigs[currentLottery];

  const generateGames = () => {
    const newGames: GeneratedGame[] = [];
    
    for (let i = 0; i < numberOfGames; i++) {
      const numbers = generateRandomNumbers(config.min, config.max, config.picks);
      newGames.push({
        id: `${Date.now()}-${i}`,
        numbers,
        lotteryType: currentLottery,
        timestamp: new Date()
      });
    }
    
    setGeneratedGames(newGames);
    toast.success(`${numberOfGames} ${numberOfGames === 1 ? 'jogo gerado' : 'jogos gerados'} com sucesso!`);
  };

  const regenerateGame = (gameId: string) => {
    const numbers = generateRandomNumbers(config.min, config.max, config.picks);
    setGeneratedGames(games => 
      games.map(game => 
        game.id === gameId 
          ? { ...game, numbers, timestamp: new Date() }
          : game
      )
    );
    toast.success('Jogo regenerado!');
  };

  const copyGameNumbers = (numbers: number[]) => {
    const numbersText = numbers.map(n => n.toString().padStart(2, '0')).join(' - ');
    navigator.clipboard.writeText(numbersText);
    toast.success('Números copiados para a área de transferência!');
  };

  const exportGames = () => {
    if (generatedGames.length === 0) {
      toast.error('Nenhum jogo para exportar');
      return;
    }

    const content = generatedGames.map((game, index) => {
      const numbersText = game.numbers.map(n => n.toString().padStart(2, '0')).join(' - ');
      return `Jogo ${index + 1}: ${numbersText}`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jogos-${lotteryNames[currentLottery]}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Jogos exportados com sucesso!');
  };

  const clearGames = () => {
    setGeneratedGames([]);
    toast.success('Jogos limpos!');
  };

  const handleLotteryChange = (value: LotteryType) => {
    setCurrentLottery(value);
    setGeneratedGames([]);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-indigo-500" />
          Gerador de Jogos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gere jogos aleatórios para suas apostas
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Configurações */}
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
            <Label className="text-xs">Quantidade</Label>
            <Input
              type="number"
              value={numberOfGames}
              onChange={(e) => setNumberOfGames(Math.max(1, Math.min(10, Number(e.target.value))))}
              min="1"
              max="10"
              className="h-9"
            />
          </div>
        </div>

        {/* Informações do jogo */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Números por jogo</p>
              <p className="text-sm font-semibold">
                {config.picks} números
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Faixa</p>
              <p className="text-sm font-semibold">
                {config.min} a {config.max}
              </p>
            </div>
          </div>
        </div>

        {/* Botão principal */}
        <Button 
          onClick={generateGames}
          className="w-full gap-2"
          size="lg"
        >
          <Wand2 className="h-4 w-4" />
          Gerar {numberOfGames} {numberOfGames === 1 ? 'Jogo' : 'Jogos'}
        </Button>

        {/* Jogos gerados */}
        {generatedGames.length > 0 && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  Jogos Gerados ({generatedGames.length})
                </h4>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportGames}
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearGames}
                    className="gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {generatedGames.map((game, index) => (
                  <div key={game.id} className="border rounded-lg p-3 bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        Jogo {index + 1}
                      </Badge>
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
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Gerado às {game.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}