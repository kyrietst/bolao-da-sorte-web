import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarCheck2, Clock, Timer, DollarSign, RefreshCw } from 'lucide-react';
import { LotteryType } from '@/types';
import { fetchLatestLotteryResult } from '@/services/lotteryApi';
import { HybridLotteryCache } from '@/services/lotteryCache';

interface NextDrawInfo {
  lotteryType: LotteryType;
  drawNumber: number;
  date: string;
  estimatedPrize: number;
  daysUntilDraw: number;
}

interface NextDrawCardProps {
  selectedLottery?: LotteryType;
  onLotteryChange?: (lottery: LotteryType) => void;
}

const lotteryNames: Record<LotteryType, string> = {
  megasena: 'Mega-Sena',
};

const lotteryColors: Record<LotteryType, string> = {
  megasena: 'bg-green-500',
};

// Cronogramas oficiais das loterias (baseado na Caixa Econômica Federal)
// Domingo = 0, Segunda = 1, Terça = 2, Quarta = 3, Quinta = 4, Sexta = 5, Sábado = 6
const LOTTERY_SCHEDULES: Record<LotteryType, number[]> = {
  megasena: [2, 4, 6],        // Terças, Quintas e Sábados
};

/**
 * Calcula a próxima data de sorteio baseada no cronograma oficial
 * IMPORTANTE: Segue exatamente os cronogramas documentados
 */
function getNextDrawDate(lotteryType: LotteryType): Date {
  const now = new Date();
  const schedule = LOTTERY_SCHEDULES[lotteryType];
  
  console.log(`📅 === CALCULANDO PRÓXIMA DATA PARA ${lotteryType.toUpperCase()} ===`);
  console.log('📍 Estado atual:', {
    hoje: now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
    diaNumerico: now.getDay(),
    hora: now.getHours(),
    cronograma: schedule.map(d => ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d]).join(', ')
  });
  
  // Verificar primeiro se hoje é um dia de sorteio e ainda há tempo
  const todayDayOfWeek = now.getDay();
  if (schedule.includes(todayDayOfWeek) && now.getHours() < 20) {
    console.log(`✅ RESULTADO: HOJE (${now.toLocaleDateString('pt-BR', { weekday: 'long' })}) ainda há tempo!`);
    return new Date(now);
  }
  
  // Procurar o próximo dia de sorteio
  let candidateDate = new Date(now);
  candidateDate.setDate(candidateDate.getDate() + 1); // Começar de amanhã
  
  for (let daysAhead = 1; daysAhead <= 14; daysAhead++) {
    const dayOfWeek = candidateDate.getDay();
    const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek];
    const isDrawDay = schedule.includes(dayOfWeek);
    
    console.log(`🔍 Dia ${daysAhead}: ${dayName} (${dayOfWeek}) - Sorteio? ${isDrawDay}`);
    
    if (isDrawDay) {
      console.log(`✅ RESULTADO: ${candidateDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}`);
      return new Date(candidateDate);
    }
    
    // Avançar para o próximo dia
    candidateDate.setDate(candidateDate.getDate() + 1);
  }
  
  // Fallback: se algo der errado, retornar amanhã
  console.error(`🚨 ERRO CRÍTICO: Não encontrou próximo sorteio para ${lotteryType}`);
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  return fallback;
}

/**
 * Calcula o próximo número de concurso baseado no último sorteio realizado
 * IMPORTANTE: Sempre incrementa em +1 do último concurso oficial
 */
function calculateNextDrawNumber(lastDrawNumber: number, lastDrawDate: string, nextDrawDate: Date, lotteryType: LotteryType): number {
  console.log(`🔢 Calculando próximo concurso para ${lotteryType}:`, {
    últimoSorteio: lastDrawNumber,
    últimaData: lastDrawDate,
    próximaData: nextDrawDate.toLocaleDateString('pt-BR')
  });
  
  // SEMPRE incrementar em 1 do último concurso oficial
  // Isso garante sequência correta baseada em dados reais
  const nextNumber = lastDrawNumber + 1;
  
  console.log(`✅ Próximo concurso calculado: ${nextNumber}`);
  return nextNumber;
}

// REMOVIDO: DEFAULT_PRIZES - apenas dados reais da API devem ser usados

/**
 * Calcula os dados do próximo sorteio dinamicamente baseado em dados reais
 */
async function getNextDrawInfo(lotteryType: LotteryType): Promise<NextDrawInfo> {
  console.log(`🎯 === INICIANDO CÁLCULO PARA ${lotteryType.toUpperCase()} ===`);
  
  try {
    // PRIMEIRO: Calcular próxima data baseada apenas no cronograma
    console.log('📅 Calculando próxima data baseada no cronograma oficial...');
    const nextDate = getNextDrawDate(lotteryType);
    const today = new Date();
    
    console.log('🔍 Datas calculadas:', {
      hoje: today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
      proximaData: nextDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
      diasParaSorteio: Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    });
    
    // SEGUNDO: Tentar buscar último resultado da API (pode falhar)
    let nextDrawNumber = 0;
    let estimatedPrize = 0;
    
    try {
      console.log('🌐 Tentando buscar último resultado da API...');
      const lastResult = await fetchLatestLotteryResult(lotteryType);
      
      console.log('✅ Dados da API recebidos:', {
        concurso: lastResult.numero,
        dataApuracao: lastResult.dataApuracao,
        proximoPremio: lastResult.valorEstimadoProximoConcurso
      });
      
      nextDrawNumber = calculateNextDrawNumber(
        lastResult.numero, 
        lastResult.dataApuracao, 
        nextDate, 
        lotteryType
      );
      
      estimatedPrize = lastResult.valorEstimadoProximoConcurso || 0;
      
    } catch (apiError) {
      console.warn(`⚠️ Falha na API para ${lotteryType}:`, apiError);
      console.log('🔄 Continuando apenas com cálculo de cronograma...');
    }
    
    // Calcular dias até o sorteio
    const timeDiff = nextDate.getTime() - today.getTime();
    const daysUntilDraw = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    const result = {
      lotteryType,
      drawNumber: nextDrawNumber,
      date: nextDate.toISOString().split('T')[0],
      estimatedPrize,
      daysUntilDraw: Math.max(0, daysUntilDraw)
    };
    
    console.log(`🎯 === RESULTADO FINAL PARA ${lotteryType.toUpperCase()} ===`, result);
    return result;
    
  } catch (error) {
    console.error(`🚨 ERRO CRÍTICO no cálculo para ${lotteryType}:`, error);
    
    // Fallback extremo: usar apenas cronograma
    const today = new Date();
    const fallbackDate = new Date(today);
    fallbackDate.setDate(fallbackDate.getDate() + 1); // Amanhã como fallback
    
    return {
      lotteryType,
      drawNumber: 0,
      date: fallbackDate.toISOString().split('T')[0],
      estimatedPrize: 0,
      daysUntilDraw: 1
    };
  }
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateString: string): string => {
  // CORREÇÃO: Evitar problemas de timezone
  // Usar formato '2025-07-15' corretamente sem conversão de timezone
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month é 0-indexado
  
  // Debug: Log apenas em desenvolvimento
  if (import.meta.env.DEV) {
    console.log(`🗓️ Data formatada: ${dateString} → ${date.toLocaleDateString('pt-BR', { weekday: 'long' })}`);
  }
  
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

export default function NextDrawCard({ selectedLottery = 'megasena', onLotteryChange }: NextDrawCardProps) {
  const [currentLottery, setCurrentLottery] = useState<LotteryType>(selectedLottery);
  const [drawInfo, setDrawInfo] = useState<NextDrawInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDrawInfo = async () => {
      setLoading(true);
      try {
        // IMPORTANTE: Limpar cache antes de calcular próximo sorteio
        // para garantir dados atualizados
        console.log('🧹 Limpando cache para garantir dados atualizados...');
        
        // Limpar cache local para forçar nova busca da API
        try {
          // Limpar localStorage específico para loterias
          const keysToRemove = Object.keys(localStorage).filter(key => 
            key.startsWith('lottery_cache_')
          );
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removido cache: ${key}`);
          });
          
          await HybridLotteryCache.cleanup();
          console.log('✅ Cache híbrido limpo com sucesso');
        } catch (error) {
          console.warn('⚠️ Erro ao limpar cache:', error);
        }
        
        const info = await getNextDrawInfo(currentLottery);
        setDrawInfo(info);
      } catch (error) {
        console.error('Erro ao carregar informações do próximo sorteio:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDrawInfo();
    
    // Recarregar a cada 30 minutos para garantir dados atualizados
    const interval = setInterval(loadDrawInfo, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentLottery]);

  const handleLotteryChange = (value: LotteryType) => {
    setCurrentLottery(value);
    onLotteryChange?.(value);
  };

  const handleRefresh = async () => {
    console.log('🔄 Atualização manual solicitada');
    setLoading(true);
    try {
      // Forçar limpeza completa do cache
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('lottery_cache_')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      await HybridLotteryCache.cleanup();
      
      const info = await getNextDrawInfo(currentLottery);
      setDrawInfo(info);
      console.log('✅ Dados atualizados manualmente');
    } catch (error) {
      console.error('Erro na atualização manual:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysText = (days: number) => {
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Amanhã';
    return `${days} dias`;
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 1) return 'text-red-600 bg-red-50 border-red-200';
    if (days <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-blue-500" />
            Próximo Sorteio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!drawInfo) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-blue-500" />
            Próximo Sorteio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar informações do próximo sorteio</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-blue-500" />
            Próximo Sorteio
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
              className="ml-2 h-6 w-6 p-0"
              title="Atualizar dados"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
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
        {/* Cabeçalho da loteria */}
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${lotteryColors[currentLottery]}`} />
          <div>
            <h3 className="font-semibold text-lg">{lotteryNames[currentLottery]}</h3>
            <p className="text-sm text-muted-foreground">
              {drawInfo.drawNumber > 0 ? `Concurso ${drawInfo.drawNumber}` : 'Aguardando dados...'}
            </p>
          </div>
        </div>

        {/* Prêmio estimado */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Prêmio Estimado</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(drawInfo.estimatedPrize)}
          </p>
        </div>

        {/* Data e tempo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Data</span>
            </div>
            <p className="text-sm font-semibold">
              {formatDate(drawInfo.date)}
            </p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Tempo</span>
            </div>
            <Badge 
              variant="outline" 
              className={`font-semibold ${getUrgencyColor(drawInfo.daysUntilDraw)}`}
            >
              {getDaysText(drawInfo.daysUntilDraw)}
            </Badge>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-2 pt-2 border-t">
          <Button className="w-full" asChild>
            <Link to="/apostas">
              Fazer Aposta
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/estatisticas">
              Ver Estatísticas
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}