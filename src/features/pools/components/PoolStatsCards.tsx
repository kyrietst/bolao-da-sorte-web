import { Users, DollarSign, Ticket, Target, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Pool } from '@/types';
import { cn } from '@/lib/utils';

interface PoolStatsCardsProps {
  pool: Pool;
  participantsCount: number;
  confirmedParticipants?: number;
  totalPrize: number;
  className?: string;
}

export default function PoolStatsCards({ 
  pool, 
  participantsCount, 
  confirmedParticipants = 0,
  totalPrize,
  className 
}: PoolStatsCardsProps) {
  const progressPercentage = pool.maxParticipants > 0 
    ? (participantsCount / pool.maxParticipants) * 100 
    : 0;
  
  const confirmationRate = participantsCount > 0 
    ? (confirmedParticipants / participantsCount) * 100 
    : 0;

  const drawDate = new Date(pool.drawDate);
  const now = new Date();
  const daysUntilDraw = Math.ceil((drawDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const stats = [
    {
      title: 'Participantes',
      value: `${participantsCount}/${pool.maxParticipants}`,
      description: `${progressPercentage.toFixed(0)}% preenchido`,
      icon: Users,
      gradient: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      progress: progressPercentage,
      trend: participantsCount > pool.maxParticipants / 2 ? 'up' : 'stable'
    },
    {
      title: 'Prêmio Acumulado',
      value: totalPrize.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      description: `${pool.contributionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por cota`,
      icon: DollarSign,
      gradient: 'from-green-500/20 to-green-600/20',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30'
    },
    {
      title: 'Bilhetes',
      value: pool.numTickets.toString(),
      description: 'jogos cadastrados',
      icon: Ticket,
      gradient: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30'
    },
    {
      title: 'Pagamentos',
      value: `${confirmedParticipants}/${participantsCount}`,
      description: `${confirmationRate.toFixed(0)}% confirmados`,
      icon: Target,
      gradient: 'from-orange-500/20 to-orange-600/20',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      progress: confirmationRate
    },
    {
      title: 'Sorteio',
      value: daysUntilDraw <= 0 ? 'Hoje!' : `${daysUntilDraw} dias`,
      description: drawDate.toLocaleDateString('pt-BR'),
      icon: Clock,
      gradient: 'from-red-500/20 to-red-600/20',
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      urgent: daysUntilDraw <= 3
    },
    {
      title: 'Taxa de Sucesso',
      value: `${Math.min(progressPercentage, 100).toFixed(0)}%`,
      description: 'do objetivo alcançado',
      icon: TrendingUp,
      gradient: 'from-indigo-500/20 to-indigo-600/20',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
      progress: Math.min(progressPercentage, 100)
    }
  ];

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className={cn("p-6", stat.bgColor)}>
            {/* Background Gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-50",
              stat.gradient
            )} />
            
            {/* Content */}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  "bg-white/80 dark:bg-gray-800/80 shadow-sm"
                )}>
                  <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                </div>
                
                {stat.urgent && (
                  <Badge variant="destructive" className="text-xs">
                    Urgente
                  </Badge>
                )}
                
                {stat.trend === 'up' && (
                  <Badge variant="default" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Alta
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>

                {stat.progress !== undefined && (
                  <div className="mt-3">
                    <Progress 
                      value={stat.progress} 
                      className="h-2" 
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}