# Funcionalidades Avançadas - Bolão da Sorte

Este documento descreve as funcionalidades avançadas implementadas em 2025, incluindo sistema de ranking, análise inteligente de jogos e gerenciamento avançado de pools.

## Sistema de Ranking

### Visão Geral

O sistema de ranking permite criar competições entre participantes dos bolões, com pontuação baseada em acertos reais dos sorteios. Totalmente automatizado e em tempo real.

### Arquitetura do Sistema

#### Tabelas do Banco de Dados

1. **`competitions`** - Competições
2. **`participant_draw_scores`** - Pontuações por sorteio
3. **`competition_rankings`** - Rankings consolidados

#### Fluxo de Funcionamento

```
Sorteio Realizado
       ↓
Cálculo de Acertos (por participante)
       ↓
Atualização de Scores (participant_draw_scores)
       ↓
Recálculo de Rankings (competition_rankings)
       ↓
Atualização da Interface
```

### Implementação Técnica

#### Criação de Competições

```typescript
// src/services/rankingService.ts
export async function createCompetition(poolId: string, period: CompetitionPeriod) {
  const competition = {
    pool_id: poolId,
    name: `Competição ${period.toUpperCase()}`,
    period,
    start_date: getStartDate(period),
    end_date: getEndDate(period),
    status: 'ativa',
    points_per_hit: getPointsConfig(lotteryType),
    bonus_points: getBonusConfig(lotteryType)
  };
  
  return await supabase.from('competitions').insert(competition);
}
```

#### Cálculo de Pontuação

```typescript
// Pontuação por modalidade de loteria
const POINTS_CONFIG = {
  megasena: {
    4: 5,    // 4 acertos = 5 pontos
    5: 50,   // 5 acertos = 50 pontos
    6: 500   // 6 acertos = 500 pontos
  },
  lotofacil: {
    11: 1, 12: 2, 13: 5, 14: 10, 15: 50
  },
  quina: {
    2: 1, 3: 5, 4: 50, 5: 500
  }
};

export function calculateScore(hits: number, lotteryType: LotteryType): number {
  return POINTS_CONFIG[lotteryType]?.[hits] || 0;
}
```

#### Atualização de Rankings

```typescript
export async function updateCompetitionRanking(competitionId: string) {
  // Buscar todos os scores da competição
  const { data: scores } = await supabase
    .from('participant_draw_scores')
    .select('participant_id, points_earned, total_hits, prize_value')
    .eq('competition_id', competitionId);
  
  // Agrupar por participante
  const participantStats = scores.reduce((acc, score) => {
    if (!acc[score.participant_id]) {
      acc[score.participant_id] = {
        total_points: 0,
        total_hits: 0,
        total_prize_value: 0,
        draws_participated: 0
      };
    }
    
    acc[score.participant_id].total_points += score.points_earned;
    acc[score.participant_id].total_hits += score.total_hits;
    acc[score.participant_id].total_prize_value += score.prize_value;
    acc[score.participant_id].draws_participated++;
    
    return acc;
  }, {});
  
  // Calcular rankings
  const rankings = Object.entries(participantStats)
    .sort(([,a], [,b]) => b.total_points - a.total_points)
    .map(([participant_id, stats], index) => ({
      participant_id,
      competition_id: competitionId,
      current_rank: index + 1,
      ...stats,
      average_hits_per_draw: stats.total_hits / stats.draws_participated
    }));
  
  // Atualizar no banco
  await supabase.from('competition_rankings').upsert(rankings);
}
```

### Componentes de Interface

#### CompetitionRanking.tsx

```typescript
// src/components/ranking/CompetitionRanking.tsx
export default function CompetitionRanking({ poolId }: { poolId: string }) {
  const { data: rankings, loading } = useQuery({
    queryKey: ['competition-rankings', poolId],
    queryFn: () => getCompetitionRankings(poolId)
  });
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rankings?.slice(0, 3).map((ranking, index) => (
          <PodiumCard key={ranking.id} ranking={ranking} position={index + 1} />
        ))}
      </div>
      
      <RankingTable rankings={rankings?.slice(3)} />
    </div>
  );
}
```

## Análise Inteligente de Jogos

### Funcionalidades

#### 1. Detecção de Padrões

O sistema analisa os números escolhidos pelos usuários e identifica padrões:

- **Números Sequenciais**: Detecta sequências de números consecutivos
- **Distribuição Equilibrada**: Analisa balanceamento entre números baixos/altos
- **Terminação**: Identifica padrões de terminação (números terminados em 0, 5, etc.)

#### 2. Análise de Frequência

```typescript
// src/components/pool/VolanteAnalysisTab.tsx
const analyzeNumbers = (): NumberAnalysis[] => {
  const numberCount: Record<number, number> = {};
  
  tickets.forEach(ticket => {
    const numbersPerGame = lotteryType === 'megasena' ? 6 : 15;
    for (let i = 0; i < ticket.numbers.length; i += numbersPerGame) {
      const gameNumbers = ticket.numbers.slice(i, i + numbersPerGame);
      gameNumbers.forEach(num => {
        numberCount[num] = (numberCount[num] || 0) + 1;
      });
    }
  });

  const totalGames = Object.values(numberCount).reduce((sum, count) => sum + count, 0);
  const avgFrequency = totalGames / Object.keys(numberCount).length;

  return Object.entries(numberCount).map(([number, frequency]) => ({
    number: parseInt(number),
    frequency,
    isFrequent: frequency > avgFrequency * 1.5,
    isRare: frequency < avgFrequency * 0.5,
  })).sort((a, b) => b.frequency - a.frequency);
};
```

#### 3. Estratégias de Jogo

```typescript
const organizeByStrategy = (): GameStrategy[] => {
  const strategies: GameStrategy[] = [];
  let globalGameCounter = 1;
  
  tickets.forEach(ticket => {
    for (let i = 0; i < ticket.numbers.length; i += numbersPerGame) {
      const gameNumbers = ticket.numbers.slice(i, i + numbersPerGame);
      const sortedNumbers = [...gameNumbers].sort((a, b) => a - b);
      
      // Detectar números sequenciais (2+ pares consecutivos)
      let consecutivePairs = 0;
      for (let j = 0; j < sortedNumbers.length - 1; j++) {
        if (sortedNumbers[j + 1] === sortedNumbers[j] + 1) {
          consecutivePairs++;
        }
      }
      
      if (consecutivePairs >= 2) {
        addToStrategy(strategies, 'Números Sequenciais', globalGameCounter);
      }
      
      // Detectar distribuição equilibrada
      const midPoint = lotteryType === 'megasena' ? 30 : 12;
      const lowCount = gameNumbers.filter(n => n <= midPoint).length;
      const highCount = gameNumbers.filter(n => n > midPoint).length;
      
      if (Math.abs(lowCount - highCount) <= 2) {
        addToStrategy(strategies, 'Distribuição Equilibrada', globalGameCounter);
      }
      
      globalGameCounter++;
    }
  });
  
  return strategies;
};
```

### Interface da Análise

#### Três Abas Principais

1. **Análise dos Números**
   - Estatísticas gerais (total de jogos, números frequentes)
   - Números mais/menos escolhidos
   - Visualização com badges coloridos

2. **Estratégias**
   - Cards com padrões detectados
   - Nível de confiança por estratégia
   - Lista de jogos que seguem cada padrão

3. **Meus Favoritos**
   - Marcação de jogos favoritos
   - Acompanhamento específico de performance

## Dashboard Pessoal

### Métricas Principais

#### 1. Métricas de Investimento

```typescript
// src/components/pool/PersonalSummaryTab.tsx
const personalStats = useMemo((): PersonalStats => {
  const totalGames = tickets.reduce((sum, ticket) => 
    sum + Math.floor(ticket.numbers.length / numbersPerGame), 0
  );
  
  const totalInvested = pool.contributionAmount;
  const averagePerGame = totalGames > 0 ? totalInvested / totalGames : 0;
  
  // Calcular diversidade dos números
  const allNumbers = new Set<number>();
  tickets.forEach(ticket => {
    ticket.numbers.forEach(num => allNumbers.add(num));
  });
  
  const maxPossibleNumbers = pool.lotteryType === 'megasena' ? 60 : 
                            pool.lotteryType === 'lotofacil' ? 25 : 80;
  
  const diversityScore = allNumbers.size > 0 ? 
    (allNumbers.size / maxPossibleNumbers) * 100 : 0;
  
  // Calcular nível de risco
  let riskLevel: 'baixo' | 'médio' | 'alto' = 'médio';
  if (diversityScore > 50 && totalGames >= 5) riskLevel = 'baixo';
  else if (diversityScore < 25 || totalGames < 3) riskLevel = 'alto';
  
  return {
    totalInvested,
    totalGames,
    averagePerGame,
    diversityScore: Math.round(diversityScore),
    riskLevel
  };
}, [pool, tickets]);
```

#### 2. Análise de Padrões

```typescript
const numberPatterns = useMemo(() => {
  const patterns = {
    consecutive: 0,
    evenOdd: { even: 0, odd: 0 },
    lowHigh: { low: 0, high: 0 },
    endings: {} as Record<number, number>
  };

  const numbersPerGame = pool.lotteryType === 'megasena' ? 6 : 15;
  const midPoint = pool.lotteryType === 'megasena' ? 30 : 12;
  
  tickets.forEach(ticket => {
    for (let i = 0; i < ticket.numbers.length; i += numbersPerGame) {
      const gameNumbers = ticket.numbers.slice(i, i + numbersPerGame);
      
      if (gameNumbers.length === numbersPerGame) {
        // Análise de cada número
        gameNumbers.forEach(num => {
          // Par vs Ímpar
          if (num % 2 === 0) patterns.evenOdd.even++;
          else patterns.evenOdd.odd++;
          
          // Baixo vs Alto
          if (num <= midPoint) patterns.lowHigh.low++;
          else patterns.lowHigh.high++;
          
          // Terminações
          const ending = num % 10;
          patterns.endings[ending] = (patterns.endings[ending] || 0) + 1;
        });
      }
    }
  });

  return patterns;
}, [tickets, pool.lotteryType]);
```

#### 3. Recomendações Personalizadas

```typescript
const getRecommendations = () => {
  const recommendations = [];
  
  if (personalStats.diversityScore < 40) {
    recommendations.push({
      type: 'diversify',
      message: `Seus números cobrem apenas ${personalStats.diversityScore}% do volante. 
                Considere escolher números de faixas diferentes.`,
      priority: 'high'
    });
  }
  
  if (personalStats.totalGames < 5) {
    recommendations.push({
      type: 'increase_games',
      message: `Com apenas ${personalStats.totalGames} jogos, 
                considere investir um pouco mais para ter mais combinações.`,
      priority: 'medium'
    });
  }
  
  if (numberPatterns.consecutive === 0) {
    recommendations.push({
      type: 'add_sequences',
      message: 'Números consecutivos aparecem em ~70% dos sorteios. 
                Considere incluir pelo menos um par consecutivo.',
      priority: 'low'
    });
  }
  
  return recommendations;
};
```

## Gerenciamento Avançado de Pools

### Funcionalidades para Administradores

#### 1. Página de Gerenciamento

```typescript
// src/pages/ManagePool.tsx
export default function ManagePool() {
  const { poolId } = useParams();
  const { user } = useAuth();
  const { data: pool, loading } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => getPoolById(poolId)
  });
  
  // Verificar se usuário é admin
  if (pool && pool.admin_id !== user?.id) {
    return <NotAuthorized />;
  }
  
  return (
    <div className="space-y-6">
      <PoolHeader pool={pool} />
      <ParticipantManagement poolId={poolId} />
      <FinancialSummary pool={pool} />
      <DangerZone pool={pool} />
    </div>
  );
}
```

#### 2. Gerenciamento de Participantes

```typescript
// Componente para gerenciar participantes
function ParticipantManagement({ poolId }: { poolId: string }) {
  const { data: participants } = useQuery({
    queryKey: ['participants', poolId],
    queryFn: () => getPoolParticipants(poolId)
  });
  
  const updateParticipantStatus = async (participantId: string, status: PaymentStatus) => {
    await supabase
      .from('participants')
      .update({ status })
      .eq('id', participantId);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Participantes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants?.map(participant => (
              <TableRow key={participant.id}>
                <TableCell>{participant.name}</TableCell>
                <TableCell>{participant.email}</TableCell>
                <TableCell>
                  <StatusBadge status={participant.status} />
                </TableCell>
                <TableCell>
                  <Select
                    value={participant.status}
                    onValueChange={(status) => 
                      updateParticipantStatus(participant.id, status)
                    }
                  >
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

#### 3. Exclusão Segura de Bolões

```typescript
// Componente para exclusão segura
function DangerZone({ pool }: { pool: Pool }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Verificar se há resultados registrados
      const { data: results } = await supabase
        .from('participant_draw_scores')
        .select('id')
        .eq('pool_id', pool.id)
        .limit(1);
      
      if (results && results.length > 0) {
        throw new Error('Não é possível excluir bolão com resultados registrados');
      }
      
      // Exclusão em cascata
      await supabase.rpc('delete_pool_cascade', { pool_id: pool.id });
      
      // Redirecionar para dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao excluir bolão:', error);
      // Mostrar erro para usuário
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          A exclusão do bolão é permanente e não pode ser desfeita.
        </p>
        
        <Button
          variant="destructive"
          onClick={() => setShowConfirmation(true)}
          disabled={isDeleting}
        >
          {isDeleting ? 'Excluindo...' : 'Excluir Bolão'}
        </Button>
        
        <DeleteConfirmationDialog
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          onConfirm={handleDelete}
          poolName={pool.name}
        />
      </CardContent>
    </Card>
  );
}
```

## Modal de Conferência de Resultados

### Três Abas Integradas

#### 1. Conferir Jogos
- Exibição dos resultados do sorteio
- Comparação com jogos do usuário
- Cálculo de acertos e prêmios em tempo real

#### 2. Análise Inteligente
- Utiliza `VolanteAnalysisTab` para análise detalhada
- Padrões e estratégias identificadas
- Recomendações baseadas nos jogos

#### 3. Meu Dashboard
- Utiliza `PersonalSummaryTab` para métricas pessoais
- Análise de investimento e risco
- Histórico de performance

## Considerações Técnicas

### Performance

#### 1. Lazy Loading
```typescript
// Componentes pesados carregados sob demanda
const VolanteAnalysisTab = lazy(() => import('./VolanteAnalysisTab'));
const PersonalSummaryTab = lazy(() => import('./PersonalSummaryTab'));
```

#### 2. Memoização
```typescript
// Cálculos complexos memoizados
const analysisResults = useMemo(() => {
  return analyzeGamePatterns(tickets, lotteryType);
}, [tickets, lotteryType]);
```

#### 3. Debouncing
```typescript
// Atualizações de ranking com debounce
const debouncedUpdateRanking = useMemo(
  () => debounce(updateCompetitionRanking, 500),
  []
);
```

### Segurança

#### 1. Validação de Permissões
```typescript
// Verificação de admin antes de operações críticas
const validateAdmin = (userId: string, adminId: string) => {
  if (userId !== adminId) {
    throw new Error('Acesso negado');
  }
};
```

#### 2. Transações
```typescript
// Operações críticas em transações
const deletePoolCascade = async (poolId: string) => {
  const { error } = await supabase.rpc('delete_pool_cascade', {
    pool_id: poolId
  });
  
  if (error) throw error;
};
```

#### 3. Auditoria
```typescript
// Log de ações administrativas
const logAdminAction = async (action: string, poolId: string, userId: string) => {
  await supabase.from('admin_logs').insert({
    action,
    pool_id: poolId,
    user_id: userId,
    timestamp: new Date().toISOString()
  });
};
```

## Melhores Práticas

### Dados Reais Obrigatórios
- Nunca usar dados fictícios em cálculos
- Sempre validar entrada da API
- Falhar graciosamente em caso de erro

### Timezone Safety
- Usar parseamento manual para datas
- Evitar `new Date(string)` para ISO strings
- Validar cronogramas oficiais

### Cache Inteligente
- Cache híbrido para performance
- Invalidação automática quando necessário
- Limpeza de dados expirados

### Feedback ao Usuário
- Loading states em operações longas
- Mensagens de erro claras
- Confirmações para ações destrutivas

## Conclusão

As funcionalidades avançadas implementadas em 2025 transformaram o Bolão da Sorte em uma plataforma completa e profissional. O sistema de ranking adiciona competitividade, a análise inteligente oferece insights valiosos, e o gerenciamento avançado permite controle total dos bolões.

Todas as funcionalidades seguem os princípios estabelecidos:
- **Dados reais apenas** - Nenhum mock ou dado fictício
- **Timezone safety** - Tratamento seguro de datas
- **Performance** - Otimizações e cache inteligente
- **Segurança** - Validações e permissões adequadas

**Última atualização**: Janeiro 2025 - Documentação das funcionalidades avançadas implementadas.