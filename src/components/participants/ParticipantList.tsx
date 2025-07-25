
import { usePoolDetail } from '@/features/pools/providers/PoolDetailProvider';
import StatusBadge from '../ui/StatusBadge';

export default function ParticipantList() {
  const { participants, isAdmin } = usePoolDetail();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            {isAdmin && (
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            )}
          </tr>
        </thead>
        <tbody>
          {participants.map((participant) => (
            <tr key={participant.id} className="border-b border-border hover:bg-muted/20">
              <td className="px-4 py-3">{participant.name}</td>
              <td className="px-4 py-3">{participant.email}</td>
              <td className="px-4 py-3">
                <StatusBadge status={participant.status} />
              </td>
              {isAdmin && (
                <td className="px-4 py-3 text-right">
                  <button 
                    className="text-sm font-medium text-primary hover:text-primary/80"
                    onClick={() => {
                      // This will be implemented when we integrate with Supabase
                      console.log(`Confirm payment for ${participant.id}`);
                    }}
                  >
                    Confirmar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
