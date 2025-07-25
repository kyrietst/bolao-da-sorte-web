
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LotteryResultCard from '@/components/dashboard/LotteryResult';
import { LotteryResult, LotteryType } from '@/types';
import { fetchLotteryResult, fetchLatestLotteryResult, convertApiResponseToLotteryResult } from '@/services/lotteryApi';
import { toast } from '@/components/ui/sonner';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';

// Mock data - será usado apenas quando a API não estiver disponível ou ocorrer um erro  
const mockResults: LotteryResult[] = [
  {
    id: '2891',
    lotteryType: 'megasena' as LotteryType,
    drawNumber: '2891',
    drawDate: '2025-07-22',
    numbers: [19, 54, 35, 34, 26, 24],
    accumulated: true,
  },
];

export default function SearchResults() {
  const [selectedLottery, setSelectedLottery] = useState<string>('megasena'); // Pré-seleciona Mega-Sena
  const [drawNumber, setDrawNumber] = useState<string>('');
  const [results, setResults] = useState<LotteryResult[]>([]); // Inicia vazio
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false);

  const handleSearchLatest = async () => {
    if (!selectedLottery) {
      toast.error('Por favor, selecione uma loteria');
      return;
    }
    
    setIsSearching(true);
    
    try {
      console.log('Buscando último resultado da:', selectedLottery);
      const apiResponse = await fetchLatestLotteryResult(selectedLottery as LotteryType);
      const result = convertApiResponseToLotteryResult(apiResponse, selectedLottery as LotteryType);
      
      console.log('Último resultado encontrado:', result);
      setResults([result]);
      setDrawNumber(result.drawNumber); // Atualiza o campo de número
      toast.success(`Último resultado encontrado: Concurso ${result.drawNumber}`);
      
    } catch (error: any) {
      console.error('Erro ao buscar último resultado:', error);
      toast.error('Erro ao buscar último resultado. Tente novamente.');
      
      // Em caso de erro, usar mock atualizado
      setResults(mockResults);
      setDrawNumber(mockResults[0].drawNumber);
      toast.info('Exibindo último resultado conhecido.');
    } finally {
      setIsSearching(false);
    }
  };

  // Buscar último concurso automaticamente ao carregar a página
  useEffect(() => {
    const loadInitialData = async () => {
      if (selectedLottery && !hasInitialLoad) {
        console.log('🚀 Carregamento inicial: buscando último concurso');
        await handleSearchLatest();
        setHasInitialLoad(true);
      }
    };
    
    loadInitialData();
  }, []); // Executa apenas uma vez no mount
  
  // Query para buscar o resultado da loteria
  const { refetch, isLoading, isError } = useQuery({
    queryKey: ['lotteryResult', selectedLottery, drawNumber],
    queryFn: async () => {
      if (!selectedLottery || !drawNumber) {
        return null;
      }
      console.log(`Buscando resultado para ${selectedLottery} concurso ${drawNumber}`);
      const apiResponse = await fetchLotteryResult(selectedLottery as LotteryType, drawNumber);
      return convertApiResponseToLotteryResult(apiResponse, selectedLottery as LotteryType);
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
      // Se não tiver número, busca o último
      await handleSearchLatest();
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
          <h1 className="text-2xl font-bold tracking-tight">Resultados da Mega-Sena</h1>
          <p className="text-muted-foreground">
            Veja o último resultado ou pesquise por um concurso específico da Mega-Sena.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] items-end">
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
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Concurso</label>
            <Input
              type="text"
              placeholder="Número do concurso (opcional)"
              value={drawNumber}
              onChange={(e) => setDrawNumber(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
          
          <Button onClick={handleSearchLatest} disabled={isLoading || isSearching} variant="outline">
            {isLoading || isSearching ? 'Buscando...' : 'Último Concurso'}
          </Button>
          
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
            <h3 className="text-lg font-semibold mb-2">Pesquise um Resultado</h3>
            <p className="text-muted-foreground mb-4">
              Use o botão "Último Concurso" para ver o resultado mais recente da Mega-Sena, 
              ou digite um número específico de concurso e clique em "Buscar".
            </p>
            <Button onClick={handleSearchLatest} variant="outline" disabled={!selectedLottery}>
              Ver Último Concurso
            </Button>
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
