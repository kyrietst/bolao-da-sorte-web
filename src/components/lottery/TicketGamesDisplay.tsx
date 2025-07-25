
import { Ticket } from '@/types';
import { usePoolDetail } from '@/features/pools/providers/PoolDetailProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface TicketGamesDisplayProps {
  ticket: Ticket;
  gamesPerTicket?: number;
  numbersPerGame?: number;
}

export default function TicketGamesDisplay({ 
  ticket, 
  gamesPerTicket = 10, 
  numbersPerGame = 6 
}: TicketGamesDisplayProps) {
  const { pool } = usePoolDetail();
  const type = pool?.lotteryType;
  // Dividir os números do bilhete em jogos
  const games = [];
  const totalNumbers = ticket.numbers.length;
  const numbersUsed = Math.min(totalNumbers, gamesPerTicket * numbersPerGame);
  
  for (let i = 0; i < gamesPerTicket && i * numbersPerGame < numbersUsed; i++) {
    const gameNumbers = ticket.numbers.slice(
      i * numbersPerGame, 
      (i + 1) * numbersPerGame
    );
    if (gameNumbers.length === numbersPerGame) {
      games.push(gameNumbers);
    }
  }

  const lotteryColors = {
    megasena: 'bg-lottery-megasena',
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Bilhete {ticket.ticketNumber}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {games.length} {games.length === 1 ? 'jogo' : 'jogos'}
            </Badge>
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {games.map((gameNumbers, gameIndex) => (
          <div key={gameIndex} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-6">
              {String(gameIndex + 1).padStart(2, '0')}
            </span>
            <div className="flex flex-wrap gap-1">
              {gameNumbers.map((number, numberIndex) => (
                <div
                  key={numberIndex}
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${lotteryColors[type]}`}
                >
                  {String(number).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {games.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Números insuficientes para formar jogos</p>
            <p className="text-xs">
              Este bilhete tem {ticket.numbers.length} números, 
              mas são necessários {gamesPerTicket * numbersPerGame} números 
              para {gamesPerTicket} jogos de {numbersPerGame} números cada.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
