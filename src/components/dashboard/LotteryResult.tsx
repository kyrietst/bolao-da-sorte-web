
import { LotteryResult as LotteryResultType, LotteryType } from '@/types';
import { LotteryNumbers } from '../lottery/LotteryNumbers';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

type LotteryResultCardProps = {
  result: LotteryResultType;
};

const getLotteryName = (type: LotteryType): string => {
  const names: Record<LotteryType, string> = {
    megasena: 'Mega-Sena',
    lotofacil: 'Lotofácil',
    quina: 'Quina',
    lotomania: 'Lotomania',
    timemania: 'Timemania',
    duplasena: 'Dupla Sena',
  };
  return names[type];
};

export default function LotteryResultCard({ result }: LotteryResultCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Formata a data para exibição (DD/MM/YYYY)
  const formattedDate = new Date(result.drawDate).toLocaleDateString('pt-BR');
  
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{getLotteryName(result.lotteryType)} - Concurso {result.drawNumber}</h3>
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
        </div>
      </div>
      <div className="p-4">
        <LotteryNumbers type={result.lotteryType} numbers={result.numbers} />
        <div className="mt-2 text-center">
          {result.accumulated ? (
            <p className="text-sm font-medium">Acumulou!</p>
          ) : (
            <p className="text-sm">
              {result.winners} {result.winners === 1 ? 'ganhador' : 'ganhadores'}
            </p>
          )}
        </div>
        
        {/* Detalhes dos prêmios */}
        {result.prizes && result.prizes.length > 0 && (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full mt-2 text-sm flex items-center justify-center"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Esconder detalhes
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Ver detalhes
                </>
              )}
            </Button>
            
            {showDetails && (
              <div className="mt-2 border-t pt-2 text-sm">
                <h4 className="font-medium mb-1">Premiações:</h4>
                <ul className="space-y-1">
                  {result.prizes.map((prize, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{prize.hits} acertos:</span>
                      <span className="font-medium">
                        {prize.winners} {prize.winners === 1 ? 'ganhador' : 'ganhadores'}, R$ {prize.prize}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
