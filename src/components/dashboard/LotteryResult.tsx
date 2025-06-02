
import { LotteryResult as LotteryResultType, LotteryType } from '@/types';
import { LotteryNumbers } from '../lottery/LotteryNumbers';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';

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

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function LotteryResultCard({ result }: LotteryResultCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Formata a data para exibição (DD/MM/YYYY)
  const formattedDate = new Date(result.drawDate).toLocaleDateString('pt-BR');
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">{getLotteryName(result.lotteryType)}</h3>
          </div>
          <span className="text-sm font-medium text-gray-600">Concurso {result.drawNumber}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Números sorteados com cores da loteria */}
        <div className="mb-4">
          <LotteryNumbers type={result.lotteryType} numbers={result.numbers} size="sm" />
        </div>
        
        {/* Status */}
        <div className="text-center">
          {result.accumulated ? (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-red-800 font-semibold text-sm">Acumulou!</p>
              <p className="text-xs text-red-600 mt-1">
                Próximo prêmio estimado em R$ 50.000.000,00
              </p>
            </div>
          ) : (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-800 font-semibold text-sm">
                {result.winners} {result.winners === 1 ? 'ganhador' : 'ganhadores'}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Prêmio total de R$ 15.000.000,00
              </p>
            </div>
          )}
        </div>
        
        {/* Details Toggle */}
        {result.prizes && result.prizes.length > 0 && (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full mt-3 text-xs text-gray-600 hover:text-gray-800"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Ocultar Detalhes
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Ver Detalhes
                </>
              )}
            </Button>
            
            {showDetails && (
              <div className="mt-3 border-t pt-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Premiações:</h4>
                <div className="space-y-1">
                  {result.prizes.map((prize, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">{prize.hits} acertos:</span>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">
                          {prize.winners} {prize.winners === 1 ? 'ganhador' : 'ganhadores'}
                        </span>
                        <div className="text-green-600 font-semibold">
                          {formatCurrency(parseFloat(prize.prize.replace(/[^\d,]/g, '').replace(',', '.')) || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
