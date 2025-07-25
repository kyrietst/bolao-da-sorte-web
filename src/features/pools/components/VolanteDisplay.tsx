import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket } from '@/types';

interface Jogo {
  numero: number;
  numbers: number[];
}

interface Volante {
  numero: string;
  jogos: Jogo[];
}

interface VolanteDisplayProps {
  tickets: Ticket[];
}

export default function VolanteDisplay({ tickets }: VolanteDisplayProps) {
  // Converter tickets do banco em volantes com jogos organizados
  const volantes: Volante[] = tickets.map(ticket => {
    const jogos: Jogo[] = [];
    const numbersPerJogo = 6; // Mega-Sena padrão
    const jogosPerVolante = 10; // 10 jogos por volante
    
    // Dividir os números do ticket em jogos de 6 números
    for (let i = 0; i < jogosPerVolante && (i * numbersPerJogo) < ticket.numbers.length; i++) {
      const startIndex = i * numbersPerJogo;
      const endIndex = startIndex + numbersPerJogo;
      const gameNumbers = ticket.numbers.slice(startIndex, endIndex);
      
      if (gameNumbers.length === numbersPerJogo) {
        jogos.push({
          numero: i + 1,
          numbers: gameNumbers.sort((a, b) => a - b)
        });
      }
    }
    
    return {
      numero: ticket.ticketNumber,
      jogos
    };
  });

  return (
    <div className="space-y-6">
      {volantes.length > 0 ? (
        volantes.map((volante) => (
          <Card key={volante.numero} className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Volante {volante.numero}</CardTitle>
                <Badge variant="outline" className="text-sm">
                  {volante.jogos.length} jogos
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {volante.jogos.length} jogos de 6 dezenas cada
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {volante.jogos.map((jogo) => (
                <div key={jogo.numero} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded text-xs font-medium">
                    {jogo.numero.toString().padStart(2, '0')}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {jogo.numbers.map((number, index) => (
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
              ))}
              
              {volante.jogos.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Volante incompleto</p>
                  <p className="text-xs">
                    Este volante não possui jogos suficientes ou tem números inválidos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum volante cadastrado ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Os volantes aparecerão aqui quando forem adicionados ao bolão.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}