
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

// URL correta da API baseada na documentação
const API_BASE_URL = 'https://loteriascaixa-api.herokuapp.com/api';

/**
 * Função auxiliar para fazer requisições com retry
 */
async function fetchWithRetry(endpoint: string, maxRetries: number = 2): Promise<LotteryApiResponse> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentativa ${attempt + 1} para ${API_BASE_URL}${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: LotteryApiResponse = await response.json();
      console.log('Resposta da API recebida com sucesso:', data);
      return data;

    } catch (error: any) {
      lastError = error;
      console.log(`Erro na tentativa ${attempt + 1}:`, error.message);
      
      if (attempt < maxRetries) {
        // Aguarda antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
  }

  throw new Error(`Falha ao conectar com a API após ${maxRetries + 1} tentativas. Último erro: ${lastError.message}`);
}

/**
 * Busca o resultado de uma loteria específica pelo número do concurso
 */
export async function fetchLotteryResult(lotteryType: LotteryType, drawNumber: string): Promise<LotteryApiResponse> {
  const apiLotteryName = lotteryTypeMapping[lotteryType];
  return await fetchWithRetry(`/${apiLotteryName}/${drawNumber}`);
}

/**
 * Busca o último resultado de uma loteria específica
 */
export async function fetchLatestLotteryResult(lotteryType: LotteryType): Promise<LotteryApiResponse> {
  const apiLotteryName = lotteryTypeMapping[lotteryType];
  return await fetchWithRetry(`/${apiLotteryName}/latest`);
}

/**
 * Busca todos os resultados de uma loteria e tenta encontrar por data
 */
export async function fetchLotteryResultByDate(lotteryType: LotteryType, targetDate: string): Promise<LotteryApiResponse> {
  console.log(`Buscando resultado de ${lotteryType} para a data: ${targetDate}`);
  
  try {
    // Primeiro tenta buscar o último resultado
    console.log('Buscando último resultado disponível...');
    const latestResult = await fetchLatestLotteryResult(lotteryType);
    
    // Converte a data da API (DD/MM/YYYY) para comparação com a data alvo (YYYY-MM-DD)
    const resultDate = latestResult.data;
    const [day, month, year] = resultDate.split('/');
    const apiDateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    console.log(`Data do último resultado: ${apiDateFormatted}, Data solicitada: ${targetDate}`);
    
    // Se as datas correspondem, retorna o resultado
    if (apiDateFormatted === targetDate) {
      console.log('Data encontrada! Retornando resultado.');
      return latestResult;
    }
    
    // Se não corresponde, informa que está usando o último resultado disponível
    console.log('Data específica não encontrada, retornando último resultado disponível');
    return latestResult;
    
  } catch (error) {
    console.error('Erro ao buscar resultado:', error);
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
