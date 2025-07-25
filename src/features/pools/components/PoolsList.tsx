import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useUserPools } from '@/features/pools/hooks/useUserPools';
import { Loader2, Ticket } from 'lucide-react';
import { PoolStatusBadge } from '@/components/pool/PoolStatusBadge';
import CreatePoolForm from './CreatePoolForm';
import { EmptyState } from '@/components/ui/EmptyState';

const lotteryNames: Record<string, string> = {
  megasena: 'Mega-Sena',
};

export default function PoolsList() {
  const { user } = useAuth();
  const { pools, loading } = useUserPools(user);

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <EmptyState
        icon={<Ticket className="h-12 w-12 text-muted-foreground" />}
        title="Nenhum bolão encontrado"
        description="Você ainda não participa de nenhum bolão. Crie um novo para começar!"
      >
        <CreatePoolForm />
      </EmptyState>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/40 border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data do Sorteio</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ações</th>
          </tr>
        </thead>
        <tbody>
          {pools.map((pool) => (
            <tr key={pool.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
              <td className="py-3 px-4">{pool.name}</td>
              <td className="py-3 px-4">{lotteryNames[pool.lotteryType]}</td>
              <td className="py-3 px-4">{new Date(pool.drawDate).toLocaleDateString('pt-BR')}</td>
              <td className="py-3 px-4"><PoolStatusBadge status={pool.status} /></td>
              <td className="py-3 px-4 text-right">
                <Link to={`/boloes/${pool.id}`} className="text-primary hover:underline">
                  Ver Detalhes
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
