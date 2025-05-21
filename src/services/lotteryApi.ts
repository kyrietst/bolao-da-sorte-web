
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
