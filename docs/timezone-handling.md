# Guia de Tratamento de Timezone

Este documento descreve as melhores práticas para lidar com datas e horários no Bolão da Sorte, especialmente após a resolução do bug crítico de timezone em julho de 2025.

## Contexto do Bug Crítico

### O Problema

Em julho de 2025, o sistema apresentava um bug crítico onde:
- **Backend calculava corretamente**: "Terça-feira, 15 de julho"
- **Frontend exibia incorretamente**: "Segunda-feira, 14 de julho"

### Causa Raiz

```typescript
// ❌ CÓDIGO PROBLEMÁTICO:
const date = new Date('2025-07-15'); // UTC interpretation
// Resultado: 2025-07-15T00:00:00.000Z (UTC)
// Com timezone Brasil (-3h): vira 2025-07-14T21:00:00 (dia anterior!)
```

### Impacto

- Mega-Sena aparecia em dias incorretos (segunda-feira, quando não sorteia)
- Todas as loterias mostravam datas inconsistentes
- Comprometia a confiabilidade do sistema financeiro

## Solução Implementada

### Formatação Timezone-Safe

```typescript
// ✅ SOLUÇÃO CORRETA:
const formatDate = (dateString: string): string => {
  // Parseamento manual para evitar timezone
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month é 0-indexado
  
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};
```

### Comparação de Resultados

```javascript
const dateString = '2025-07-15';

// ❌ MÉTODO ANTIGO (BUG):
const oldDate = new Date(dateString);
console.log(oldDate.getDay()); // 1 (Segunda-feira) ❌
console.log(oldDate.toLocaleDateString('pt-BR', { weekday: 'long' })); 
// "segunda-feira, 14 de julho" ❌

// ✅ MÉTODO NOVO (CORRETO):
const [year, month, day] = dateString.split('-').map(Number);
const newDate = new Date(year, month - 1, day);
console.log(newDate.getDay()); // 2 (Terça-feira) ✅
console.log(newDate.toLocaleDateString('pt-BR', { weekday: 'long' }));
// "terça-feira, 15 de julho" ✅
```

## Regras Obrigatórias

### 1. Criação de Objetos Date

```typescript
// ✅ SEMPRE FAZER:
// Para strings no formato 'YYYY-MM-DD'
const [year, month, day] = dateString.split('-').map(Number);
const date = new Date(year, month - 1, day);

// Para componentes conhecidos
const date = new Date(2025, 6, 15); // 15 de julho de 2025

// ❌ NUNCA FAZER:
const date = new Date('2025-07-15'); // Timezone bug!
const date = new Date('2025-07-15T00:00:00'); // Ainda problemático
```

### 2. Comparação de Datas

```typescript
// ✅ COMPARAÇÃO SEGURA:
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// ❌ COMPARAÇÃO PROBLEMÁTICA:
function isSameDay(dateString1: string, dateString2: string): boolean {
  return new Date(dateString1).getTime() === new Date(dateString2).getTime();
}
```

### 3. Cálculo de Diferenças

```typescript
// ✅ DIFERENÇA EM DIAS (TIMEZONE-SAFE):
function daysDifference(dateString1: string, dateString2: string): number {
  const [y1, m1, d1] = dateString1.split('-').map(Number);
  const [y2, m2, d2] = dateString2.split('-').map(Number);
  
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
```

## Casos Específicos da Aplicação

### Cálculo de Próximo Sorteio

```typescript
function getNextDrawDate(lotteryType: LotteryType): Date {
  const now = new Date();
  const schedule = LOTTERY_SCHEDULES[lotteryType];
  
  // Verificar se hoje é dia de sorteio
  const todayDayOfWeek = now.getDay();
  if (schedule.includes(todayDayOfWeek) && now.getHours() < 20) {
    return new Date(now); // ✅ Hoje, sem conversão de string
  }
  
  // Procurar próximo dia
  let candidateDate = new Date(now);
  candidateDate.setDate(candidateDate.getDate() + 1);
  
  for (let daysAhead = 1; daysAhead <= 14; daysAhead++) {
    const dayOfWeek = candidateDate.getDay();
    
    if (schedule.includes(dayOfWeek)) {
      return new Date(candidateDate); // ✅ Retornar nova instância
    }
    
    candidateDate.setDate(candidateDate.getDate() + 1);
  }
  
  // Fallback
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  return fallback;
}
```

### Validação de Datas de Sorteio

```typescript
function isValidDrawDate(dateString: string, lotteryType: LotteryType): boolean {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  
  const schedule = LOTTERY_SCHEDULES[lotteryType];
  return schedule.includes(dayOfWeek);
}

// Uso:
const isValid = isValidDrawDate('2025-07-15', 'megasena'); // true (terça)
const isInvalid = isValidDrawDate('2025-07-14', 'megasena'); // false (segunda)
```

## Testes de Validação

### Script de Teste Manual

```javascript
// Execute no console do navegador para validar
function testTimezoneHandling() {
  const testDates = [
    '2025-07-14', // Segunda
    '2025-07-15', // Terça  
    '2025-07-16', // Quarta
    '2025-07-17', // Quinta
    '2025-07-18', // Sexta
    '2025-07-19', // Sábado
    '2025-07-20'  // Domingo
  ];
  
  testDates.forEach(dateString => {
    // Método correto
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    console.log(`${dateString} → ${date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: '2-digit' 
    })} (${date.getDay()})`);
  });
}

testTimezoneHandling();
```

### Resultado Esperado

```
2025-07-14 → segunda-feira, 14/07 (1)
2025-07-15 → terça-feira, 15/07 (2)  
2025-07-16 → quarta-feira, 16/07 (3)
2025-07-17 → quinta-feira, 17/07 (4)
2025-07-18 → sexta-feira, 18/07 (5)
2025-07-19 → sábado, 19/07 (6)
2025-07-20 → domingo, 20/07 (0)
```

## Debugging

### Logs Úteis

```typescript
function debugDateConversion(dateString: string) {
  console.log('=== DEBUG DATE CONVERSION ===');
  console.log('Input:', dateString);
  
  // Método antigo (problemático)
  const oldDate = new Date(dateString);
  console.log('Old method:', {
    date: oldDate,
    day: oldDate.getDay(),
    formatted: oldDate.toLocaleDateString('pt-BR', { weekday: 'long' })
  });
  
  // Método novo (correto)
  const [year, month, day] = dateString.split('-').map(Number);
  const newDate = new Date(year, month - 1, day);
  console.log('New method:', {
    date: newDate,
    day: newDate.getDay(),
    formatted: newDate.toLocaleDateString('pt-BR', { weekday: 'long' })
  });
  
  console.log('Timezone offset:', newDate.getTimezoneOffset());
}
```

## Checklist de Desenvolvimento

### Antes de Implementar Funcionalidades com Data

- [ ] Usar parseamento manual de strings YYYY-MM-DD
- [ ] Evitar `new Date(string)` para datas ISO
- [ ] Testar com diferentes timezones
- [ ] Validar contra cronogramas oficiais
- [ ] Verificar logs de debug em desenvolvimento
- [ ] Testar comparações de data
- [ ] Confirmar formatação de exibição

### Code Review

- [ ] Verificar todos os `new Date()` constructions
- [ ] Confirmar que não há conversões de string problemáticas
- [ ] Validar lógica de cálculo de dias
- [ ] Testar com datas de diferentes meses/anos
- [ ] Verificar tratamento de edge cases (finais de mês, anos bissextos)

## Monitoramento em Produção

### Alertas Recomendados

1. **Datas Inconsistentes**: Monitor que detecta discrepâncias entre backend e frontend
2. **Dias Inválidos**: Alert quando loterias aparecem em dias incorretos
3. **Timezone Drift**: Verificação periódica de offset de timezone

### Métricas Importantes

- Accuracy de cálculo de próximos sorteios
- Consistência entre cache e API
- Tempo de resposta de cálculos de data
- Taxa de erro em validações de cronograma

## Conclusão

O tratamento correto de timezone é **crítico** para a confiabilidade do sistema. Sempre priorize:

1. **Precisão** sobre performance
2. **Timezone-safe operations** sobre conveniência
3. **Testes extensivos** com diferentes cenários
4. **Monitoramento ativo** de inconsistências

**Lembre-se**: Em aplicações financeiras, um erro de data pode causar perdas monetárias reais e comprometer a confiança dos usuários.