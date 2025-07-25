import { useState } from 'react';
import { Share2, Users, Receipt, Target, ArrowLeft, Calendar, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pool, Ticket, Competition } from '@/types';
import { cn } from '@/lib/utils';
import DrawResultCard from '@/components/pool/DrawResultCard';
import BuyShareModal from '@/components/pool/BuyShareModal';
import DigitalReceiptModal from '@/components/pool/DigitalReceiptModal';
import InviteFriendsModal from '@/components/pool/InviteFriendsModal';
import CompetitionRanking from '@/components/ranking/CompetitionRanking';

interface PoolDetailLayoutProps {
  pool: Pool;
  participantsCount: number;
  totalPrize: number;
  isAdmin: boolean;
  tickets?: Ticket[];
  activeCompetition?: Competition;
  currentUserId?: string;
  children: React.ReactNode;
}

export default function PoolDetailLayout({
  pool,
  participantsCount,
  totalPrize,
  isAdmin,
  tickets = [],
  activeCompetition,
  currentUserId,
  children
}: PoolDetailLayoutProps) {
  const lotteryNames = {
    megasena: 'Mega-Sena',
  };

  // Função para formatar a data do sorteio com timezone-safe
  const formatDrawDate = (dateString: string): string => {
    try {
      // Se a data está no formato ISO (2025-05-22T00:00:00+00:00), extrair apenas a parte da data
      const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
      
      // Parse timezone-safe
      const [year, month, day] = dateOnly.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data do sorteio:', error);
      return 'Data inválida';
    }
  };

  const progressPercentage = pool.maxParticipants > 0 
    ? (participantsCount / pool.maxParticipants) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar com Informações do Bolão */}
          <div className="lg:col-span-1 space-y-4">
            {/* Header Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Link to="/meus-boloes">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Voltar
                    </Button>
                  </Link>
                </div>
                <div>
                  <h1 className="text-xl font-bold">{pool.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {lotteryNames[pool.lotteryType] || pool.lotteryType}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Estatísticas Principais */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Valor da Cota</span>
                    </div>
                    <p className="text-lg font-bold">
                      R$ {pool.contributionAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Cotas</span>
                    </div>
                    <p className="text-lg font-bold">
                      {participantsCount} / {pool.maxParticipants}
                    </p>
                  </div>

                  <div className="col-span-2 text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Total de Volantes</span>
                    </div>
                    <p className="text-lg font-bold">{pool.numTickets} volantes</p>
                  </div>

                  <div className="col-span-2 text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Data do Sorteio</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {formatDrawDate(pool.drawDate)}
                    </p>
                  </div>
                </div>

                {/* Progresso */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Comissão do Org.</span>
                    <span className="text-sm text-muted-foreground">10%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: '10%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <BuyShareModal 
                  pool={pool} 
                  currentParticipants={participantsCount}
                >
                  <Button className="w-full" size="lg">
                    Comprar Cota
                  </Button>
                </BuyShareModal>
                <InviteFriendsModal pool={pool}>
                  <Button variant="outline" className="w-full gap-2">
                    <Share2 className="h-4 w-4" />
                    Convidar Amigos
                  </Button>
                </InviteFriendsModal>
                {isAdmin && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/boloes/${pool.id}/gerenciar`}>
                      Gerenciar Bolão
                    </Link>
                  </Button>
                )}
                <DigitalReceiptModal pool={pool}>
                  <Button variant="outline" className="w-full">
                    Ver Recibo Digital
                  </Button>
                </DigitalReceiptModal>
              </CardContent>
            </Card>

            {/* Resultado do Sorteio */}
            <DrawResultCard 
              lotteryType={pool.lotteryType}
              drawDate={pool.drawDate}
              pool={pool}
              tickets={tickets}
            />

            {/* Ranking da Competição */}
            {(pool.hasRanking === true || pool.hasRanking === undefined) && (
              <>
                {activeCompetition ? (
                  <CompetitionRanking 
                    competition={activeCompetition}
                    currentUserId={currentUserId}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Ranking da Competição
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-8">
                      <div className="space-y-4">
                        <div className="text-muted-foreground">
                          <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Sistema de ranking disponível para este bolão!</p>
                          <p className="text-sm">O ranking será ativado após o primeiro sorteio.</p>
                        </div>
                        {pool.hasRanking === undefined && (
                          <div className="text-xs text-orange-600 bg-orange-50 p-3 rounded">
                            💡 Para ativar o ranking permanentemente, execute a migração do banco de dados
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}