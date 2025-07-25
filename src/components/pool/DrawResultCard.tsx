import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Calendar, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  Target,
  Search
} from 'lucide-react';
import { LotteryType, Pool, Ticket } from '@/types';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';
import { useLotteryDrawResult } from '@/hooks/useLotteryDrawResult';
import GameResultsModal from '@/components/pool/GameResultsModal';
import { isValidLotteryDate, getPreviousValidLotteryDate, getLotteryScheduleDescription } from '@/utils/lotterySchedule';

interface DrawResultCardProps {
  lotteryType: LotteryType;
  drawDate: string;
  pool?: Pool;
  tickets?: Ticket[];
}

const lotteryNames: Record<LotteryType, string> = {
  megasena: 'Mega-Sena',
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default function DrawResultCard({ lotteryType, drawDate, pool, tickets = [] }: DrawResultCardProps) {
  // Verificar se a data é válida para este tipo de loteria
  const isDateValid = isValidLotteryDate(lotteryType, drawDate);
  
  // Se a data não for válida, tentar buscar a data anterior válida
  const effectiveDrawDate = isDateValid ? drawDate : getPreviousValidLotteryDate(lotteryType, drawDate);
  
  const { loading, result, status, error, retry } = useLotteryDrawResult(lotteryType, effectiveDrawDate);

  const formatDate = (dateString: string): string => {
    try {
      // Se a data está no formato ISO (2025-05-22T00:00:00+00:00), extrair apenas a parte da data
      const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
      
      // Parse timezone-safe
      const [year, month, day] = dateOnly.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data do sorteio:', error);
      return 'Data inválida';
    }
  };

  // Aviso se a data não for válida para esta loteria
  if (!isDateValid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Data de Sorteio Inválida
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lotteryNames[lotteryType]} - {formatDate(drawDate)}
          </p>
        </CardHeader>
        <CardContent>
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Não há sorteio de {lotteryNames[lotteryType]} nesta data.
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {getLotteryScheduleDescription(lotteryType)}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Exibindo o último resultado disponível anterior a esta data.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
          {loading ? (
            <div className="flex items-center justify-center py-6 mt-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm text-muted-foreground">Buscando último resultado...</span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Resultado do Sorteio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Verificando resultado para {lotteryNames[lotteryType]}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">Carregando resultado...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Caso de erro na API mas sorteio ainda não aconteceu
  if (error && status.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Resultado do Sorteio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lotteryNames[lotteryType]} - {formatDate(drawDate)}
          </p>
        </CardHeader>
        <CardContent>
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <div className="font-medium mb-1">{status.message}</div>
                <div className="text-sm text-muted-foreground">
                  O resultado estará disponível após o sorteio.
                </div>
              </div>
              <Badge variant="outline" className="ml-2">
                {status.daysUntil > 0 ? `${status.daysUntil} dias` : 'Hoje'}
              </Badge>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Caso de erro na API para sorteio que já aconteceu
  if (error && (status.hasOccurred || status.isToday)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Resultado do Sorteio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lotteryNames[lotteryType]} - {formatDate(drawDate)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-3">
              Erro ao carregar resultado
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mb-4">
              {error}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retry}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sorteio ainda não aconteceu
  if (status.isPending && !result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Próximo Sorteio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lotteryNames[lotteryType]} - {formatDate(drawDate)}
          </p>
        </CardHeader>
        <CardContent>
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <div className="font-medium mb-1">{status.message}</div>
                <div className="text-sm text-muted-foreground">
                  O resultado estará disponível após o sorteio.
                </div>
              </div>
              <Badge variant="outline" className="ml-2">
                {status.daysUntil > 0 ? `${status.daysUntil} dias` : 'Hoje'}
              </Badge>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Exibir resultado (quando disponível)
  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Resultado do Sorteio
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {lotteryNames[lotteryType]} - Concurso {result.drawNumber}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(result.drawDate)}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status do draw */}
          <div className="flex items-center gap-2 mb-3">
            {status.hasOccurred ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : status.isToday ? (
              <Clock className="h-4 w-4 text-blue-500" />
            ) : (
              <Calendar className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">{status.message}</span>
          </div>

          {/* Números sorteados */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Números sorteados:</span>
            <LotteryNumbers 
              type={result.lotteryType} 
              numbers={result.numbers} 
              size="sm" 
            />
          </div>

          {/* Status do prêmio */}
          <div className="mt-4">
            {result.accumulated ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-800">Acumulou!</span>
                </div>
                <p className="text-sm text-red-700">
                  Nenhum ganhador da faixa principal neste concurso.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800">
                    {result.winners} {result.winners === 1 ? 'ganhador' : 'ganhadores'}
                  </span>
                </div>
                {result.prizes && result.prizes.length > 0 && (
                  <p className="text-sm text-green-700">
                    Prêmio principal: {result.prizes[0].prize}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Premiações detalhadas */}
          {result.prizes && result.prizes.length > 1 && (
            <div className="mt-4 space-y-2">
              <span className="text-sm font-medium">Outras premiações:</span>
              <div className="space-y-1">
                {result.prizes.slice(1, 4).map((prize, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      {prize.hits}:
                    </span>
                    <div className="text-right">
                      <span className="font-medium">
                        {prize.winners} {prize.winners === 1 ? 'ganhador' : 'ganhadores'}
                      </span>
                      <div className="text-green-600 font-semibold">
                        {prize.prize}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão para conferir jogos */}
          <div className="pt-4 border-t">
            {pool && tickets.length > 0 ? (
              <GameResultsModal
                pool={pool}
                tickets={tickets}
                drawResult={result}
              >
                <Button variant="outline" className="w-full gap-2">
                  <Search className="h-4 w-4" />
                  Conferir Meus Jogos
                </Button>
              </GameResultsModal>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                Nenhum jogo para conferir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado inesperado
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resultado do Sorteio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <p className="text-sm text-muted-foreground">
            Informações do sorteio não disponíveis
          </p>
        </div>
      </CardContent>
    </Card>
  );
}