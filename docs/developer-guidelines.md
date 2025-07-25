# Diretrizes para Desenvolvimento - Bolão da Sorte

Este documento fornece diretrizes críticas e estabelece as melhores práticas para desenvolvedores que contribuem para o projeto Bolão da Sorte. **ESTE É UM SISTEMA DE DINHEIRO REAL FOCADO EXCLUSIVAMENTE NA MEGA-SENA** - erros podem causar perdas financeiras.

### 🎯 **FOCO MEGA-SENA APENAS (Julho 2025)**

A aplicação foi **simplificada para suportar apenas Mega-Sena** durante as fases de teste e lançamento inicial.

## 🚨 REGRAS CRÍTICAS - NUNCA VIOLE

### 1. ZERO DADOS FICTÍCIOS

**Esta é uma aplicação de dinheiro real.** Qualquer dado fictício pode causar perdas financeiras:

```typescript
// ❌ ABSOLUTAMENTE PROIBIDO:
const mockResult = {
  numero: 2650,
  dataApuracao: '14/07/2025', // Data inventada
  listaDezenas: ['01', '02', '03', '04', '05', '06'], // Números falsos
  valorPremio: 50000000 // Prêmio fictício
};

// ✅ SEMPRE OBRIGATÓRIO:
try {
  const realResult = await fetchLatestLotteryResult(lotteryType);
  return realResult; // Apenas dados da API oficial
} catch (error) {
  throw new Error('Dados indisponíveis - não é possível exibir informações precisas');
}
```

### 2. TIMEZONE OBRIGATÓRIO

**Resolução de Bug Crítico (Julho 2025)**:

```typescript
// ❌ CAUSA BUGS DE TIMEZONE:
const date = new Date('2025-07-15'); // Pode mudar de dia por timezone

// ✅ TIMEZONE-SAFE OBRIGATÓRIO:
const [year, month, day] = dateString.split('-').map(Number);
const date = new Date(year, month - 1, day);
```

### 3. CRONOGRAMAS OFICIAIS APENAS

```typescript
// ✅ CRONOGRAMA MEGA-SENA VALIDADO PELA CAIXA:
const LOTTERY_SCHEDULES = {
  megasena: [2, 4, 6],        // Ter, Qui, Sáb - NUNCA segundas!
};

// Note: Apenas Mega-Sena suportada após simplificação de Julho 2025
```

### 4. TRATAMENTO DE ERRO SEM FALLBACK

```typescript
// ❌ NUNCA USAR DADOS MOCK EM ERRO:
catch (error) {
  return generateMockData(); // PROIBIDO!
}

// ✅ SEMPRE FALHAR GRACIOSAMENTE:
catch (error) {
  console.error('API failed:', error);
  throw new Error('Serviços indisponíveis - dados precisos não disponíveis');
}
```

## Filosofia de Arquitetura

### Princípios Fundamentais

1. **Precisão sobre Performance**: Em caso de conflito, sempre priorize dados corretos
2. **Transparência sobre Conveniência**: Sempre mostre erros ao usuário, nunca mascare com dados falsos
3. **Validação Rigorosa**: Todo dado externo deve ser validado antes de uso
4. **Timezone Awareness**: Todas as operações de data devem ser timezone-safe

### Arquitetura Orientada a Features

O código é organizado por funcionalidade de negócio, não por tipo técnico:

```
src/
├── features/              # CORE: Módulos de negócio
│   ├── auth/             # Autenticação e perfis
│   └── pools/            # Gestão de bolões
├── components/           # Componentes UI globais
│   ├── dashboard/        # Cards e widgets do dashboard
│   ├── lottery/          # Componentes específicos de loteria
│   ├── pool/            # Componentes de bolão
│   └── ui/              # Componentes base (shadcn/ui)
├── services/            # Clientes de API externos
│   ├── lotteryApi.ts    # API de resultados de loteria
│   └── lotteryCache.ts  # Sistema de cache híbrido
├── pages/               # Rotas da aplicação
└── docs/                # Documentação crítica
```

### Hooks-First Pattern

**Componentes devem ser "burros"** - apenas renderizam. Toda lógica vai para hooks:

```typescript
// ✅ COMPONENTE CORRETO (apenas renderização):
function NextDrawCard({ selectedLottery }: Props) {
  const { drawInfo, loading, error, refresh } = useNextDraw(selectedLottery);
  
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;
  
  return <DrawInfo data={drawInfo} />;
}

// ✅ HOOK COM LÓGICA (separado):
function useNextDraw(lotteryType: LotteryType) {
  // Toda a lógica de negócio aqui
  const [drawInfo, setDrawInfo] = useState(null);
  // ... cálculos, validações, API calls
  return { drawInfo, loading, error, refresh };
}
```

## Stack Tecnológica

- **Frontend**: React 18+, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Routing**: React Router v6  
- **Estado**: TanStack React Query para servidor, hooks locais para UI
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **APIs Externas**: `api.guidi.dev.br/loteria` (via proxy em dev)

## Gerenciamento de Estado

### Hierarquia de Complexidade

1. **`useState`** - Estados locais simples (toggles, inputs)
2. **`useReducer`** - Estados complexos com múltiplas propriedades
3. **Custom Hooks** - Lógica de negócio e integrações com API
4. **React Context** - Estado global (auth, tema)
5. **TanStack React Query** - **OBRIGATÓRIO** para todos os dados do servidor

```typescript
// ✅ PADRÃO OBRIGATÓRIO PARA DADOS DO SERVIDOR:
function useLatestResults(lotteryType: LotteryType) {
  return useQuery({
    queryKey: ['lottery-results', lotteryType],
    queryFn: () => fetchLatestLotteryResult(lotteryType),
    staleTime: 30 * 60 * 1000, // 30 minutos
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}
```

## Diretrizes Específicas da Aplicação

### Manipulação de Datas de Loteria

```typescript
// ✅ FUNÇÃO OBRIGATÓRIA PARA FORMATAÇÃO:
function formatLotteryDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

// ✅ VALIDAÇÃO DE DIA DE SORTEIO:
function isValidDrawDay(dateString: string, lotteryType: LotteryType): boolean {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  
  return LOTTERY_SCHEDULES[lotteryType].includes(dayOfWeek);
}
```

### Sistema de Ranking (Novo - 2025)

```typescript
// ✅ CÁLCULO DE PONTUAÇÃO MEGA-SENA OBRIGATÓRIO:
function calculateScore(hits: number, lotteryType: LotteryType): number {
  const pointsMap = {
    megasena: { 4: 5, 5: 50, 6: 500 }
  };
  
  return pointsMap[lotteryType]?.[hits] || 0;
}

// ✅ ATUALIZAÇÃO DE RANKING AUTOMÁTICA:
async function updateRankings(competitionId: string, participantId: string) {
  // Recalcular pontuação total
  const totalScore = await calculateTotalScore(competitionId, participantId);
  
  // Atualizar ranking na tabela
  await updateCompetitionRanking(competitionId, participantId, totalScore);
  
  // Nunca usar dados fictícios para rankings
  if (!totalScore) {
    throw new Error('Não foi possível calcular pontuação real');
  }
}
```

### Análise Inteligente de Jogos

```typescript
// ✅ DETECÇÃO DE PADRÕES REAIS:
function detectGamePatterns(gameNumbers: number[], lotteryType: LotteryType): GamePattern[] {
  const patterns: GamePattern[] = [];
  const sortedNumbers = [...gameNumbers].sort((a, b) => a - b);
  
  // Verificar números sequenciais (pelo menos 2 pares consecutivos)
  let consecutivePairs = 0;
  for (let i = 0; i < sortedNumbers.length - 1; i++) {
    if (sortedNumbers[i + 1] === sortedNumbers[i] + 1) {
      consecutivePairs++;
    }
  }
  
  if (consecutivePairs >= 2) {
    patterns.push({
      type: 'sequential',
      confidence: 'média',
      description: 'Jogos com 2 ou mais pares consecutivos'
    });
  }
  
  // Verificar distribuição equilibrada (Mega-Sena apenas)
  const midPoint = 30; // Mega-Sena: 1-30 baixo, 31-60 alto
  const lowCount = gameNumbers.filter(n => n <= midPoint).length;
  const highCount = gameNumbers.filter(n => n > midPoint).length;
  
  if (Math.abs(lowCount - highCount) <= 2) {
    patterns.push({
      type: 'balanced',
      confidence: 'alta',
      description: 'Números equilibrados entre baixo e alto'
    });
  }
  
  return patterns;
}
```

### Gerenciamento de Pool (Admin)

```typescript
// ✅ VALIDAÇÃO DE PERMISSÕES OBRIGATÓRIA:
function validatePoolAdmin(userId: string, poolAdminId: string): boolean {
  if (userId !== poolAdminId) {
    throw new Error('Usuário não tem permissão para gerenciar este bolão');
  }
  return true;
}

// ✅ EXCLUSÃO SEGURA DE BOLÃO:
async function deletePoolSecurely(poolId: string, userId: string) {
  // Verificar permissão
  const pool = await getPoolById(poolId);
  validatePoolAdmin(userId, pool.admin_id);
  
  // Verificar se não há resultados ou premiações
  const hasResults = await checkPoolResults(poolId);
  if (hasResults) {
    throw new Error('Não é possível excluir bolão com resultados registrados');
  }
  
  // Exclusão em transação
  await supabase.rpc('delete_pool_cascade', { pool_id: poolId });
}
```

### Cache Management

**Sistema de Cache Híbrido Obrigatório**:

```typescript
// ✅ SEMPRE USAR O CACHE HÍBRIDO:
import { HybridLotteryCache } from '@/services/lotteryCache';

async function getLotteryData(lotteryType: LotteryType, drawNumber: string) {
  // 1. Verificar cache primeiro
  const cached = await HybridLotteryCache.get(lotteryType, drawNumber);
  if (cached && !isExpired(cached)) {
    return cached.apiResponse;
  }
  
  // 2. Buscar na API se não cached
  const fresh = await fetchLatestLotteryResult(lotteryType);
  
  // 3. Salvar no cache
  await HybridLotteryCache.set(lotteryType, drawNumber, drawDate, fresh);
  
  return fresh;
}
```

### Tratamento de Erros Críticos

```typescript
// ✅ PADRÃO OBRIGATÓRIO PARA ERROS DE API:
async function handleLotteryApiCall<T>(
  operation: () => Promise<T>,
  fallbackMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Lottery API Error:', error);
    
    // NUNCA retornar dados mock - sempre falhar transparente
    throw new Error(`${fallbackMessage}. Erro: ${error.message}`);
  }
}

// Uso:
const result = await handleLotteryApiCall(
  () => fetchLatestLotteryResult('megasena'),
  'Não foi possível obter dados precisos da Mega-Sena'
);
```

### Validação de Entrada

```typescript
// ✅ VALIDAÇÃO RIGOROSA DE NÚMEROS MEGA-SENA:
function validateLotteryNumbers(numbers: number[], lotteryType: LotteryType): void {
  const configs = {
    megasena: { count: 6, min: 1, max: 60 }
  };
  
  const config = configs[lotteryType];
  if (!config) {
    throw new Error(`Tipo de loteria inválido: ${lotteryType}`);
  }
  
  if (numbers.length !== config.count) {
    throw new Error(`${lotteryType} deve ter exatamente ${config.count} números`);
  }
  
  const invalidNumbers = numbers.filter(n => n < config.min || n > config.max);
  if (invalidNumbers.length > 0) {
    throw new Error(`Números inválidos para ${lotteryType}: ${invalidNumbers.join(', ')}`);
  }
  
  // Verificar duplicatas
  if (new Set(numbers).size !== numbers.length) {
    throw new Error('Números não podem ser duplicados');
  }
}
```

## Checklist de Code Review

### Obrigatório para Todas as PRs

- [ ] **Zero dados fictícios** - Nenhum mock, placeholder ou dado inventado
- [ ] **Timezone-safe** - Todas as operações de data usam parseamento manual
- [ ] **Cronogramas oficiais** - Validação contra LOTTERY_SCHEDULES
- [ ] **Tratamento de erro** - Falhas graciosamente sem dados falsos
- [ ] **Cache invalidation** - Implementa limpeza adequada de cache
- [ ] **Validação de entrada** - Todos os inputs são validados
- [ ] **TypeScript rigoroso** - Sem any, tipos bem definidos
- [ ] **Logs de debug** - Apenas em desenvolvimento (import.meta.env.DEV)

### Específico para Recursos de Loteria

- [ ] **API real apenas** - Nenhuma simulação ou geração de dados
- [ ] **Horários corretos** - Respeita 20h como horário oficial
- [ ] **Sequência de concursos** - Incremento correto (+1 do último oficial)
- [ ] **Formatação consistente** - Usa funções timezone-safe
- [ ] **Cache híbrido** - Usa HybridLotteryCache para persistência
- [ ] **Retry logic** - Implementa backoff exponencial para falhas de API

### Específico para Sistema de Ranking

- [ ] **Pontuação real** - Baseada em acertos reais, não fictícios
- [ ] **Competições válidas** - Períodos e regras corretas
- [ ] **Atualização automática** - Rankings atualizados após cada sorteio
- [ ] **Validação de dados** - Verificar integridade dos scores
- [ ] **Permissões** - Apenas admins podem modificar competições

### Específico para Análise Inteligente

- [ ] **Padrões reais** - Análise baseada em números reais dos jogos
- [ ] **Cálculos precisos** - Frequência e distribuição corretas
- [ ] **Estratégias válidas** - Lógica de detecção precisa
- [ ] **Diversidade correta** - Baseada na faixa real da loteria
- [ ] **Métricas financeiras** - Cálculos de ROI e risco corretos

### Específico para Gerenciamento de Pool

- [ ] **Permissões de admin** - Apenas admins podem gerenciar
- [ ] **Validação de exclusão** - Verificar se é seguro excluir
- [ ] **Transações** - Operações críticas em transações
- [ ] **Logs de auditoria** - Registrar ações administrativas
- [ ] **Confirmações** - Modais de confirmação para ações destrutivas

## Testes Obrigatórios

### Teste Manual de Timezone

```javascript
// Execute no console para validar timezone handling:
function testTimezoneCorrectness() {
  const testCases = [
    { input: '2025-07-14', expected: 'segunda-feira' },
    { input: '2025-07-15', expected: 'terça-feira' },
    { input: '2025-07-16', expected: 'quarta-feira' }
  ];
  
  testCases.forEach(({ input, expected }) => {
    const [year, month, day] = input.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const result = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    
    console.assert(
      result === expected,
      `TIMEZONE BUG: ${input} → ${result} (esperado: ${expected})`
    );
  });
  
  console.log('✅ Teste de timezone aprovado');
}
```

### Teste de Cronogramas

```javascript
// Validar cronogramas contra dias reais:
function testLotterySchedules() {
  const schedules = {
    megasena: [2, 4, 6]     // Ter, Qui, Sáb
  };
  
  // 14/07/2025 = Segunda (1)
  // 15/07/2025 = Terça (2)
  console.assert(!schedules.megasena.includes(1), 'Mega-Sena NÃO sorteia segunda');
  console.assert(schedules.megasena.includes(2), 'Mega-Sena sorteia terça');
  console.assert(schedules.megasena.includes(6), 'Mega-Sena sorteia sábado');
  
  console.log('✅ Cronogramas validados');
}
```

## Monitoramento e Debugging

### Logs Críticos

```typescript
// ✅ LOGS OBRIGATÓRIOS PARA OPERAÇÕES CRÍTICAS:
function logCriticalOperation(operation: string, data: any) {
  if (import.meta.env.DEV) {
    console.log(`🎯 CRITICAL: ${operation}`, {
      timestamp: new Date().toISOString(),
      data: data,
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }
}

// Uso em operações de loteria:
logCriticalOperation('LOTTERY_DATE_CALCULATION', {
  input: dateString,
  output: formattedDate,
  dayOfWeek: calculatedDay
});
```

### Alertas de Produção

**Configure alertas para**:
- Discrepâncias entre backend e frontend
- Loterias aparecendo em dias incorretos  
- Falhas de API acima de 5%
- Cache hit rate abaixo de 80%
- Erros de timezone em logs

## Performance e Otimização

### Bundle Size
- **Tree-shake** tipos de loteria não usados
- **Code-split** por rotas principais
- **Lazy load** componentes pesados (charts, modals)

### API Efficiency
- **Request deduplication** - Uma requisição por tipo/concurso
- **Cache appropriado** - 24h para últimos, 30 dias para históricos
- **Batch requests** quando possível
- **Retry inteligente** - Backoff exponencial limitado

### User Experience
- **Loading states** - Sempre mostrar carregamento
- **Error recovery** - Botões de retry em falhas
- **Optimistic updates** - Apenas quando seguro
- **Manual refresh** - Sempre disponível para usuário

## Deployment e Monitoramento

### Variáveis de Ambiente Obrigatórias

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# APIs Externas
VITE_LOTTERY_API_URL=https://api.guidi.dev.br/loteria

# Monitoring
VITE_ERROR_TRACKING_DSN=your_sentry_dsn
```

### Configuração de Produção

```typescript
// vite.config.ts para produção
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          lottery: ['./src/services/lotteryApi.ts'],
          cache: ['./src/services/lotteryCache.ts']
        }
      }
    }
  },
  // Remover logs de debug em produção
  define: {
    __DEV__: false
  }
});
```

## Procedimentos de Emergência

### Falha Total da API

1. **NUNCA** ativar dados mock
2. Exibir banner de manutenção
3. Implementar retry automático
4. Comunicar status aos usuários
5. Monitorar logs para identificar causa

### Inconsistência de Dados

1. **Parar** operações de cálculo imediatamente
2. **Investigar** fonte da inconsistência
3. **Limpar** todo cache suspeito
4. **Validar** dados antes de reativar
5. **Documentar** incidente para prevenção

## Conclusão

**Lembre-se sempre**: Este é um sistema financeiro onde erros têm consequências reais. Priorize:

1. **Precisão** sobre rapidez
2. **Transparência** sobre conveniência  
3. **Validação rigorosa** sobre flexibilidade
4. **Dados reais** sobre estimativas

**A confiança dos usuários é nosso ativo mais valioso.**