
# Bolão da Sorte - Referência do Projeto

## Visão Geral

Bolão da Sorte é uma aplicação web para gerenciar bolões de loterias. A plataforma permite que usuários criem e participem de bolões para diferentes modalidades de loteria, como Mega-Sena, Lotofácil, Quina, entre outras.

## Arquitetura

### Frontend
- **Framework**: React com TypeScript
- **Build Tool**: Vite
- **Estilo**: Tailwind CSS com shadcn/ui
- **Roteamento**: React Router v6
- **Gerenciamento de Estado**: React Context API + React Query
- **Ícones**: Lucide React

### Backend
- **Banco de Dados**: PostgreSQL via Supabase
- **Autenticação**: Supabase Auth
- **API**: Supabase Client

## Estrutura de Dados

### Tabelas no Supabase

#### 1. `pools` (Bolões)
- `id`: UUID (chave primária)
- `name`: TEXT (nome do bolão)
- `lottery_type`: TEXT (tipo de loteria)
- `draw_date`: TIMESTAMP (data do sorteio)
- `num_tickets`: INTEGER (número de bilhetes)
- `max_participants`: INTEGER (máximo de participantes)
- `contribution_amount`: NUMERIC (valor da contribuição)
- `admin_id`: UUID (ID do administrador)
- `status`: TEXT (status do bolão: 'ativo' ou 'finalizado')
- `created_at`: TIMESTAMP (data de criação)

#### 2. `participants` (Participantes)
- `id`: UUID (chave primária)
- `user_id`: UUID (ID do usuário)
- `pool_id`: UUID (ID do bolão)
- `name`: TEXT (nome do participante)
- `email`: TEXT (email do participante)
- `status`: TEXT (status do pagamento: 'confirmado', 'pago' ou 'pendente')
- `created_at`: TIMESTAMP (data de criação)

#### 3. `tickets` (Bilhetes)
- `id`: UUID (chave primária)
- `pool_id`: UUID (ID do bolão)
- `ticket_number`: TEXT (número do bilhete)
- `numbers`: ARRAY (números escolhidos)
- `created_at`: TIMESTAMP (data de criação)

#### 4. `profiles` (Perfis)
- `id`: UUID (chave primária, referencia auth.users)
- `name`: TEXT (nome do usuário)
- `email`: TEXT (email do usuário)
- `created_at`: TIMESTAMP (data de criação)

## Tipos de Loteria

A aplicação suporta os seguintes tipos de loteria:
- Mega-Sena (`megasena`)
- Lotofácil (`lotofacil`)
- Quina (`quina`)
- Lotomania (`lotomania`)
- Timemania (`timemania`)
- Dupla Sena (`duplasena`)

## Fluxos Principais

### Criação de Bolão
1. Usuário autentica na plataforma
2. Acessa o formulário de criação de bolão
3. Preenche informações como nome, tipo de loteria, data do sorteio, etc.
4. Submete o formulário
5. Sistema cria o bolão e adiciona o usuário como administrador e participante

### Participação em Bolão
1. Usuário recebe link de convite ou acessa diretamente
2. Visualiza detalhes do bolão
3. Confirma participação
4. Sistema registra o usuário como participante

### Visualização de Resultados
1. Usuário acessa página de resultados
2. Seleciona tipo de loteria e número do concurso
3. Sistema exibe o resultado do sorteio

## Páginas Principais

- `/auth`: Autenticação (login/cadastro)
- `/dashboard`: Visão geral dos bolões e estatísticas
- `/meus-boloes`: Lista de bolões do usuário
- `/boloes/:id`: Detalhes de um bolão específico
- `/pesquisar-resultados`: Busca de resultados de loterias
- `/perfil`: Dados do perfil do usuário

## Integrações

### API de Loterias
A aplicação integra com a API `loteriascaixa-api.herokuapp.com` para obter resultados de sorteios.
