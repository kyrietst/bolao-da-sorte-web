import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target, 
  Users, 
  Calendar,
  BarChart3,
  Activity,
  Zap,
  DollarSign,
  ArrowRight,
  Clock,
  AlertCircle
} from 'lucide-react';

import { useUserPools } from '@/features/pools/hooks/useUserPools';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useNumberFrequencyAnalysis } from '@/hooks/useNumberFrequencyAnalysis';
import { useUserPerformanceInsights } from '@/hooks/useUserPerformanceInsights';
import NextDrawCard from './NextDrawCard';
import LastResultsCard from './LastResultsCard';
import { LotteryType } from '@/types';

// Componente de Gráfico de Frequência de Números - DADOS REAIS
const NumberFrequencyChart = ({ userId }: { userId: string }) => {
  const { topNumbers, coldNumbers, totalGames, loading, error } = useNumberFrequencyAnalysis(userId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Análise de Frequência - Seus Jogos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || totalGames === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Análise de Frequência - Seus Jogos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-center">
            <div className="space-y-2">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {error ? 'Erro ao carregar dados' : 'Nenhum jogo encontrado. Participe de bolões para ver a análise.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Análise de Frequência - Seus Jogos ({totalGames} jogos)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hot" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hot">Mais Escolhidos</TabsTrigger>
            <TabsTrigger value="cold">Menos Escolhidos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hot" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Números que você mais escolheu:
            </p>
            {topNumbers.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {topNumbers.map((item) => (
                  <div 
                    key={item.number}
                    className="bg-red-50 border border-red-200 rounded-lg p-3 text-center"
                  >
                    <div className="text-lg font-bold text-red-700">
                      {item.number.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-red-600">
                      {item.frequency}x
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum número frequente encontrado
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="cold" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Números que você menos escolheu:
            </p>
            {coldNumbers.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {coldNumbers.map((item) => (
                  <div 
                    key={item.number}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center"
                  >
                    <div className="text-lg font-bold text-blue-700">
                      {item.number.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-blue-600">
                      {item.frequency}x
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum número raro encontrado
              </p>
            )}
          </TabsContent>
        </Tabs>
        
        <Button variant="outline" size="sm" className="w-full mt-4" asChild>
          <Link to="/meus-boloes">
            Ver Meus Bolões <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

// Componente de Insights de Performance - DADOS REAIS
const PerformanceInsights = ({ userId }: { userId: string }) => {
  const insights = useUserPerformanceInsights(userId);

  if (insights.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Seus Insights de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.error || insights.totalPools === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Seus Insights de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-center">
            <div className="space-y-2">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {insights.error ? 'Erro ao carregar dados' : 'Nenhum bolão encontrado. Crie ou participe de bolões para ver insights.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          Seus Insights de Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Taxa de Retorno */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa de Retorno</span>
            <span className={`text-sm font-bold ${
              insights.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {insights.avgReturn >= 0 ? '+' : ''}{insights.avgReturn.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.max(0, Math.min(100, (insights.avgReturn + 100) / 2))} 
            className="h-2" 
          />
          <p className="text-xs text-muted-foreground">
            Baseado em {insights.totalPools} bolões
          </p>
        </div>

        {/* Nível de Risco */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Nível de Risco</span>
            <Badge variant={
              insights.riskLevel === 'Alto' ? 'destructive' : 
              insights.riskLevel === 'Médio' ? 'secondary' : 'default'
            }>
              {insights.riskLevel}
            </Badge>
          </div>
          <Progress 
            value={insights.riskScore} 
            className={`h-2 ${
              insights.riskLevel === 'Alto' ? 'bg-red-200' : 
              insights.riskLevel === 'Médio' ? 'bg-yellow-200' : 'bg-green-200'
            }`} 
          />
        </div>

        {/* Investimento Total */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-700">
                Investimento Total
              </p>
              <p className="text-lg font-bold text-blue-800">
                R$ {insights.totalInvestment.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Ações Recomendadas */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Recomendações:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {insights.riskLevel === 'Alto' && (
              <li>• Considere diversificar em bolões menores</li>
            )}
            {insights.totalPools < 3 && (
              <li>• Participe de mais bolões para aumentar chances</li>
            )}
            {insights.totalInvestment === 0 && (
              <li>• Comece investindo pequenos valores</li>
            )}
            {insights.totalPools > 0 && (
              <li>• Continue acompanhando seus resultados</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de Timeline de Sorteios - CRONOGRAMA REAL
const DrawTimeline = () => {
  const upcomingDraws = useMemo(() => {
    const draws = [];
    const today = new Date();
    
    // Próximos 3 sorteios da Mega-Sena (Ter, Qui, Sáb)
    const megaSenaDays = [2, 4, 6]; // Terça, Quinta, Sábado
    
    for (let i = 0; i < 14; i++) { // Buscar nos próximos 14 dias
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      if (megaSenaDays.includes(date.getDay())) {
        draws.push({
          date: date.toLocaleDateString('pt-BR', { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit' 
          }),
          isNext: draws.length === 0,
          daysUntil: i
        });
        
        if (draws.length >= 3) break;
      }
    }
    
    return draws;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          Próximos Sorteios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingDraws.map((draw, index) => (
          <div 
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              draw.isNext ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                draw.isNext ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <div>
                <p className={`font-medium text-sm ${
                  draw.isNext ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {draw.date}
                </p>
                {draw.isNext && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {draw.daysUntil === 0 ? 'Hoje' : `${draw.daysUntil} dias`}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Sorteio oficial</p>
              <p className="text-sm font-bold text-blue-600">
                20:00
              </p>
            </div>
          </div>
        ))}
        
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/pesquisar-resultados">
            Pesquisar Resultados
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

// Componente Principal da Dashboard Analítica
export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const { pools, loading } = useUserPools(user);
  const [selectedLottery] = useState<LotteryType>('megasena');

  const quickStats = useMemo(() => {
    if (!pools) {
      return {
        activePools: 0,
        totalPools: 0,
        totalInvestment: 0
      };
    }
    
    const activePools = pools.filter(p => p.status === 'ativo');
    const totalInvestment = pools.reduce((sum, pool) => sum + (pool.contributionAmount || 0), 0);
    
    return {
      activePools: activePools.length,
      totalPools: pools.length,
      totalInvestment
    };
  }, [pools]);

  const userId = user?.id;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Análise Inteligente
        </h1>
        <p className="text-muted-foreground">
          Insights e dados para otimizar suas estratégias na Mega-Sena
        </p>
      </div>

      {/* Stats Cards Compactos */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bolões Ativos</p>
                <p className="text-2xl font-bold">{quickStats.activePools}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Investido</p>
                <p className="text-2xl font-bold">R$ {quickStats.totalInvestment.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Próximo Sorteio</p>
                <p className="text-lg font-bold">Terça, 20h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Próximo Sorteio</p>
                <p className="text-lg font-bold">Terça, 20h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Análise de Frequência */}
          {userId && <NumberFrequencyChart userId={userId} />}

          {/* Últimos Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Últimos Resultados da Mega-Sena
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LastResultsCard 
                selectedLottery={selectedLottery}
                onLotteryChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Insights & Tools */}
        <div className="space-y-6">
          {/* Performance Insights */}
          {userId && <PerformanceInsights userId={userId} />}

          {/* Timeline de Sorteios */}
          <DrawTimeline />

          {/* Próximo Sorteio - Menor */}
          <div className="lg:hidden">
            <NextDrawCard 
              selectedLottery={selectedLottery}
              onLotteryChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800">Criar Novo Bolão</h3>
                <p className="text-sm text-green-600">
                  Baseado na análise, é um bom momento para apostar
                </p>
              </div>
              <Button size="sm" asChild>
                <Link to="/meus-boloes">Criar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-800">Ver Meus Bolões</h3>
                <p className="text-sm text-blue-600">
                  Acompanhe o desempenho dos seus bolões ativos
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/meus-boloes">Ver Todos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}