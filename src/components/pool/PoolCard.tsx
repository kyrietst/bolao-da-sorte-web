import { Link } from 'react-router-dom';
import { Pool } from '@/types';
import { PoolStatusBadge } from './PoolStatusBadge';

interface PoolCardProps {
  pool: Pool;
}

export const PoolCard = ({ pool }: PoolCardProps) => {
  const getLotteryName = (type: string) => {
    const lotteryNames: Record<string, string> = {
      megasena: 'Mega-Sena',
      lotofacil: 'Lotofácil',
      quina: 'Quina',
      lotomania: 'Lotomania',
      timemania: 'Timemania',
      duplasena: 'Dupla Sena',
    };
    return lotteryNames[type] || type;
  };

  return (
    <Link
      key={pool.id}
      to={`/boloes/${pool.id}`}
      className="bg-card border border-border rounded-lg p-6 hover:border-primary/20 hover:bg-muted/20 transition-colors flex flex-col justify-between h-full"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2 truncate" title={pool.name}>{pool.name}</h3>
        <div className="flex justify-between text-sm text-muted-foreground mb-4">
          <span>
            {getLotteryName(pool.lotteryType)}
          </span>
          <span>Sorteio: {new Date(pool.drawDate).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <PoolStatusBadge status={pool.status} />
        <span className="text-sm font-medium text-primary">Ver detalhes →</span>
      </div>
    </Link>
  );
};
