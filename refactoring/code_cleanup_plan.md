# Plano de Limpeza e Otimização de Código

Este documento descreve um plano de ação para analisar e limpar o código-fonte do projeto "Bolão da Sorte", com o objetivo de melhorar a manutenibilidade, legibilidade e performance, removendo código morto ou desnecessário.

---

## Tarefa 1: Identificar e Remover Componentes Não Utilizados

**Objetivo**: Encontrar componentes React que foram criados mas nunca são renderizados na aplicação.

**Método**:
1.  Utilizar a funcionalidade "Find File References" ou "Find Usages" da IDE para cada arquivo de componente em `src/components`.
2.  Se um componente não possuir nenhuma importação em outras páginas ou componentes, ele é um candidato para remoção.
3.  Prestar atenção especial a componentes que podem ser renderizados dinamicamente ou através de rotas, para evitar falsos positivos.

**Checklist**:
-   [x] Analisar o diretório `src/components`.
-   [x] Para cada componente, verificar suas referências de uso no projeto.
-   [x] Listar os componentes identificados como não utilizados.
-   [x] Remover os arquivos dos componentes listados.

---

## Tarefa 2: Identificar e Remover Funções e Variáveis Não Utilizadas

**Objetivo**: Localizar funções e variáveis que foram declaradas mas nunca são chamadas ou lidas.

**Método**:
1.  Configurar e executar o ESLint com a regra `no-unused-vars` ativada. A maioria das configurações padrão já inclui isso.
2.  A IDE geralmente destaca visualmente (sublinhando ou com cor diferente) o código não utilizado.
3.  Revisar manualmente arquivos de utilitários (`src/lib/utils.ts`) e hooks (`src/hooks`) para funções exportadas que podem ter se tornado obsoletas após refatorações.

**Checklist**:
-   [x] Executar o linter (`npm run lint` ou similar) e verificar os avisos de `no-unused-vars`.
-   [x] Inspecionar visualmente os arquivos em busca de código destacado como não utilizado pela IDE.
-   [x] Listar as funções e variáveis que podem ser removidas com segurança.
-   [x] Remover o código identificado.

---

## Tarefa 3: Limpar Importações Não Utilizadas

**Objetivo**: Remover todas as declarações `import` que não são usadas no arquivo.

**Método**:
1.  Esta é a tarefa mais simples, pois as ferramentas modernas automatizam quase completamente o processo.
2.  Utilizar o comando "Organize Imports" da IDE (geralmente `Ctrl+Shift+O` ou `Alt+Shift+O`) em todos os arquivos `.ts` e `.tsx`.

**Checklist**:
-   [x] Executar "Organize Imports" em toda a base de código.
-   [x] Executar o linter novamente para garantir que não restaram importações não utilizadas.

---

## Tarefa 4: Analisar o Uso de Estado (`useState`)

**Objetivo**: Identificar variáveis de estado que são desnecessárias.

**Método**:
1.  O linter (`no-unused-vars`) geralmente identifica quando a variável de estado ou sua função de `set` nunca são usadas.
2.  Analisar manualmente casos onde o estado é inicializado e seu valor nunca muda (a função `set` nunca é chamada). Nesses casos, o `useState` pode ser substituído por `useMemo` ou simplesmente uma `const`.

**Checklist**:
-   [x] Procurar por avisos do linter relacionados a `useState`.
-   [x] Inspecionar manualmente os usos de `useState` para identificar estados que nunca são atualizados.
-   [x] Listar os estados que podem ser refatorados ou removidos.
-   [x] Aplicar as refatorações necessárias.

---

## Tarefa 5: Revisar e Remover Código Comentado

**Objetivo**: Remover blocos de código comentados que não servem a um propósito claro, confiando no histórico do Git para o versionamento.

**Método**:
1.  Fazer uma busca global por `//` e `/*` para encontrar todo o código comentado.
2.  Analisar cada ocorrência. Se o código não tiver uma explicação clara (ex: `// TODO: Implementar X`, `// BUG: ...`), deve ser removido.
3.  Código antigo ou de depuração deve ser removido para não poluir o arquivo.

**Checklist**:
-   [x] Realizar uma busca global por blocos de código comentados.
-   [x] Avaliar a necessidade de cada bloco.
-   [x] Remover todo o código comentado que for considerado obsoleto ou desnecessário.
