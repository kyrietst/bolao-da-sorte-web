
import { Badge } from '@/components/ui/badge';

type GameResult = {
  gameNumbers: number[];
  hits: number;
  matchedNumbers: number[];
};

type GameResultDisplayProps = {
  gameResult: GameResult;
  gameIndex: number;
  lotteryColors: Record<string, string>;
  lotteryType: string;
};

export default function GameResultDisplay({ 
  gameResult, 
  gameIndex, 
  lotteryColors, 
  lotteryType 
}: GameResultDisplayProps) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">
          Volante {String(gameIndex + 1).padStart(2, '0')}
        </span>
        <Badge 
          variant={gameResult.hits > 0 ? "default" : "secondary"} 
          className={`text-xs ${gameResult.hits > 0 ? 'bg-green-600 text-white' : ''}`}
        >
          {gameResult.hits} {gameResult.hits === 1 ? 'acerto' : 'acertos'}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {gameResult.gameNumbers.map((number, numberIndex) => {
          const isWinning = gameResult.matchedNumbers.includes(number);
          return (
            <div
              key={numberIndex}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                isWinning 
                  ? 'bg-green-500 ring-2 ring-green-300' 
                  : lotteryColors[lotteryType]
              }`}
            >
              {String(number).padStart(2, '0')}
            </div>
          );
        })}
      </div>
    </div>
  );
}
