
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LotteryResultCard from '@/components/dashboard/LotteryResult';
import { LotteryResult, LotteryType } from '@/types';
import { fetchLotteryResult, convertApiResponseToLotteryResult } from '@/services/lotteryApi';
import { toast } from '@/components/ui/sonner';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';

// Mock data - será usado apenas quando a API não estiver disponível ou ocorrer um erro
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
    accumulated: false,
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
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Query para buscar o resultado da loteria
  const { refetch, isLoading, isError } = useQuery({
    queryKey: ['lotteryResult', selectedLottery, drawNumber],
    queryFn: async () => {
      if (!selectedLottery || !drawNumber) {
        return null;
      }
      console.log(`Buscando resultado para ${selectedLottery} concurso ${drawNumber}`);
      const apiResponse = await fetchLotteryResult(selectedLottery as LotteryType, drawNumber);
      return convertApiResponseToLotteryResult(apiResponse);
    },
    enabled: false,
    retry: 1
  });
  
  const handleSearch = async () => {
    if (!selectedLottery) {
      toast.error('Por favor, selecione uma loteria');
      return;
    }
    
    if (!drawNumber) {
      toast.error('Por favor, insira um número de concurso');
      return;
    }
    
    setIsSearching(true);
    
    try {
      console.log('Iniciando busca...');
      const result = await refetch();
      
      if (result.error) {
        console.error('Erro na busca:', result.error);
        throw result.error;
      }
      
      if (result.data) {
        console.log('Resultado encontrado:', result.data);
        // Se encontrou um resultado, atualiza a lista de resultados
        setResults([result.data]);
        toast.success(`Resultado do concurso ${drawNumber} encontrado com sucesso!`);
      } else {
        // Se não encontrou nenhum resultado, mostra uma lista vazia
        setResults([]);
        toast.error(`Nenhum resultado encontrado para o concurso ${drawNumber}`);
      }
    } catch (error: any) {
      console.error('Erro ao buscar resultado:', error);
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Ocorreu um erro ao buscar o resultado.';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Falha ao conectar')) {
        errorMessage = 'Erro de conexão com o serviço de resultados. Verifique sua conexão.';
      } else if (error.message.includes('404')) {
        errorMessage = `Concurso ${drawNumber} não encontrado para ${selectedLottery}.`;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Tempo limite excedido. Tente novamente.';
      }
      
      toast.error(errorMessage);
      
      // Em caso de erro, filtra os resultados do mock se necessário
      let filtered = mockResults;
      
      if (selectedLottery) {
        filtered = filtered.filter(result => result.lotteryType === selectedLottery);
      }
      
      if (drawNumber) {
        filtered = filtered.filter(result => result.drawNumber.includes(drawNumber));
      }
      
      setResults(filtered);
      
      if (filtered.length > 0) {
        toast.info('Exibindo resultados de exemplo enquanto a API está indisponível.');
      }
    } finally {
      setIsSearching(false);
    }
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
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
          
          <Button onClick={handleSearch} disabled={isLoading || isSearching}>
            {isLoading || isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
        
        {(isLoading || isSearching) && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          </div>
        )}
        
        {!isLoading && !isSearching && results.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {results.map((result) => (
              <LotteryResultCard key={result.id} result={result} />
            ))}
          </div>
        )}
        
        {!isLoading && !isSearching && results.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-10 text-center">
            <p className="text-muted-foreground">
              Nenhum resultado encontrado com os critérios especificados.
            </p>
          </div>
        )}
        
        {/* Paginação (para implementação futura quando houver múltiplos resultados) */}
        {results.length > 10 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink href="#" isActive>1</PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </MainLayout>
  );
}
