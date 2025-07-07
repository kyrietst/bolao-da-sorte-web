# Plano de Refatoração de Hooks - Bolão da Sorte

Este documento descreve as tarefas para refatorar o uso de hooks no projeto, com o objetivo de melhorar a previsibilidade, testabilidade e alinhamento com as melhores práticas do React.

---

## Tarefa 1: Refatorar `PoolDetailContext` para usar `useReducer`

**Objetivo**: Simplificar o gerenciamento de estado complexo, tornando as transições de estado mais explícitas e previsíveis.

- [x] **Subtarefa 1.1**: Definir os tipos de estado (`State`) e ações (`Action`) para o reducer.
- [x] **Subtarefa 1.2**: Criar a função `poolDetailReducer` para gerenciar as transições de estado (ex: `FETCH_START`, `FETCH_SUCCESS`, `FETCH_ERROR`).
- [x] **Subtarefa 1.3**: Substituir os múltiplos `useState` no `PoolDetailProvider` por uma única chamada a `useReducer`.
- [x] **Subtarefa 1.4**: Refatorar a lógica de busca de dados para despachar ações (`dispatch`) em vez de usar `setState`.

---

## Tarefa 2: Extrair Lógica para o Hook Customizado `usePoolResults`

**Objetivo**: Desacoplar a lógica de negócio de apuração de resultados do componente de UI, melhorando a organização e facilitando testes.

- [x] **Subtarefa 2.1**: Criar o arquivo `src/hooks/usePoolResults.ts`.
- [x] **Subtarefa 2.2**: Mover a lógica da função `checkResults` e os estados relacionados (`loading`, `results`, `stats`) de `PoolResults.tsx` para o novo hook.
- [x] **Subtarefa 2.3**: O hook deve aceitar `tickets` e `lotteryType` como parâmetros e retornar `{ results, stats, loading, checkResults }`.
- [x] **Subtarefa 2.4**: Refatorar o componente `PoolResults.tsx` para consumir o hook `usePoolResults` e se tornar um componente de apresentação.

---

## Tarefa 3: Analisar e Refatorar o Gerenciamento de Estado de Formulários

**Objetivo**: Avaliar se o gerenciamento de estado em formulários complexos pode ser melhorado com `useReducer` ou bibliotecas específicas.

- [x] **Subtarefa 3.1**: Analisar o componente `CreatePoolForm.tsx`.
- [x] **Subtarefa 3.2**: Identificar se o número de campos (7) e a lógica de reset do formulário justificam o uso de `useReducer`. **Decisão: Sim, a refatoração é justificada.**
- [x] **Subtarefa 3.3**: Refatorar o `CreatePoolForm.tsx` para usar `useReducer`, consolidando o estado do formulário e a lógica de atualização.
