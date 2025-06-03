
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { Pool } from '@/types';

type EmptyResultsStateProps = {
  pool: Pool;
  ticketsCount: number;
};

export default function EmptyResultsState({ pool, ticketsCount }: EmptyResultsStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Verificar Resultados dos Bilhetes
        </h3>
        <p className="text-gray-600 mb-4">
          Clique em "Verificar Resultados" para conferir os bilhetes deste bolão 
          contra o último sorteio da {pool.lotteryType}.
        </p>
        <p className="text-sm text-gray-500">
          {ticketsCount} {ticketsCount === 1 ? 'bilhete cadastrado' : 'bilhetes cadastrados'}
        </p>
      </CardContent>
    </Card>
  );
}
