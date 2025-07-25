import { Link } from 'react-router-dom';
import { Calendar, Users, Ticket, Trophy, Settings, Timer, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pool } from '@/types';
import { cn } from '@/lib/utils';

const lotteryConfig = {
  megasena: { 
    name: 'Mega-Sena', 
    color: 'bg-green-500', 
    icon: '🎱',
    gradient: 'from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10'
  },
};

interface EnhancedPoolCardProps {
  pool: Pool;
  isAdmin?: boolean;
  participantsCount?: number;
  className?: string;
}

export default function EnhancedPoolCard({ 
  pool, 
  isAdmin = false, 
  participantsCount = 0,
  className 
}: EnhancedPoolCardProps) {
  const lotteryInfo = lotteryConfig[pool.lotteryType];
  const progressPercentage = pool.maxParticipants > 0 
    ? (participantsCount / pool.maxParticipants) * 100 
    : 0;
  
  const totalPrize = pool.contributionAmount * participantsCount;
  const drawDate = new Date(pool.drawDate);
  const now = new Date();
  const daysUntilDraw = Math.ceil((drawDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const getStatusInfo = () => {
    if (pool.status === 'finalizado') {
      return { text: 'Premiado!', icon: <Crown className="h-4 w-4" />, variant: 'default' as const };
    }
    if (daysUntilDraw <= 0) {
      return { text: 'Sorteio Hoje!', icon: <Timer className="h-4 w-4" />, variant: 'destructive' as const };
    }
    if (daysUntilDraw <= 3) {
      return { text: `${daysUntilDraw} dias`, icon: <Timer className="h-4 w-4" />, variant: 'secondary' as const };
    }
    return { text: 'Aguardando Sorteio', icon: <Calendar className="h-4 w-4" />, variant: 'outline' as const };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm",
      `bg-gradient-to-br ${lotteryInfo.gradient}`,
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm",
              lotteryInfo.color
            )}>
              {lotteryInfo.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base truncate">{pool.name}</h3>
              <p className="text-sm text-muted-foreground">{lotteryInfo.name}</p>
            </div>
          </div>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1 whitespace-nowrap">
            {statusInfo.icon}
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prêmio Total Destacado */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">PRÊMIO TOTAL</span>
          </div>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">
            {totalPrize.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        {/* Informações do Bolão */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Valor por Cota</span>
            </div>
            <p className="font-semibold text-sm">
              {pool.contributionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Jogos</span>
            </div>
            <p className="font-semibold text-sm">{pool.numTickets} jogos</p>
          </div>
        </div>

        {/* Progresso de Participantes */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Participantes</span>
            <span className="text-sm text-muted-foreground">
              {participantsCount}/{pool.maxParticipants}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {pool.maxParticipants - participantsCount} cotas disponíveis
          </p>
        </div>

        {/* Data do Sorteio */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Sorteio: {drawDate.toLocaleDateString('pt-BR')}</span>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          {isAdmin && (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link to={`/boloes/${pool.id}/gerenciar`}>
                <Settings className="h-4 w-4 mr-1" />
                Gerenciar
              </Link>
            </Button>
          )}
          <Button variant="default" size="sm" asChild className="flex-1">
            <Link to={`/boloes/${pool.id}`}>
              Ver Detalhes
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}