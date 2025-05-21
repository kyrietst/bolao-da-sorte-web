
import { useState } from 'react';
import MainLayout from '@/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LotteryResultCard from '@/components/dashboard/LotteryResult';
import { LotteryResult, LotteryType } from '@/types';

// Mock data - will be replaced with API data
const mockResults: LotteryResult[] = [
  {
    id: '1',
    lotteryType: 'megasena' as LotteryType,
    drawNumber: '2650',
    drawDate: '2023-10-28',
    numbers: [4, 18, 29, 37, 39, 53],
    accumulated: true,
  },
  {
    id: '2',
    lotteryType: 'lotofacil' as LotteryType,
    drawNumber: '3000',
    drawDate: '2024-01-10',
    numbers: [1, 2, 3, 4, 5, 10],
    winners: 0,
  },
  {
    id: '3',
    lotteryType: 'quina' as LotteryType,
    drawNumber: '6400',
    drawDate: '2024-03-26',
    numbers: [4, 24, 33, 50, 77],
    accumulated: true,
  },
  {
    id: '4',
    lotteryType: 'lotomania' as LotteryType,
    drawNumber: '2600',
    drawDate: '2023-12-22',
    numbers: [0, 7, 8, 9, 11, 17, 33, 41, 53],
    accumulated: true,
  },
  {
    id: '5',
    lotteryType: 'timemania' as LotteryType,
    drawNumber: '2100',
    drawDate: '2024-04-06',
    numbers: [14, 17, 43, 45, 60, 70],
    accumulated: true,
  },
  {
    id: '6',
    lotteryType: 'duplasena' as LotteryType,
    drawNumber: '2700',
    drawDate: '2024-08-12',
    numbers: [6, 9, 15, 22, 28, 44],
    accumulated: true,
  },
];

export default function SearchResults() {
  const [selectedLottery, setSelectedLottery] = useState<string>('');
  const [drawNumber, setDrawNumber] = useState<string>('');
  const [results, setResults] = useState<LotteryResult[]>(mockResults);
  
  const handleSearch = () => {
    // In a real implementation, this would call the API with the selected lottery and draw number
    // For now, we'll just filter the mock data
    let filtered = mockResults;
    
    if (selectedLottery) {
      filtered = filtered.filter(result => result.lotteryType === selectedLottery);
    }
    
    if (drawNumber) {
      filtered = filtered.filter(result => result.drawNumber.includes(drawNumber));
    }
    
    setResults(filtered);
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesquisar Resultados</h1>
          <p className="text-muted-foreground">Busque resultados anteriores das loterias.</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
          <div>
            <label className="text-sm font-medium mb-1 block">Loteria</label>
            <Select
              value={selectedLottery}
              onValueChange={setSelectedLottery}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a loteria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="megasena">Mega-Sena</SelectItem>
                <SelectItem value="lotofacil">Lotofácil</SelectItem>
                <SelectItem value="quina">Quina</SelectItem>
                <SelectItem value="lotomania">Lotomania</SelectItem>
                <SelectItem value="timemania">Timemania</SelectItem>
                <SelectItem value="duplasena">Dupla Sena</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Concurso</label>
            <Input
              type="text"
              placeholder="Número do concurso"
              value={drawNumber}
              onChange={(e) => setDrawNumber(e.target.value)}
            />
          </div>
          
          <Button onClick={handleSearch}>Buscar</Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {results.map((result) => (
            <LotteryResultCard key={result.id} result={result} />
          ))}
        </div>
        
        {results.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-10 text-center">
            <p className="text-muted-foreground">
              Nenhum resultado encontrado com os critérios especificados.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
