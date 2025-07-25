import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberMatrixProps {
  allNumbers: number[];
  volanteNumero: string;
}

export default function NumberMatrix({ allNumbers, volanteNumero }: NumberMatrixProps) {
  // Contar frequência de cada número
  const numberFrequency = allNumbers.reduce((acc, num) => {
    acc[num] = (acc[num] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Criar matriz de números de 1 a 60
  const matrix = Array.from({ length: 60 }, (_, i) => i + 1);
  const maxFrequency = Math.max(...Object.values(numberFrequency));

  // Agrupar números em linhas de 10
  const rows = [];
  for (let i = 0; i < matrix.length; i += 10) {
    rows.push(matrix.slice(i, i + 10));
  }

  const getNumberStyle = (number: number) => {
    const frequency = numberFrequency[number] || 0;
    if (frequency === 0) {
      return "bg-gray-100 text-gray-400 dark:bg-gray-800";
    }
    
    const intensity = frequency / maxFrequency;
    if (intensity === 1) {
      return "bg-blue-600 text-white font-bold border-2 border-blue-800";
    } else if (intensity > 0.7) {
      return "bg-blue-500 text-white font-semibold";
    } else if (intensity > 0.4) {
      return "bg-blue-400 text-white";
    } else {
      return "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Matriz de Números - Volante {volanteNumero}
          </CardTitle>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {Object.keys(numberFrequency).length} números únicos
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Legenda */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Frequência:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 border dark:bg-gray-800"></div>
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-200 border"></div>
            <span>Baixa</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 border"></div>
            <span>Alta</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 border-2 border-blue-800"></div>
            <span>Máxima</span>
          </div>
        </div>

        {/* Matriz de números */}
        <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {row.map((number) => {
                const frequency = numberFrequency[number] || 0;
                return (
                  <div
                    key={number}
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center text-xs transition-all hover:scale-110 cursor-default border",
                      getNumberStyle(number)
                    )}
                    title={`Número ${number}: aparece ${frequency} vez(es)`}
                  >
                    {number.toString().padStart(2, '0')}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold">{allNumbers.length} números</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-xs text-muted-foreground">Únicos</p>
            <p className="text-sm font-semibold">{Object.keys(numberFrequency).length}</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-xs text-muted-foreground">Mais usado</p>
            <p className="text-sm font-semibold">{maxFrequency}x</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}