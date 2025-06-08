
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

// URLs alternativas da API
const API_URLS = [
  'https://loteriascaixa-api.herokuapp.com/api',
  'https://servicebus2.caixa.gov.br/portaldeloterias/api/resultados',
];

/**
 * Função auxiliar para fazer requisições com retry e múltiplas URLs
 */
async function fetchWithRetry(endpoint: string, maxRetries: number = 2): Promise<LotteryApiResponse> {
  let lastError: Error;

  for (const baseUrl of API_URLS) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt + 1} para ${baseUrl}${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

        const response = await fetch(`${baseUrl}${endpoint}`, {
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
        console.log(`Erro na tentativa ${attempt + 1} com ${baseUrl}:`, error.message);
        
        if (attempt < maxRetries) {
          // Aguarda antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
  }

  throw new Error(`Falha ao conectar com a API após todas as tentativas. Último erro: ${lastError.message}`);
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
 * Busca resultado de loteria por data específica
 * Como a API não tem endpoint direto por data, busca o último resultado
 * e verifica se a data corresponde
 */
export async function fetchLotteryResultByDate(lotteryType: LotteryType, targetDate: string): Promise<LotteryApiResponse> {
  console.log(`Buscando resultado de ${lotteryType} para a data: ${targetDate}`);
  
  try {
    // Primeiro tenta buscar o último resultado
    const latestResult = await fetchLatestLotteryResult(lotteryType);
    
    // Converte a data da API (DD/MM/YYYY) para comparação com a data alvo (YYYY-MM-DD)
    const resultDate = latestResult.data;
    const [day, month, year] = resultDate.split('/');
    const apiDateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    console.log(`Data do resultado da API: ${apiDateFormatted}, Data solicitada: ${targetDate}`);
    
    // Se as datas correspondem, retorna o resultado
    if (apiDateFormatted === targetDate) {
      return latestResult;
    }
    
    // Se não corresponde, tenta estimar o número do concurso e buscar diretamente
    const estimatedDrawNumber = estimateDrawNumberByDate(lotteryType, targetDate);
    console.log(`Tentando buscar concurso estimado: ${estimatedDrawNumber}`);
    
    try {
      const specificResult = await fetchLotteryResult(lotteryType, estimatedDrawNumber);
      return specificResult;
    } catch (specificError) {
      console.log('Erro ao buscar concurso específico, retornando último resultado disponível');
      // Se falhar, retorna o último resultado com aviso
      throw new Error(`Concurso específico para ${targetDate} não encontrado. Último resultado disponível é de ${resultDate}.`);
    }
    
  } catch (error) {
    console.error('Erro ao buscar resultado por data:', error);
    throw error;
  }
}

/**
 * Estima o número do concurso baseado na data
 */
function estimateDrawNumberByDate(lotteryType: LotteryType, targetDate: string): string {
  const baseDate = new Date('2024-01-01');
  const target = new Date(targetDate);
  const daysDiff = Math.floor((target.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (lotteryType === 'megasena') {
    // Megasena: sorteios às quartas e sábados (2 por semana)
    const weeksFromBase = Math.floor(daysDiff / 7);
    return String(2700 + (weeksFromBase * 2));
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
