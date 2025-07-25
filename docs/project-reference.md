
# Bolão da Sorte - Referência do Projeto

## Visão Geral

Bolão da Sorte é uma aplicação web profissional para gerenciar bolões de loterias **com dinheiro real**, **focada exclusivamente na Mega-Sena**. A plataforma permite que usuários criem e participem de bolões de Mega-Sena, com sistema completo de ranking, análise inteligente de jogos e gerenciamento financeiro.

### 🎯 **FOCO EXCLUSIVO MEGA-SENA (Julho 2025)**

A aplicação foi **simplificada para suportar apenas Mega-Sena** para oferecer uma experiência focada e otimizada durante as fases de teste e lançamento inicial.

## Arquitetura

- **Frontend**: React 18+, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Real-time API)
- **Gerenciamento de Estado**: Feature-Sliced Design com hooks-first approach
- **APIs Externas**: `api.guidi.dev.br/loteria` (via proxy em dev)
- **Cache**: Sistema híbrido localStorage + Supabase

## Princípios Arquiteturais

### 1. Feature-Sliced Design
Organização por domínios de negócio, não por camadas técnicas:

```
src/
├── features/              # Módulos de negócio
│   ├── auth/             # Autenticação e perfis
│   │   ├── pages/        # Páginas de auth
│   │   ├── components/   # Componentes específicos
│   │   └── hooks/        # Lógica de negócio
│   └── pools/            # Gestão de bolões
│       ├── pages/        # Páginas de bolões
│       ├── components/   # Componentes específicos
│       ├── hooks/        # Lógica de negócio
│       └── providers/    # Context providers
├── components/           # Componentes globais
│   ├── dashboard/        # Cards e widgets
│   ├── lottery/          # Componentes de loteria
│   ├── pool/            # Componentes de bolão
│   ├── ranking/         # Sistema de ranking
│   └── ui/              # shadcn/ui base
├── pages/               # Rotas principais
├── services/            # Clientes de API
├── hooks/               # Hooks globais
└── types/               # Definições TypeScript
```

### 2. Hooks-First Pattern
Componentes são "burros" - toda lógica vai para hooks customizados:

```typescript
// ✅ Componente apenas renderiza
function NextDrawCard({ selectedLottery }: Props) {
  const { drawInfo, loading, error, refresh } = useNextDraw(selectedLottery);
  return <DrawDisplay data={drawInfo} loading={loading} error={error} />;
}

// ✅ Hook contém toda a lógica
function useNextDraw(lotteryType: LotteryType) {
  // Lógica de negócio, validações, API calls
  return { drawInfo, loading, error, refresh };
}
```

### 3. Dados Reais Obrigatórios
**NUNCA usar dados fictícios** - sistema de dinheiro real:

```typescript
// ❌ PROIBIDO
const mockResult = { numbers: [1,2,3,4,5,6], prize: 50000000 };

// ✅ OBRIGATÓRIO
try {
  const realResult = await fetchLatestLotteryResult(lotteryType);
  return realResult;
} catch (error) {
  throw new Error('Dados indisponíveis');
}
```

## Hooks Principais (Core Hooks)

### Sistema de Autenticação
- **`useAuth`**: Gerencia sessão do usuário (login, logout, dados)
- **`useProfile`**: Dados do perfil do usuário da tabela `profiles`

### Gestão de Bolões
- **`useUserPools`**: Lista todos os bolões do usuário (admin ou participante)
- **`useCreatePool`**: Lógica completa de criação de bolão
- **`usePoolDetail`**: Estado complexo da página de detalhes
- **`usePoolResults`**: Conferência de resultados e cálculo de prêmios
- **`usePoolCompetition`**: Sistema de ranking e competições
- **`usePoolParticipants`**: Gerenciamento de participantes

### Novos Hooks (2025)
- **`useLotteryDrawResult`**: Busca resultados de sorteios com cache
- **`useFavoriteTickets`**: Gerenciamento de jogos favoritos
- **`useRankingService`**: Cálculos de ranking e pontuação

## Estrutura de Dados (Supabase)

### Tabelas Core
#### 1. `pools` - Bolões
```sql
id: UUID
name: TEXT
lottery_type: TEXT (megasena apenas)
draw_date: DATE
num_tickets: INTEGER
max_participants: INTEGER
contribution_amount: DECIMAL(10,2)
admin_id: UUID
status: TEXT (ativo, finalizado)
created_at: TIMESTAMP
has_ranking: BOOLEAN
ranking_period: TEXT (mensal, trimestral, etc.)
```

#### 2. `participants` - Participantes
```sql
id: UUID
user_id: UUID (FK)
pool_id: UUID (FK)
name: TEXT
email: TEXT
status: TEXT (confirmado, pago, pendente)
shares_count: INTEGER
total_contribution: DECIMAL(10,2)
created_at: TIMESTAMP
```

#### 3. `tickets` - Volantes
```sql
id: UUID
pool_id: UUID (FK)
ticket_number: TEXT
numbers: INTEGER[] (array de números)
created_at: TIMESTAMP
```

#### 4. `profiles` - Perfis
```sql
id: UUID (FK auth.users)
name: TEXT
email: TEXT
created_at: TIMESTAMP
```

### Sistema de Ranking (Novo - 2025)
#### 5. `competitions` - Competições
```sql
id: UUID
pool_id: UUID (FK)
name: TEXT
period: TEXT (mensal, trimestral, etc.)
start_date: DATE
end_date: DATE
lottery_type: TEXT
status: TEXT (ativa, finalizada, pausada)
points_per_hit: INTEGER
bonus_points: JSONB
created_at: TIMESTAMP
```

#### 6. `participant_draw_scores` - Pontuações por Sorteio
```sql
id: UUID
participant_id: UUID (FK)
competition_id: UUID (FK)
lottery_result_id: UUID (FK)
total_hits: INTEGER
hit_breakdown: JSONB
total_games_played: INTEGER
points_earned: INTEGER
prize_value: DECIMAL(15,2)
draw_date: DATE
created_at: TIMESTAMP
```

#### 7. `competition_rankings` - Rankings
```sql
id: UUID
participant_id: UUID (FK)
competition_id: UUID (FK)
total_points: INTEGER
total_hits: INTEGER
total_games_played: INTEGER
total_prize_value: DECIMAL(15,2)
current_rank: INTEGER
rank_change: INTEGER
average_hits_per_draw: DECIMAL(5,2)
last_updated: TIMESTAMP
```

#### 8. `lottery_results_cache` - Cache de Resultados
```sql
id: UUID
lottery_type: TEXT
draw_number: INTEGER
draw_date: DATE
api_response: JSONB
cached_at: TIMESTAMP
expires_at: TIMESTAMP
```

## Fluxos Principais

### 1. Criação de Bolão
1. **Formulário** (`CreatePoolForm`) coleta dados
2. **Hook** (`useCreatePool`) valida e processa
3. **API** cria bolão no Supabase
4. **Redirecionamento** para página de detalhes

### 2. Participação em Bolão
1. **Usuário** acessa `/boloes/:id`
2. **Provider** (`PoolDetailProvider`) carrega dados
3. **Componentes** renderizam informações
4. **Participação** via modal ou botão

### 3. Conferência de Resultados
1. **Modal** (`GameResultsModal`) com 3 abas:
   - **Conferir Jogos**: Resultados vs jogos
   - **Análise Inteligente**: Padrões e estratégias
   - **Meu Dashboard**: Estatísticas pessoais
2. **Hook** (`usePoolResults`) busca resultados
3. **Cálculo** de acertos e prêmios em tempo real

### 4. Sistema de Ranking
1. **Competições** criadas automaticamente
2. **Pontuação** calculada por sorteio
3. **Rankings** atualizados em tempo real
4. **Visualização** em componentes dedicados

### 5. Gerenciamento de Pool (Novo - 2025)
1. **Página** (`/boloes/:id/gerenciar`) para admins
2. **Funcionalidades**:
   - Gerenciar participantes
   - Controlar pagamentos
   - Visualizar estatísticas
   - Excluir bolão (com confirmação)

## Páginas Principais

### Rotas Públicas
- `/auth` - Autenticação (login/cadastro)

### Rotas Protegidas
- `/dashboard` - Visão geral e estatísticas
- `/meus-boloes` - Lista de bolões do usuário
- `/boloes/:id` - Detalhes de bolão específico
- `/boloes/:id/gerenciar` - Gerenciamento (admin only)
- `/pesquisar-resultados` - Busca de resultados
- `/gerador` - Gerador de jogos
- `/simulador` - Simulador de apostas
- `/estatisticas` - Estatísticas gerais

## Integrações Externas

### API de Loterias
- **URL**: `api.guidi.dev.br/loteria`
- **Proxy Dev**: `/api/lottery` (configurado no Vite)
- **Retry**: Exponential backoff, 3 tentativas
- **Cache**: Híbrido localStorage + Supabase
- **Timeout**: 30 segundos

### Funcionalidades da API
- Últimos resultados da Mega-Sena
- Histórico de concursos da Mega-Sena
- Dados de prêmios e ganhadores da Mega-Sena
- Cronograma de sorteios da Mega-Sena (Terças, Quintas, Sábados)

## Sistema de Cache

### Cache Híbrido
1. **Nível 1** - localStorage (2 horas)
2. **Nível 2** - Supabase (24h/30 dias)
3. **Invalidação** automática e manual
4. **Limpeza** de dados expirados

### Estratégias de Cache
- **Últimos sorteios**: 24 horas
- **Sorteios completos**: 30 dias
- **Erro handling**: Sem cache de falhas
- **Unicode sanitization**: Antes de salvar

## Componentes Principais

### Dashboard
- **NextDrawCard**: Próximos sorteios
- **LastResultsCard**: Últimos resultados
- **StatCard**: Estatísticas gerais
- **GameGeneratorCard**: Gerador de jogos
- **GameSimulatorCard**: Simulador

### Pool Management
- **PoolDetailHeader**: Cabeçalho com informações
- **PoolDetailLayout**: Layout principal
- **PoolStatsCards**: Estatísticas do bolão
- **ParticipantsTable**: Tabela de participantes
- **VolanteDisplay**: Exibição de volantes

### Análise e Ranking
- **VolanteAnalysisTab**: Análise inteligente de jogos
- **PersonalSummaryTab**: Dashboard pessoal
- **CompetitionRanking**: Rankings e competições
- **GameResultsModal**: Modal de conferência

## Funcionalidades Avançadas (2025)

### Análise Inteligente
- **Detecção de padrões**: Números sequenciais, distribuição equilibrada
- **Estratégias**: Análise de tendências de apostas
- **Frequência**: Números mais/menos escolhidos
- **Recomendações**: Sugestões personalizadas

### Dashboard Pessoal
- **Métricas financeiras**: Investimento, retorno esperado
- **Análise de risco**: Diversidade e estratégias
- **Padrões de números**: Par/ímpar, baixo/alto
- **Histórico de ganhos**: Performance anterior

### Sistema de Ranking
- **Competições automáticas**: Por período
- **Pontuação dinâmica**: Baseada em acertos
- **Rankings em tempo real**: Atualização automática
- **Histórico de performance**: Tendências e estatísticas

## Segurança e Validação

### Validação de Dados
- **Números de loteria**: Faixa e quantidade corretas
- **Cronogramas**: Validação contra dias oficiais
- **Timezone**: Tratamento seguro de datas
- **Entrada de usuário**: Sanitização e validação

### Autenticação
- **Supabase Auth**: Sistema completo
- **RLS**: Row Level Security ativo
- **Proteção de rotas**: AuthGuard em todas as páginas
- **Isolamento**: Dados por usuário

## Deployment e Monitoramento

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LOTTERY_API_URL=https://api.guidi.dev.br/loteria
```

### Configuração de Produção
- **Bundle optimization**: Code splitting
- **Error tracking**: Logs detalhados
- **Performance**: Lazy loading
- **SEO**: Meta tags e routing

## Comandos de Desenvolvimento

```bash
# Desenvolvimento
npm run dev          # Servidor dev (porta 8080)
npm run build        # Build para produção
npm run build:dev    # Build para desenvolvimento
npm run preview      # Preview da build
npm run lint         # Linting com ESLint
```

## Conclusão

O Bolão da Sorte evoluiu de uma aplicação simples para uma plataforma completa de gerenciamento de bolões com funcionalidades avançadas de análise, ranking e gestão financeira. A arquitetura baseada em features e hooks permite escalabilidade e manutenibilidade, enquanto o foco em dados reais garante confiabilidade para operações financeiras.

**Última atualização**: Julho 2025 - Simplificação para foco exclusivo na Mega-Sena.
