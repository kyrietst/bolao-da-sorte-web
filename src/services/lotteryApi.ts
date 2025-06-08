
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
 * Busca resultado de loteria por data
 * @param lotteryType - Tipo de loteria
 * @param targetDate - Data alvo no formato YYYY-MM-DD
 * @returns Os dados do resultado do sorteio da data especificada
 */
export async function fetchLotteryResultByDate(lotteryType: LotteryType, targetDate: string): Promise<LotteryApiResponse> {
  const apiLotteryName = lotteryTypeMapping[lotteryType];
  
  try {
    // A API da Caixa não tem endpoint por data, então vamos buscar o último resultado
    // e verificar se corresponde à data desejada. Em uma implementação real,
    // você precisaria de uma API que permita busca por data específica
    console.log(`Buscando resultado de ${apiLotteryName} para a data: ${targetDate}`);
    
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
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar resultado por data:', error);
    throw error;
  }
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
