# Plano de Melhoria da Tipagem TypeScript

Este documento descreve um plano de ação para fortalecer o uso do TypeScript no projeto, aumentando a segurança do código e melhorando a experiência de desenvolvimento.

---

## Tarefa 1: Substituir `any` por `unknown` em Blocos `catch`

**Objetivo**: Eliminar o uso de `any` em cláusulas `catch`, forçando uma verificação de tipo segura antes de manipular o objeto de erro.

**Método**:
1.  Buscar por todas as ocorrências de `catch (error: any)` no código.
2.  Substituir `any` por `unknown`.
3.  Dentro do bloco `catch`, verificar o tipo do erro antes de acessar suas propriedades (ex: `if (error instanceof Error)`).

**Checklist**:
-   [ ] Mapear todos os arquivos que usam `catch (error: any)`.
-   [ ] Aplicar a substituição para `unknown` em cada arquivo.
-   [ ] Adicionar a verificação de tipo para o objeto de erro.

---

## Tarefa 2: Padronizar o Uso de `interface` para Definição de Props e Objetos

**Objetivo**: Adotar um padrão consistente para a definição de tipos de objetos e props, utilizando `interface` em vez de `type` para aproveitar a capacidade de extensão e declaração de implementação.

**Método**:
1.  Revisar o arquivo `src/types/index.ts`.
2.  Converter todas as definições de `type` que descrevem a forma de um objeto para `interface`.
3.  Revisar os componentes e converter a tipagem de `props` de `type` para `interface`.

**Checklist**:
-   [ ] Converter os tipos em `src/types/index.ts` para interfaces.
-   [ ] Converter os tipos de props nos componentes para interfaces.
-   [ ] Garantir que o projeto continue compilando sem erros após a mudança.

---

## Tarefa 3: Criar Tipos Específicos para IDs

**Objetivo**: Aumentar a clareza e a segurança do código, diferenciando os vários tipos de IDs que atualmente são todos `string`.

**Método**:
1.  Criar tipos nominais (branded types) para cada tipo de ID (ex: `UserId`, `PoolId`, `TicketId`).
2.  Substituir o uso de `string` por esses novos tipos específicos nas interfaces e funções relevantes.

**Exemplo de Branded Type**:
```typescript
export type Brand<K, T> = K & { __brand: T };

export type UserId = Brand<string, 'UserId'>;
export type PoolId = Brand<string, 'PoolId'>;
```

**Checklist**:
-   [ ] Definir a estrutura do `Brand` type.
-   [ ] Criar os tipos específicos para `UserId`, `PoolId`, etc.
-   [ ] Refatorar as interfaces (`User`, `Pool`, `Participant`, `Ticket`) para usar os novos tipos de ID.

