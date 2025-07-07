
# Bolão da Sorte - Referência do Projeto

## Visão Geral

Bolão da Sorte é uma aplicação web para gerenciar bolões de loterias. A plataforma permite que usuários criem e participem de bolões para diferentes modalidades de loteria, como Mega-Sena, Lotofácil, Quina, entre outras.

## Arquitetura

- **Frontend**: React com TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack React Query.
- **Backend**: Supabase (PostgreSQL, Auth, API).
- **Gerenciamento de Estado**: A estratégia é baseada em uma combinação de hooks do React (`useState`, `useReducer`), Context API para estado global e **Custom Hooks** para encapsular a lógica de negócio, com **TanStack React Query** para todo o estado do servidor.

## Hooks Principais (Core Hooks)

Os hooks customizados são o coração da lógica da nossa aplicação. Eles separam a complexidade dos componentes.

-   **`useAuth`**: Fornecido pelo `AuthProvider`, gerencia o estado da sessão do usuário (login, logout, dados do usuário).
-   **`useProfile`**: Busca e fornece os dados do perfil do usuário logado a partir da tabela `profiles`.
-   **`useUserPools`**: Busca todos os bolões que um usuário administra ou participa, otimizando as queries ao Supabase.
-   **`useCreatePool`**: Encapsula toda a lógica do formulário de criação de bolão, incluindo o estado dos campos (`useReducer`), validação e a submissão para a API.
-   **`usePoolResults`**: Lógica de negócio para buscar os resultados de uma loteria e compará-los com os bilhetes de um bolão, calculando acertos e prêmios.
-   **`usePoolDetail`**: Fornecido pelo `PoolDetailProvider`, gerencia o estado complexo da página de detalhes de um bolão, incluindo dados do bolão, participantes e bilhetes.

## Estrutura de Dados (Supabase)

#### 1. `pools`
- `id`, `name`, `lottery_type`, `draw_date`, `num_tickets`, `max_participants`, `contribution_amount`, `admin_id`, `status`, `created_at`

#### 2. `participants`
- `id`, `user_id`, `pool_id`, `name`, `email`, `status` (`confirmado`, `pago`, `pendente`), `created_at`

#### 3. `tickets`
- `id`, `pool_id`, `numbers` (array de números), `created_at`

#### 4. `profiles`
- `id` (referencia `auth.users`), `name`, `email`, `created_at`

## Fluxos Principais

-   **Criação de Bolão**: O componente `CreatePoolForm` é puramente visual e utiliza o hook `useCreatePool` para gerenciar todo o processo.
-   **Participação em Bolão**: O usuário entra na página de detalhes (`/boloes/:id`), cujos dados são carregados pelo `PoolDetailProvider`.
-   **Visualização de Resultados**: Na página de detalhes, o componente `PoolResults` utiliza o hook `usePoolResults` para buscar e processar os resultados.
-   **Dashboard e Listagem**: A página `Dashboard` e o componente `PoolsList` usam o hook `useUserPools` para exibir os bolões do usuário.

## Páginas Principais

- `/auth`: Autenticação (login/cadastro).
- `/dashboard`: Visão geral dos bolões e estatísticas.
- `/meus-boloes`: Lista de bolões do usuário.
- `/boloes/:id`: Detalhes de um bolão específico.
- `/pesquisar-resultados`: Busca de resultados de loterias.
- `/perfil`: Dados do perfil do usuário.

## Integrações

-   **API de Loterias**: `loteriascaixa-api.herokuapp.com` para resultados de sorteios.

