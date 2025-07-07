
import { Badge } from '@/components/ui/badge';
import { Ticket } from '@/types';
import GameResultDisplay from './GameResultDisplay';

type GameResult = {
  gameNumbers: number[];
  hits: number;
  matchedNumbers: number[];
};

type TicketResult = {
  ticket: Ticket;
  totalHits: number;
  gameResults: GameResult[];
  prizeValue: number;
};

type TicketResultDisplayProps = {
  result: TicketResult;
  lotteryColors: Record<string, string>;
  lotteryType: string;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function TicketResultDisplay({ 
  result, 
  lotteryColors, 
  lotteryType 
}: TicketResultDisplayProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Bilhete {result.ticket.ticketNumber}</h4>
          <Badge 
            variant={result.totalHits >= 4 ? "default" : "secondary"}
            className={result.totalHits >= 4 ? "bg-green-600" : ""}
          >
            {result.totalHits} {result.totalHits === 1 ? 'acerto total' : 'acertos totais'}
          </Badge>
          {result.prizeValue > 0 && (
            <Badge className="bg-yellow-500">
              {formatCurrency(result.prizeValue)}
            </Badge>
          )}
        </div>
      </div>
      
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-3">Volantes jogados:</h5>
        <div className="space-y-4">
          {result.gameResults.map((gameResult, gameIndex) => (
            <GameResultDisplay
              key={gameIndex}
              gameResult={gameResult}
              gameIndex={gameIndex}
              lotteryColors={lotteryColors}
              lotteryType={lotteryType}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
