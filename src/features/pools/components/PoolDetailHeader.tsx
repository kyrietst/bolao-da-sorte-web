import { Share2, Settings, Users, Calendar, Trophy, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

interface PoolDetailHeaderProps {
  pool: Pool;
  participantsCount: number;
  isAdmin: boolean;
  totalPrize: number;
}

export default function PoolDetailHeader({ 
  pool, 
  participantsCount, 
  isAdmin, 
  totalPrize 
}: PoolDetailHeaderProps) {
  const lotteryInfo = lotteryConfig[pool.lotteryType];
  const drawDate = new Date(pool.drawDate);
  const now = new Date();
  const daysUntilDraw = Math.ceil((drawDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const getStatusInfo = () => {
    if (pool.status === 'finalizado') {
      return { text: 'Finalizado', variant: 'secondary' as const, icon: <Trophy className="h-4 w-4" /> };
    }
    if (daysUntilDraw <= 0) {
      return { text: 'Sorteio Hoje!', variant: 'destructive' as const, icon: <Calendar className="h-4 w-4" /> };
    }
    if (daysUntilDraw <= 3) {
      return { text: `${daysUntilDraw} dias`, variant: 'secondary' as const, icon: <Calendar className="h-4 w-4" /> };
    }
    return { text: 'Ativo', variant: 'default' as const, icon: <Users className="h-4 w-4" /> };
  };

  const statusInfo = getStatusInfo();
  const progressPercentage = pool.maxParticipants > 0 
    ? (participantsCount / pool.maxParticipants) * 100 
    : 0;

  return (
    <Card className={cn(
      "border-0 shadow-md mb-6 overflow-hidden",
      `bg-gradient-to-br ${lotteryInfo.gradient}`
    )}>
      <CardContent className="p-6">
        {/* Navegação e Ações */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/meus-boloes">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            {isAdmin && (
              <Button variant="default" size="sm" className="gap-2" asChild>
                <Link to={`/boloes/${pool.id}/gerenciar`}>
                  <Settings className="h-4 w-4" />
                  Gerenciar
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Cabeçalho Principal */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Informações do Bolão */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white text-lg",
                lotteryInfo.color
              )}>
                {lotteryInfo.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground mb-1 break-words">
                  {pool.name}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {lotteryInfo.name} • Sorteio em {drawDate.toLocaleDateString('pt-BR')}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                    {statusInfo.icon}
                    {statusInfo.text}
                  </Badge>
                  {isAdmin && (
                    <Badge variant="outline" className="text-xs">
                      Organizador
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Progresso de Participantes */}
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Participantes</span>
                <span className="text-sm text-muted-foreground">
                  {participantsCount}/{pool.maxParticipants}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className={cn("h-2 rounded-full transition-all duration-300", lotteryInfo.color)}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progressPercentage >= 100 
                  ? 'Bolão completo!' 
                  : `${pool.maxParticipants - participantsCount} cotas disponíveis`
                }
              </p>
            </div>
          </div>

          {/* Cards de Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">PRÊMIO TOTAL</span>
              </div>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {totalPrize.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">VALOR DA COTA</span>
              </div>
              <p className="text-lg font-bold">
                {pool.contributionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
              <span className="text-xs font-medium text-muted-foreground block mb-1">BILHETES</span>
              <p className="text-lg font-bold">{pool.numTickets} jogos</p>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
              <span className="text-xs font-medium text-muted-foreground block mb-1">DIAS RESTANTES</span>
              <p className="text-lg font-bold">
                {daysUntilDraw <= 0 ? 'Hoje!' : `${daysUntilDraw} dias`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}