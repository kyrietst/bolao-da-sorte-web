
import { LotteryType } from '@/types';
import { cn } from '@/lib/utils';

type LotteryNumbersProps = {
  type: LotteryType;
  numbers: number[];
  size?: 'sm' | 'md' | 'lg';
};

export function LotteryNumbers({ type, numbers, size = 'md' }: LotteryNumbersProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const lotteryColors = {
    megasena: 'bg-lottery-megasena',
    lotofacil: 'bg-lottery-lotofacil',
    quina: 'bg-lottery-quina',
    lotomania: 'bg-lottery-lotomania',
    timemania: 'bg-lottery-timemania',
    duplasena: 'bg-lottery-duplasena',
  };
  
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {numbers.map((number, index) => (
        <div
          key={index}
          className={cn(
            'rounded-full flex items-center justify-center font-bold text-white shadow-sm',
            lotteryColors[type],
            sizeClasses[size]
          )}
        >
          {String(number).padStart(2, '0')}
        </div>
      ))}
    </div>
  );
}
