import { cn } from '@/lib/utils';
import { Pool } from '@/types';

interface PoolStatusBadgeProps {
  status: Pool['status'];
}

export const PoolStatusBadge = ({ status }: PoolStatusBadgeProps) => {
  const isAtivo = status === 'ativo';
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': isAtivo,
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300': !isAtivo,
        }
      )}
    >
      {isAtivo ? 'Ativo' : 'Finalizado'}
    </span>
  );
};
