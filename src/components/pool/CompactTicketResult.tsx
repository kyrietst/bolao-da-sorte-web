
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Trophy, Target } from 'lucide-react';
import { Ticket } from '@/types';
import { cn } from '@/lib/utils';

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

type CompactTicketResultProps = {
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

export default function CompactTicketResult({ 
  result, 
  lotteryColors, 
  lotteryType 
}: CompactTicketResultProps) {
  const [isOpen, setIsOpen] = useState(false);
  const maxGameHits = Math.max(...result.gameResults.map(g => g.hits), 0);
  const gamesWithHits = result.gameResults.filter(g => g.hits > 0).length;

  return (
    <Card className={cn(
      "transition-all duration-200",
      result.prizeValue > 0 ? "border-yellow-200 bg-yellow-50" : "",
      maxGameHits >= 4 ? "border-green-200 bg-green-50" : ""
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-gray-50/80 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    #{result.ticket.ticketNumber}
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-400 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} />
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={result.totalHits >= 4 ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      result.totalHits >= 4 ? "bg-green-600" : ""
                    )}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    {result.totalHits}
                  </Badge>
                  
                  {gamesWithHits > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {gamesWithHits}/{result.gameResults.length} volantes
                    </Badge>
                  )}
                  
                  {result.prizeValue > 0 && (
                    <Badge className="bg-yellow-500 text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
                      {formatCurrency(result.prizeValue)}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {maxGameHits}
                </div>
                <div className="text-xs text-gray-500">
                  maior acerto
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="border-t pt-4 space-y-3">
              {result.gameResults.map((gameResult, gameIndex) => (
                <div key={gameIndex} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500 w-6">
                    {String(gameIndex + 1).padStart(2, '0')}
                  </span>
                  
                  <div className="flex gap-1.5 flex-1">
                    {gameResult.gameNumbers.map((number, numberIndex) => {
                      const isWinning = gameResult.matchedNumbers.includes(number);
                      return (
                        <div
                          key={numberIndex}
                          className={cn(
                            'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                            isWinning 
                              ? 'bg-green-500' 
                              : lotteryColors[lotteryType]
                          )}
                        >
                          {String(number).padStart(2, '0')}
                        </div>
                      );
                    })}
                  </div>
                  
                  {gameResult.hits > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {gameResult.hits}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
