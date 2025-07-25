import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Star, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { RankingService } from '@/services/rankingService';
import { CompetitionRanking as CompetitionRankingType, ParticipantDrawScore, Competition } from '@/types';

interface CompetitionRankingProps {
  competition: Competition;
  currentUserId?: string;
}

export default function CompetitionRanking({ competition, currentUserId }: CompetitionRankingProps) {
  const [rankings, setRankings] = useState<CompetitionRankingType[]>([]);
  const [userHistory, setUserHistory] = useState<ParticipantDrawScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ranking');

  useEffect(() => {
    loadRankingData();
  }, [competition.id]);

  const loadRankingData = async () => {
    setLoading(true);
    try {
      // Carregar ranking geral
      const rankingData = await RankingService.getCompetitionRanking(competition.id);
      setRankings(rankingData);

      // Se há usuário logado, carregar histórico pessoal
      if (currentUserId) {
        const userParticipant = rankingData.find(r => 
          (r as any).participants?.user_id === currentUserId
        );
        
        if (userParticipant) {
          const history = await RankingService.getParticipantScoreHistory(
            userParticipant.participantId,
            competition.id
          );
          setUserHistory(history);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Medal className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getTrendIcon = (rankChange: number) => {
    if (rankChange > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (rankChange < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const formatPeriodName = (period: string) => {
    const names = {
      'mensal': 'Mensal',
      'trimestral': 'Trimestral', 
      'semestral': 'Semestral',
      'anual': 'Anual'
    };
    return names[period as keyof typeof names] || period;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking da Competição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Carregando ranking...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {competition.name}
          </CardTitle>
          <Badge variant="outline">{formatPeriodName(competition.period)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {competition.description}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ranking">Ranking Geral</TabsTrigger>
            <TabsTrigger value="personal" disabled={!currentUserId}>
              Meu Desempenho
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" className="space-y-4">
            {rankings.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum dado de ranking disponível ainda.</p>
                <p className="text-sm text-muted-foreground">
                  O ranking será atualizado após os primeiros sorteios.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankings.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      entry.participantId === currentUserId
                        ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Posição e Avatar */}
                      <div className="flex items-center gap-3">
                        {getRankIcon(entry.currentRank)}
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {((entry as any).participants?.name?.charAt(0).toUpperCase()) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Info do Participante */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{(entry as any).participants?.name || 'Participante'}</h4>
                          {entry.participantId === currentUserId && (
                            <Badge variant="secondary" className="text-xs">Você</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{entry.drawsParticipated} sorteios</span>
                          <span>{entry.averageHitsPerDraw.toFixed(1)} acertos/sorteio</span>
                          {entry.bestHitCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {entry.bestHitCount} melhor
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Estatísticas */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-blue-600">
                            {entry.totalPoints}
                          </span>
                          <span className="text-sm text-muted-foreground">pts</span>
                          {getTrendIcon(entry.rankChange)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.totalHits} acertos totais
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            {userHistory.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Você ainda não participou de nenhum sorteio.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Resumo Pessoal */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userHistory.reduce((sum, h) => sum + h.pointsEarned, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Pontos Totais</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {userHistory.reduce((sum, h) => sum + h.totalHits, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Acertos Totais</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.max(...userHistory.map(h => h.totalHits), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Melhor Sorteio</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(userHistory.reduce((sum, h) => sum + h.totalHits, 0) / userHistory.length).toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Média de Acertos</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Histórico por Sorteio */}
                <div className="space-y-3">
                  <h4 className="font-medium">Histórico de Sorteios</h4>
                  {userHistory.map((score) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          Concurso {score.lottery_draw_results?.draw_number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(score.drawDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">
                          +{score.pointsEarned} pts
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {score.totalHits} acertos em {score.totalGamesPlayed} jogos
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}