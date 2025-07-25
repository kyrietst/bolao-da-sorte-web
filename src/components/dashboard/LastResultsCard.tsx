import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, TrendingUp, RefreshCw, Eye, Loader2 } from 'lucide-react';
import { LotteryType } from '@/types';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';
import { fetchLatestLotteryResult, convertApiResponseToLotteryResult } from '@/services/lotteryApi';

interface LastResultsCardProps {
  selectedLottery?: LotteryType;
  onLotteryChange?: (lottery: LotteryType) => void;
}

const lotteryNames: Record<LotteryType, string> = {
  megasena: 'Mega-Sena',
};

const lotteryColors: Record<LotteryType, string> = {
  megasena: 'bg-green-500',
};

// Interface para resultado formatado para exibição
interface DisplayResult {
  lotteryType: LotteryType;
  drawNumber: string;
  drawDate: string;
  numbers: number[];
  accumulated: boolean;
  winners: number;
  nextEstimatedPrize?: number;
  prizes?: Array<{
    hits: string;
    winners: number;
    prize: string;
  }>;
}

const formatCurrency = (value: number | string): string => {
  if (typeof value === 'string') {
    // Se já está formatado como string de moeda, retornar como está
    if (value.includes('R$')) {
      return value;
    }
    // Tentar converter string numérica
    const cleanValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(numValue);
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value || 0);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

export default function LastResultsCard({ selectedLottery = 'megasena', onLotteryChange }: LastResultsCardProps) {
  const [currentLottery, setCurrentLottery] = useState<LotteryType>(selectedLottery);
  const [showDetails, setShowDetails] = useState(false);
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar resultado da API quando a loteria mudar
  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`🎯 Buscando último resultado da ${currentLottery}...`);
        const apiResponse = await fetchLatestLotteryResult(currentLottery);
        const convertedResult = convertApiResponseToLotteryResult(apiResponse, currentLottery);
        
        // Converter para formato de exibição
        const displayResult: DisplayResult = {
          lotteryType: convertedResult.lotteryType,
          drawNumber: convertedResult.drawNumber,
          drawDate: convertedResult.drawDate,
          numbers: convertedResult.numbers,
          accumulated: convertedResult.accumulated,
          winners: convertedResult.winners,
          prizes: convertedResult.prizes
        };
        
        setResult(displayResult);
        console.log(`✅ Resultado carregado:`, displayResult);
        
      } catch (err) {
        console.error('❌ Erro ao buscar resultado:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [currentLottery]);

  const handleLotteryChange = (value: LotteryType) => {
    setCurrentLottery(value);
    setShowDetails(false);
    onLotteryChange?.(value);
  };

  const handleRefresh = () => {
    // Force reload by re-triggering the effect
    setResult(null);
    const fetchResult = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`🔄 Recarregando resultado da ${currentLottery}...`);
        const apiResponse = await fetchLatestLotteryResult(currentLottery);
        const convertedResult = convertApiResponseToLotteryResult(apiResponse, currentLottery);
        
        const displayResult: DisplayResult = {
          lotteryType: convertedResult.lotteryType,
          drawNumber: convertedResult.drawNumber,
          drawDate: convertedResult.drawDate,
          numbers: convertedResult.numbers,
          accumulated: convertedResult.accumulated,
          winners: convertedResult.winners,
          prizes: convertedResult.prizes
        };
        
        setResult(displayResult);
        
      } catch (err) {
        console.error('❌ Erro ao recarregar resultado:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Último Resultado
          </CardTitle>
          <Select value={currentLottery} onValueChange={handleLotteryChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(lotteryNames).map(([key, name]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${lotteryColors[key as LotteryType]}`} />
                    {name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading && !result ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">Carregando resultado...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-3">Erro ao carregar resultado</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        ) : result ? (
          <>
            {/* Cabeçalho do resultado */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${lotteryColors[currentLottery]}`} />
                <div>
                  <h3 className="font-semibold">{lotteryNames[currentLottery]}</h3>
                  <p className="text-sm text-muted-foreground">
                    Concurso {result.drawNumber} • {formatDate(result.drawDate)}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

        {/* Números sorteados */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Números sorteados:</span>
          <LotteryNumbers type={result.lotteryType} numbers={result.numbers} size="sm" />
        </div>

        {/* Status do sorteio */}
        <div>
          {result.accumulated ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-red-600" />
                <span className="font-semibold text-red-800">Acumulou!</span>
              </div>
              <p className="text-sm text-red-700">
                Prêmio acumulado para o próximo concurso
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-800">
                  {result.winners} {result.winners === 1 ? 'ganhador' : 'ganhadores'}
                </span>
              </div>
              <p className="text-sm text-green-700">
                Prêmio principal de {formatCurrency(result.prizes?.[0]?.prize || '0')}
              </p>
            </div>
          )}
        </div>

        {/* Detalhes das premiações */}
        {result.prizes && result.prizes.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full gap-2"
            >
              <Eye className="h-4 w-4" />
              {showDetails ? 'Ocultar' : 'Ver'} Todas as Premiações
            </Button>
            
            {showDetails && (
              <div className="border rounded-lg p-3 bg-muted/20">
                <div className="space-y-2">
                  {result.prizes.slice(0, 3).map((prize, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {prize.hits} acertos:
                      </span>
                      <div className="text-right">
                        <div className="font-medium">
                          {prize.winners} {prize.winners === 1 ? 'ganhador' : 'ganhadores'}
                        </div>
                        <div className="text-green-600 font-semibold text-xs">
                          {formatCurrency(prize.prize)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

            {/* Ações */}
            <div className="space-y-2 pt-2 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/meus-boloes">
                  Conferir Meus Jogos
                </Link>
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}