
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, Award } from 'lucide-react';

type ResultStatsProps = {
  maxHits: number;
  prizeWinners: number;
  totalPrize: number;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function ResultsStats({ maxHits, prizeWinners, totalPrize }: ResultStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-center">
          <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-blue-900">{maxHits}</div>
          <p className="text-sm text-blue-700">Maior Acerto</p>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4 text-center">
          <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
          <div className="text-2xl font-bold text-yellow-900">{prizeWinners}</div>
          <p className="text-sm text-yellow-700">Bilhetes Premiados</p>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 text-center">
          <Award className="h-6 w-6 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-green-900">{formatCurrency(totalPrize)}</div>
          <p className="text-sm text-green-700">Prêmio Total</p>
        </CardContent>
      </Card>
    </div>
  );
}
