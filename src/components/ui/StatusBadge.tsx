
import { PaymentStatus } from '@/types';
import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: PaymentStatus;
};

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  confirmado: {
    label: 'Confirmado',
    className: 'bg-status-confirmado/10 text-status-confirmado border-status-confirmado/20',
  },
  pago: {
    label: 'Pago',
    className: 'bg-status-pago/10 text-status-pago border-status-pago/20',
  },
  pendente: {
    label: 'Pendente',
    className: 'bg-status-pendente/10 text-status-pendente border-status-pendente/20',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = statusConfig[status];
  
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
