import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket } from '@/types';

interface LotteryGamesDisplayProps {
  tickets: Ticket[];
}

export default function LotteryGamesDisplay({ tickets }: LotteryGamesDisplayProps) {
  // Calcular jogos baseados nos tickets reais do banco Supabase
  const games = [];
  
  tickets.forEach((ticket) => {
    // Cada ticket tem um array de números
    // Vamos dividir em grupos de 6 números (padrão Mega-Sena)
    const numbersPerGame = 6;
    const ticketNumbers = ticket.numbers;
    
    for (let i = 0; i < ticketNumbers.length; i += numbersPerGame) {
      const gameNumbers = ticketNumbers.slice(i, i + numbersPerGame);
      if (gameNumbers.length === numbersPerGame) {
        games.push({
          id: games.length + 1,
          ticketNumber: ticket.ticketNumber,
          numbers: gameNumbers.sort((a, b) => a - b)
        });
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jogos Realizados</CardTitle>
        <p className="text-sm text-muted-foreground">
          Confira todas as dezenas apostadas neste bolão.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {games.length > 0 ? (
          games.map((game) => (
            <div key={`${game.ticketNumber}-${game.id}`} className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground min-w-[60px]">
                Jogo {game.id}
              </span>
              <div className="flex gap-2 flex-wrap">
                {game.numbers.map((number, index) => (
                  <Badge 
                    key={index}
                    variant="secondary"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white hover:bg-blue-600"
                  >
                    {number.toString().padStart(2, '0')}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum jogo cadastrado ainda</p>
            <p className="text-xs">Os bilhetes aparecerão aqui quando forem adicionados ao bolão.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}