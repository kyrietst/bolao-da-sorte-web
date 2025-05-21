
import { LotteryType } from '@/types';
import { cn } from '@/lib/utils';

type LotteryNumbersProps = {
  type: LotteryType;
  numbers: number[];
  size?: 'sm' | 'md' | 'lg';
};

export function LotteryNumbers({ type, numbers, size = 'md' }: LotteryNumbersProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };
  
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {numbers.map((number, index) => (
        <div
          key={index}
          className={cn(
            `rounded-full flex items-center justify-center font-semibold text-white`,
            `bg-lottery-${type}`,
            sizeClasses[size]
          )}
        >
          {number}
        </div>
      ))}
    </div>
  );
}
