# Plano de Refatoração - Bolão da Sorte

Este documento descreve as tarefas para refatorar o código da aplicação, eliminando duplicações e melhorando a manutenibilidade, seguindo o princípio DRY (Don't Repeat Yourself).

## Tarefa 1: Centralizar Funções Utilitárias

**Objetivo**: Mover funções duplicadas para um local central.

### Subtarefa 1.1: Criar `utils.ts` para a função `convertSupabasePoolToPool`

-   [x] Criar o arquivo `src/lib/utils.ts` (se já não existir).
-   [x] Mover a função `convertSupabasePoolToPool` de `Dashboard.tsx` e `MyPools.tsx` para `src/lib/utils.ts`.
-   [x] Exportar a função a partir de `utils.ts`.
-   [x] Importar e usar a função `convertSupabasePoolToPool` de `utils.ts` nos arquivos `Dashboard.tsx` e `MyPools.tsx`.

---

## Tarefa 2: Abstrair Lógica de Busca de Dados com Custom Hook

**Objetivo**: Encapsular a lógica de busca de bolões do usuário em um hook reutilizável.

### Subtarefa 2.1: Criar o hook `useUserPools`

-   [x] Criar o arquivo `src/hooks/useUserPools.ts`.
-   [x] Mover a lógica de `fetchUserPools` (de `Dashboard.tsx`) para dentro do novo hook.
-   [x] O hook deve gerenciar os estados `pools`, `loading` e `error`.
-   [x] O hook deve aceitar o `userId` como parâmetro.
-   [x] O hook deve retornar `{ pools, loading, error }`.

### Subtarefa 2.2: Refatorar `Dashboard.tsx` para usar o hook

-   [x] Remover a função `fetchUserPools` e os `useState` relacionados a `pools` e `loading`.
-   [x] Chamar o hook `useUserPools` para obter os dados.
-   [x] Manter a lógica de cálculo de `participantsCount` e `nextDrawDate` dentro do componente, baseando-se nos dados retornados pelo hook.

### Subtarefa 2.3: Refatorar `MyPools.tsx` para usar o hook

-   [x] Remover a função `fetchPools` e os `useState` relacionados.
-   [x] Chamar o hook `useUserPools` para obter os dados e renderizar a tabela.

---

## Tarefa 3: Criar Componentes de UI Reutilizáveis

**Objetivo**: Substituir blocos de JSX duplicados por componentes.

### Subtarefa 3.1: Criar o componente `PoolStatusBadge`

-   [x] Criar o arquivo `src/components/pool/PoolStatusBadge.tsx`.
-   [x] O componente deve receber `status: 'ativo' | 'finalizado'` como prop.
-   [x] Mover a lógica do `<span>` que renderiza o status para dentro deste componente.
-   [x] Substituir o JSX do status em `Dashboard.tsx` e `MyPools.tsx` pelo novo componente.

### Subtarefa 3.2: Criar o componente `EmptyState`

-   [x] Criar o arquivo `src/components/ui/EmptyState.tsx` (ou similar).
-   [x] O componente pode receber props como `title`, `description`, `icon` e `children` para customização.
-   [x] Mover o JSX da mensagem "Nenhum bolão encontrado" para este componente.
-   [x] Usar o componente `EmptyState` em `Dashboard.tsx` e `MyPools.tsx` quando a lista de bolões estiver vazia.

### Subtarefa 3.3: (Opcional) Criar o componente `PoolCard`

-   [x] Criar o arquivo `src/components/pool/PoolCard.tsx`.
-   [x] O componente deve receber o objeto `pool` como prop.
-   [x] Mover o JSX do `<Link>` que renderiza o card do bolão para este componente.
-   [x] Usar o componente `PoolCard` no `Dashboard.tsx` para renderizar a lista de bolões.
