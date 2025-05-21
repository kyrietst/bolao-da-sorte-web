
import { LotteryResult as LotteryResultType, LotteryType } from '@/types';
import { LotteryNumbers } from '../lottery/LotteryNumbers';

type LotteryResultCardProps = {
  result: LotteryResultType;
};

const getLotteryName = (type: LotteryType): string => {
  const names: Record<LotteryType, string> = {
    megasena: 'Mega-Sena',
    lotofacil: 'Lotofácil',
    quina: 'Quina',
    lotomania: 'Lotomania',
    timemania: 'Timemania',
    duplasena: 'Dupla Sena',
  };
  return names[type];
};

export default function LotteryResultCard({ result }: LotteryResultCardProps) {
  const formattedDate = new Date(result.drawDate).toLocaleDateString('pt-BR');
  
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{getLotteryName(result.lotteryType)} - Concurso {result.drawNumber}</h3>
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
        </div>
      </div>
      <div className="p-4">
        <LotteryNumbers type={result.lotteryType} numbers={result.numbers} />
        <div className="mt-2 text-center">
          {result.accumulated ? (
            <p className="text-sm font-medium">Acumulou!</p>
          ) : (
            <p className="text-sm">
              {result.winners} {result.winners === 1 ? 'ganhador' : 'ganhadores'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
