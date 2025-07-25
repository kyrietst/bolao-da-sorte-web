import { LotteryType } from '@/types';

/**
 * Cronograma oficial das loterias da Caixa Econômica Federal
 * Fonte: https://loterias.caixa.gov.br/
 */

export interface LotterySchedule {
  daysOfWeek: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  name: string;
  description: string;
}

export const LOTTERY_SCHEDULES: Record<LotteryType, LotterySchedule> = {
  megasena: {
    daysOfWeek: [2, 4, 6], // Terça, Quinta, Sábado
    name: 'Mega-Sena',
    description: 'Sorteios às terças, quintas e sábados'
  }
};

/**
 * Verifica se uma data é um dia válido de sorteio para a loteria especificada
 */
export function isValidLotteryDate(lotteryType: LotteryType, dateString: string): boolean {
  try {
    // Extrair apenas a parte da data se estiver no formato ISO
    const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    
    // Parse timezone-safe
    const [year, month, day] = dateOnly.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const dayOfWeek = date.getDay();
    const schedule = LOTTERY_SCHEDULES[lotteryType];
    
    return schedule.daysOfWeek.includes(dayOfWeek);
  } catch (error) {
    console.error('Erro ao validar data da loteria:', error);
    return false;
  }
}

/**
 * Encontra a próxima data válida de sorteio para a loteria especificada
 */
export function getNextValidLotteryDate(lotteryType: LotteryType, fromDate?: string): string {
  const schedule = LOTTERY_SCHEDULES[lotteryType];
  const startDate = fromDate ? new Date(fromDate) : new Date();
  
  // Começar a busca a partir de hoje ou da data fornecida
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  // Procurar até 14 dias à frente (2 semanas)
  for (let i = 0; i < 14; i++) {
    const dayOfWeek = currentDate.getDay();
    
    if (schedule.daysOfWeek.includes(dayOfWeek)) {
      // Retornar no formato YYYY-MM-DD
      return currentDate.toISOString().split('T')[0];
    }
    
    // Avançar para o próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Fallback: retornar a data atual se nada for encontrado
  return new Date().toISOString().split('T')[0];
}

/**
 * Encontra a data válida anterior mais próxima para a loteria especificada
 */
export function getPreviousValidLotteryDate(lotteryType: LotteryType, fromDate?: string): string {
  const schedule = LOTTERY_SCHEDULES[lotteryType];
  const startDate = fromDate ? new Date(fromDate) : new Date();
  
  // Começar a busca a partir de hoje ou da data fornecida
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  // Procurar até 14 dias atrás (2 semanas)
  for (let i = 0; i < 14; i++) {
    const dayOfWeek = currentDate.getDay();
    
    if (schedule.daysOfWeek.includes(dayOfWeek)) {
      // Retornar no formato YYYY-MM-DD
      return currentDate.toISOString().split('T')[0];
    }
    
    // Voltar para o dia anterior
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  // Fallback: retornar a data atual se nada for encontrado
  return new Date().toISOString().split('T')[0];
}

/**
 * Gera uma lista de datas válidas para a loteria especificada no mês/ano
 */
export function getValidLotteryDatesInMonth(lotteryType: LotteryType, year: number, month: number): string[] {
  const schedule = LOTTERY_SCHEDULES[lotteryType];
  const validDates: string[] = [];
  
  // Primeiro dia do mês
  const firstDay = new Date(year, month - 1, 1);
  // Último dia do mês
  const lastDay = new Date(year, month, 0);
  
  const currentDate = new Date(firstDay);
  
  while (currentDate <= lastDay) {
    const dayOfWeek = currentDate.getDay();
    
    if (schedule.daysOfWeek.includes(dayOfWeek)) {
      validDates.push(currentDate.toISOString().split('T')[0]);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return validDates;
}

/**
 * Formata o nome do dia da semana em português
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[dayOfWeek] || 'Desconhecido';
}

/**
 * Gera uma mensagem explicativa sobre quando a loteria tem sorteios
 */
export function getLotteryScheduleDescription(lotteryType: LotteryType): string {
  const schedule = LOTTERY_SCHEDULES[lotteryType];
  const dayNames = schedule.daysOfWeek.map(day => getDayName(day));
  
  if (dayNames.length === 1) {
    return `${schedule.name} tem sorteios apenas às ${dayNames[0].toLowerCase()}s.`;
  } else if (dayNames.length === 2) {
    return `${schedule.name} tem sorteios às ${dayNames[0].toLowerCase()}s e ${dayNames[1].toLowerCase()}s.`;
  } else {
    const lastDay = dayNames.pop();
    return `${schedule.name} tem sorteios às ${dayNames.join(', ').toLowerCase()}s e ${lastDay?.toLowerCase()}s.`;
  }
}