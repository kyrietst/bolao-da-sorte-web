
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, Award, TrendingUp } from 'lucide-react';

type EnhancedResultsStatsProps = {
  maxHits: number;
  prizeWinners: number;
  totalPrize: number;
  totalTickets: number;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function EnhancedResultsStats({ 
  maxHits, 
  prizeWinners, 
  totalPrize,
  totalTickets 
}: EnhancedResultsStatsProps) {
  const winRate = totalTickets > 0 ? (prizeWinners / totalTickets * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 overflow-hidden relative">
        <CardContent className="p-4 text-center relative z-10">
          <div className="flex items-center justify-center mb-2">
            <Target className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-1">{maxHits}</div>
          <p className="text-sm text-blue-700 font-medium">Maior Acerto</p>
        </CardContent>
        <div className="absolute -bottom-4 -right-4 opacity-10">
          <Target className="h-16 w-16 text-blue-600" />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 overflow-hidden relative">
        <CardContent className="p-4 text-center relative z-10">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-900 mb-1">{prizeWinners}</div>
          <p className="text-sm text-yellow-700 font-medium">Bilhetes Premiados</p>
        </CardContent>
        <div className="absolute -bottom-4 -right-4 opacity-10">
          <Trophy className="h-16 w-16 text-yellow-600" />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 overflow-hidden relative">
        <CardContent className="p-4 text-center relative z-10">
          <div className="flex items-center justify-center mb-2">
            <Award className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900 mb-1">{formatCurrency(totalPrize)}</div>
          <p className="text-sm text-green-700 font-medium">Prêmio Total</p>
        </CardContent>
        <div className="absolute -bottom-4 -right-4 opacity-10">
          <Award className="h-16 w-16 text-green-600" />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 overflow-hidden relative">
        <CardContent className="p-4 text-center relative z-10">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900 mb-1">{winRate.toFixed(1)}%</div>
          <p className="text-sm text-purple-700 font-medium">Taxa de Acerto</p>
        </CardContent>
        <div className="absolute -bottom-4 -right-4 opacity-10">
          <TrendingUp className="h-16 w-16 text-purple-600" />
        </div>
      </Card>
    </div>
  );
}
