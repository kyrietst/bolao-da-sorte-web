import { useState } from 'react';
import { Grid, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import EnhancedPoolCard from './EnhancedPoolCard';
import { Pool } from '@/types';
import { cn } from '@/lib/utils';

interface PoolsDisplayProps {
  pools: Pool[];
  loading?: boolean;
  isAdmin?: boolean;
  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: React.ReactNode;
  participantsCounts?: Record<string, number>;
  className?: string;
}

type ViewMode = 'cards' | 'table';

export default function PoolsDisplay({
  pools = [],
  loading = false,
  isAdmin = false,
  emptyStateIcon,
  emptyStateTitle = "Nenhum bolão encontrado",
  emptyStateDescription = "Não há bolões para exibir no momento.",
  emptyStateAction,
  participantsCounts = {},
  className
}: PoolsDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

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
        icon={emptyStateIcon}
        title={emptyStateTitle}
        description={emptyStateDescription}
      >
        {emptyStateAction}
      </EmptyState>
    );
  }

  const TableView = () => (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/40 border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Bolão</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Prêmio</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Participantes</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Sorteio</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ações</th>
          </tr>
        </thead>
        <tbody>
          {pools.map((pool) => {
            const participantsCount = participantsCounts[pool.id] || 0;
            const totalPrize = pool.contributionAmount * participantsCount;
            
            return (
              <tr key={pool.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full bg-gradient-to-b from-primary to-primary/70" />
                    <div>
                      <p className="font-medium">{pool.name}</p>
                      <p className="text-sm text-muted-foreground">{pool.lotteryType}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-semibold text-green-600">
                      {totalPrize.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pool.contributionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por cota
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">{participantsCount}/{pool.maxParticipants}</p>
                    <p className="text-xs text-muted-foreground">
                      {((participantsCount / pool.maxParticipants) * 100).toFixed(0)}% preenchido
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {new Date(pool.drawDate).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  {isAdmin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/boloes/${pool.id}/gerenciar`}>Gerenciar</a>
                    </Button>
                  )}
                  <Button variant="default" size="sm" asChild>
                    <a href={`/boloes/${pool.id}`}>Ver Detalhes</a>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const CardsView = () => (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
      className
    )}>
      {pools.map((pool) => (
        <EnhancedPoolCard
          key={pool.id}
          pool={pool}
          isAdmin={isAdmin}
          participantsCount={participantsCounts[pool.id] || 0}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controles de Visualização */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {pools.length} {pools.length === 1 ? 'bolão encontrado' : 'bolões encontrados'}
        </p>
        
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="h-8 px-3"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8 px-3"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      {viewMode === 'cards' ? <CardsView /> : <TableView />}
    </div>
  );
}