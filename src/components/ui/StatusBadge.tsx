
import { PaymentStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: PaymentStatus;
}

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  confirmado: {
    label: 'Confirmado',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  pago: {
    label: 'Pago',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  pendente: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  ativo: {
    label: 'Ativo',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Fallback para status não configurados
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  
  const { label, className } = config;
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        className
      )}
    >
      {label}
    </span>
  );
}
