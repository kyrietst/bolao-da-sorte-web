
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LotteryNumbers } from '@/components/lottery/LotteryNumbers';
import { LotteryType } from '@/types';

type DrawnNumbersDisplayProps = {
  drawNumbers: number[];
  drawNumber: string;
  lotteryType: LotteryType;
};

export default function DrawnNumbersDisplay({ 
  drawNumbers, 
  drawNumber, 
  lotteryType 
}: DrawnNumbersDisplayProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Números Sorteados - Concurso {drawNumber}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LotteryNumbers 
          type={lotteryType} 
          numbers={drawNumbers} 
          size="md" 
        />
      </CardContent>
    </Card>
  );
}
