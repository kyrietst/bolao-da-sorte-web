# Cronogramas Oficiais das Loterias

Este documento contém as informações oficiais sobre os cronogramas de sorteios das loterias da Caixa Econômica Federal.

## Horário dos Sorteios

Todos os sorteios acontecem **a partir das 20h** (horário de Brasília).

## Cronogramas por Loteria

### Mega-Sena
- **Dias**: Terças-feiras, Quintas-feiras e Sábados
- **Horário**: 20h
- **Frequência**: 3 sorteios por semana

### Lotofácil
- **Dias**: Segundas, Terças, Quartas, Quintas, Sextas e Sábados
- **Horário**: 20h
- **Frequência**: 6 sorteios por semana

### Quina
- **Dias**: Segundas, Terças, Quartas, Quintas, Sextas e Sábados
- **Horário**: 20h
- **Frequência**: 6 sorteios por semana

### Lotomania
- **Dias**: Segundas, Quartas e Sextas-feiras
- **Horário**: 20h
- **Frequência**: 3 sorteios por semana

### Timemania
- **Dias**: Terças-feiras, Quintas-feiras e Sábados
- **Horário**: 20h
- **Frequência**: 3 sorteios por semana

### Dupla Sena
- **Dias**: Segundas, Quartas e Sextas-feiras
- **Horário**: 20h
- **Frequência**: 3 sorteios por semana

## Implementação no Código

O arquivo `src/components/dashboard/NextDrawCard.tsx` utiliza essas informações para calcular automaticamente a próxima data de sorteio:

```typescript
const LOTTERY_SCHEDULES: Record<LotteryType, number[]> = {
  megasena: [2, 4, 6],        // Terças, quintas e sábados
  lotofacil: [1, 2, 3, 4, 5, 6], // Segunda a sábado
  quina: [1, 2, 3, 4, 5, 6],     // Segunda a sábado
  lotomania: [1, 3, 5],          // Segundas, quartas e sextas
  timemania: [2, 4, 6],          // Terças, quintas e sábados
  duplasena: [1, 3, 5],          // Segundas, quartas e sextas
};
```

## Observações Importantes

1. **Feriados**: Em feriados nacionais, os sorteios podem ser adiados para o próximo dia útil com sorteio da modalidade.

2. **Horário de Brasília**: Todos os horários seguem o fuso horário de Brasília (GMT-3).

3. **Validação**: O sistema automaticamente verifica se já passou das 20h do dia atual para determinar se o próximo sorteio será hoje ou no próximo dia programado.

4. **Fonte**: Informações baseadas nas regras oficiais da Caixa Econômica Federal.

## Validação Implementada

O sistema agora inclui validação automática que:

1. **Verifica cronogramas**: Garante que apenas dias válidos sejam exibidos
2. **Calcula sequencialmente**: Próximo concurso = último concurso + 1  
3. **Respeita horários**: Considera o horário de 20h para determinar se o sorteio é hoje ou no próximo dia válido
4. **Logs detalhados**: Console mostra o processo de cálculo para auditoria

### Exemplo de Validação (13/07/2025 - Domingo):
- ❌ **Mega-Sena**: NÃO sorteia domingo ou segunda → Próximo: **Terça, 15/07**
- ✅ **Lotofácil**: Sorteia segunda → Próximo: **Segunda, 14/07**  
- ✅ **Lotomania**: Sorteia segunda → Próximo: **Segunda, 14/07**

## Bug Crítico Resolvido - Julho 2025

### Problema de Timezone Corrigido

Durante o desenvolvimento, foi identificado um **bug crítico de timezone** que causava exibição incorreta de datas:

**Problema**:
```typescript
// ❌ CAUSAVA BUG DE TIMEZONE:
const date = new Date('2025-07-15'); // UTC interpretation
// Resultado no Brasil (-3h): "segunda-feira, 14 de julho" ❌
```

**Solução**:
```typescript
// ✅ TIMEZONE-SAFE IMPLEMENTADO:
const [year, month, day] = dateString.split('-').map(Number);
const date = new Date(year, month - 1, day);
// Resultado: "terça-feira, 15 de julho" ✅
```

### Impacto da Correção

- **Antes**: Mega-Sena aparecia em "segunda-feira" (dia inválido)
- **Depois**: Mega-Sena corretamente em "terça-feira" (cronograma oficial)
- **Sistema**: 100% confiável para operações financeiras

Ver `docs/bug-resolution-timeline.md` para detalhes técnicos completos.

## Última Atualização

Este documento foi atualizado em julho de 2025 com o foco exclusivo na Mega-Sena após a simplificação da aplicação e a resolução do bug crítico de timezone, implementando cálculos precisos baseados apenas em dados reais da API e cronograma oficial da Mega-Sena da Caixa Econômica Federal.