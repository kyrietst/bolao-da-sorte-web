
import { LotteryType } from '@/types';

// Mapeamento de tipos de loteria internos para os nomes usados na API
const lotteryTypeMapping: Record<LotteryType, string> = {
  megasena: 'megasena',
  lotofacil: 'lotofacil',
  quina: 'quina',
  lotomania: 'lotomania',
  timemania: 'timemania',
  duplasena: 'duplasena',
};

// Tipo para a resposta da API
export interface LotteryApiResponse {
  loteria: string;
  concurso: string;
  data: string;
  dezenas: string[];
  premiacoes: {
    acertos: string;
    vencedores: number;
    premio: string;
  }[];
  acumulou: boolean;
  acumuladaProxConcurso?: string;
  dataProxConcurso: string;
  proxConcurso: string;
}

/**
 * Busca o resultado de uma loteria específica pelo número do concurso
 * @param lotteryType - Tipo de loteria
 * @param drawNumber - Número do concurso
 * @returns Os dados do resultado do sorteio
 */
export async function fetchLotteryResult(lotteryType: LotteryType, drawNumber: string): Promise<LotteryApiResponse> {
  const apiLotteryName = lotteryTypeMapping[lotteryType];
  
  try {
    const response = await fetch(`https://loteriascaixa-api.herokuapp.com/api/${apiLotteryName}/${drawNumber}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar resultado: ${response.status}`);
    }
    
    const data: LotteryApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados da loteria:', error);
    throw error;
  }
}

/**
 * Busca o último resultado de uma loteria específica
 * @param lotteryType - Tipo de loteria
 * @returns Os dados do último resultado do sorteio
 */
export async function fetchLatestLotteryResult(lotteryType: LotteryType): Promise<LotteryApiResponse> {
  const apiLotteryName = lotteryTypeMapping[lotteryType];
  
  try {
    const response = await fetch(`https://loteriascaixa-api.herokuapp.com/api/${apiLotteryName}/latest`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar último resultado: ${response.status}`);
    }
    
    const data: LotteryApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar último resultado da loteria:', error);
    throw error;
  }
}

/**
 * Busca resultado de loteria por data específica
 * @param lotteryType - Tipo de loteria
 * @param targetDate - Data alvo no formato YYYY-MM-DD
 * @returns Os dados do resultado do sorteio da data especificada
 */
export async function fetchLotteryResultByDate(lotteryType: LotteryType, targetDate: string): Promise<LotteryApiResponse> {
  const apiLotteryName = lotteryTypeMapping[lotteryType];
  
  try {
    console.log(`Buscando resultado de ${apiLotteryName} para a data: ${targetDate}`);
    
    // Primeiro, tenta buscar o último resultado para verificar se corresponde à data
    const response = await fetch(`https://loteriascaixa-api.herokuapp.com/api/${apiLotteryName}/latest`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar resultado por data: ${response.status}`);
    }
    
    const data: LotteryApiResponse = await response.json();
    
    // Converter a data da API (DD/MM/YYYY) para comparação
    const resultDate = data.data;
    const [day, month, year] = resultDate.split('/');
    const apiDateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    console.log(`Data do resultado da API: ${apiDateFormatted}, Data solicitada: ${targetDate}`);
    
    // Se as datas correspondem, retorna o resultado
    if (apiDateFormatted === targetDate) {
      return data;
    }
    
    // Se não corresponde, tenta buscar por número de concurso estimado
    // Como não temos um endpoint por data específica, isso é uma limitação da API
    throw new Error(`Nenhum resultado encontrado para a data ${targetDate}. Último resultado disponível é de ${resultDate}.`);
    
  } catch (error) {
    console.error('Erro ao buscar resultado por data:', error);
    throw error;
  }
}

/**
 * Estima o número do concurso baseado na data
 * Esta é uma função auxiliar que pode ser melhorada com dados mais precisos
 */
function estimateDrawNumberByDate(lotteryType: LotteryType, targetDate: string): string {
  // Esta é uma estimativa simples. Em um sistema real, você teria
  // um banco de dados com o histórico de concursos e suas datas
  const baseDate = new Date('2024-01-01');
  const target = new Date(targetDate);
  const daysDiff = Math.floor((target.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Megasena: sorteios às quartas e sábados (2 por semana)
  if (lotteryType === 'megasena') {
    const weeksFromBase = Math.floor(daysDiff / 7);
    return String(2700 + (weeksFromBase * 2)); // Número base estimado
  }
  
  // Para outros tipos, retorna um número estimado
  return String(Math.floor(daysDiff / 3) + 1000);
}

/**
 * Converte a resposta da API para o formato usado pela aplicação
 */
export function convertApiResponseToLotteryResult(response: LotteryApiResponse): {
  id: string;
  lotteryType: LotteryType;
  drawNumber: string;
  drawDate: string;
  numbers: number[];
  winners: number;
  accumulated: boolean;
  prizes?: Array<{
    hits: string;
    winners: number;
    prize: string;
  }>;
} {
  // Encontra o número total de ganhadores (soma de todas as categorias)
  const totalWinners = response.premiacoes.reduce((sum, prize) => sum + prize.vencedores, 0);
  
  // Converte as dezenas de string para número
  const numbers = response.dezenas.map(num => parseInt(num, 10));
  
  // Converte o formato de data para o formato usado pela aplicação (YYYY-MM-DD)
  // A API retorna no formato DD/MM/YYYY
  const dateParts = response.data.split('/');
  const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  
  // Determina o tipo de loteria baseado no nome da API
  const lotteryType = Object.entries(lotteryTypeMapping)
    .find(([_, apiName]) => apiName === response.loteria)?.[0] as LotteryType;
  
  return {
    id: response.concurso,
    lotteryType,
    drawNumber: response.concurso,
    drawDate: formattedDate,
    numbers,
    winners: totalWinners,
    accumulated: response.acumulou,
    prizes: response.premiacoes.map(prize => ({
      hits: prize.acertos,
      winners: prize.vencedores,
      prize: prize.premio
    }))
  };
}
