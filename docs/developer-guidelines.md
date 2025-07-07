
# Diretrizes para Desenvolvimento - Bolão da Sorte

Este documento fornece diretrizes e estabelece as melhores práticas para desenvolvedores que contribuem para o projeto Bolão da Sorte. O objetivo é manter um código consistente, escalável e de alta qualidade.

## Filosofia de Arquitetura

Adotamos duas filosofias principais para guiar nosso desenvolvimento:

1.  **Arquitetura Orientada a Features (Feature-Sliced Design)**: O código é organizado por funcionalidade, não por tipo. Isso melhora a localização do código, a escalabilidade e o encapsulamento. Cada nova funcionalidade de negócio deve residir em seu próprio diretório dentro de `src/features`.

2.  **Hooks-First e Componentes "Dumb"**: A lógica de negócio, o estado e os efeitos colaterais devem ser extraídos para **Custom Hooks**. Os componentes React devem ser o mais "burros" (presentacionais) possível, responsáveis apenas por renderizar a UI e delegar todas as ações para os hooks que consomem.

## Stack Tecnológica

- **Frontend**: React 18+ com TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router v6, TanStack React Query, Lucide React.
- **Backend**: Supabase (Auth, Database, Storage).

## Estrutura de Arquivos (Feature-Sliced)

```
src/
  ├── assets/           # Imagens, fontes, etc.
  ├── components/       # Componentes de UI globais e reutilizáveis (átomos)
  │   └── ui/           # Componentes base do shadcn/ui
  ├── features/         # **CORE DA APLICAÇÃO: Módulos de negócio**
  │   └── auth/         # Exemplo: Feature de Autenticação
  │       ├── components/ # Componentes específicos da feature de auth
  │       ├── hooks/      # Hooks específicos (ex: useProfile)
  │       ├── providers/  # Context providers (ex: AuthProvider)
  │       └── types.ts    # Tipos específicos da feature
  ├── hooks/            # Hooks globais (ex: useToast)
  ├── integrations/     # Clientes e configurações de serviços externos
  ├── layout/           # Componentes de layout da página (MainLayout, etc)
  ├── lib/              # Funções utilitárias (ex: cn, formatters)
  ├── pages/            # Arquivos de rota, que montam as features
  ├── types/            # Tipos globais da aplicação (ex: Pool, LotteryType)
  └── App.tsx           # Ponto de entrada e configuração de rotas
```

## Gerenciamento de Estado: A Pirâmide de Complexidade

Escolha a ferramenta de estado com base na complexidade do problema:

1.  **`useState` (Base da Pirâmide)**: Use para estados simples e locais de um componente (ex: `const [isOpen, setOpen] = useState(false)`).

2.  **`useReducer` (Meio da Pirâmide)**: Use quando o estado de um componente se torna complexo, com múltiplas sub-propriedades ou transições de estado interdependentes. É ideal para formulários e máquinas de estado simples.
    - **Quando usar?** Se você tem mais de 2-3 `useState` que mudam juntos ou uma lógica de atualização complexa.
    - **Exemplo**: A primeira refatoração do `CreatePoolForm` usou `useReducer` para gerenciar 7 campos de uma vez.

3.  **Custom Hooks (Topo da Pirâmide)**: A principal ferramenta para encapsular lógica. Extraia a lógica para um hook quando um componente:
    - Contém lógica de negócio (cálculos, validações).
    - Gerencia estado complexo (com `useState` ou `useReducer`).
    - Realiza chamadas de API e gerencia estados de `loading`, `error` e `data`.
    - **Exemplos no projeto**: `usePoolResults`, `useCreatePool`, `useUserPools`.

4.  **React Context (Para Estado Global)**: Use para compartilhar estado que é verdadeiramente global e não muda com frequência. **Não use Context como um substituto para Redux**. Ele é ideal para:
    - Estado de autenticação (`AuthProvider`).
    - Tema da aplicação.
    - Dados que precisam ser acessados em pontos distantes da árvore de componentes sem prop drilling (`PoolDetailProvider`).

5.  **TanStack React Query (Estado do Servidor)**: **SEMPRE** use React Query para buscar, cachear e sincronizar dados do servidor. Não use `useState` + `useEffect` para isso.

## Diretrizes de Código e Conselhos

### Para Futuros Desenvolvedores

-   **Pense em Features, não em Pastas**: Ao adicionar uma funcionalidade, como "notificações", crie `src/features/notifications` e coloque tudo relacionado (componentes, hooks, etc.) lá dentro.
-   **Seu Componente Está Fazendo Demais?**: Se um componente tem mais de 150 linhas, ou contém qualquer lógica que não seja puramente de renderização, **extraia para um hook**. O componente deve ler de um hook, não pensar por si só. `PoolResults.tsx` é o exemplo perfeito dessa transformação.
-   **Mantenha a Tipagem Forte**: Aproveite o TypeScript. Defina tipos claros para props, estados, ações de reducers e retornos de hooks. Evite o uso de `any`.
-   **Padrão de Retorno de Hooks**: Hooks que realizam operações assíncronas devem retornar um estado consistente: `{ data, loading, error, performAction }`.

### Autenticação

-   **Acesso ao Usuário**: Use `useAuth()` de `features/auth/providers/AuthProvider`.
-   **Acesso ao Perfil**: Use o hook `useProfile()` de `features/auth/hooks/useProfile` para obter dados da tabela `profiles`.
-   **Rotas Protegidas**: Envolva a rota com o componente `AuthGuard`.

### Nomenclatura

-   **Componentes**: `PascalCase` (ex: `PoolCard.tsx`).
-   **Hooks**: `useCamelCase` (ex: `useCreatePool.ts`).
-   **Tipos**: `PascalCase` (ex: `LotteryResult`).
-   **Arquivos de Features**: `kebab-case` para diretórios (ex: `lottery-results/`), `PascalCase` ou `useCamelCase` para arquivos internos.

