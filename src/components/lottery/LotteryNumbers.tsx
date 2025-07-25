
import { LotteryType } from '@/types';
import { cn } from '@/lib/utils';

interface LotteryNumbersProps {
  type: LotteryType;
  numbers: number[];
  size?: 'sm' | 'md' | 'lg';
}

export function LotteryNumbers({ type, numbers, size = 'md' }: LotteryNumbersProps) {
  // Log para debug
  console.log('🎯 LotteryNumbers recebeu:', { type, numbers, size });
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const lotteryColors = {
    megasena: 'bg-lottery-megasena',
  };
  
  // Validação dos números
  if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
    console.warn('⚠️ LotteryNumbers: números inválidos ou vazios', numbers);
    return (
      <div className="flex justify-center items-center p-4 text-gray-500">
        <span className="text-sm">Números não disponíveis</span>
      </div>
    );
  }
  
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
