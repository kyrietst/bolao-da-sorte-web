
import { LotteryType } from '@/types';
import { HybridLotteryCache } from './lotteryCache';

// Mapeamento de tipos de loteria internos para os nomes usados na API
const lotteryTypeMapping: Record<LotteryType, string> = {
  megasena: 'megasena',
};

// Nova API da loteria - mais confiável e sem problemas de CORS
export interface LotteryApiResponse {
  numero: number;
  dataApuracao: string;
  dataProximoConcurso: string;
  dezenasSorteadasOrdemSorteio: string[];
  listaDezenas: string[];
  acumulado: boolean;
  valorArrecadado: number;
  valorAcumuladoProximoConcurso: number;
  valorEstimadoProximoConcurso: number;
  local: string;
  listaRateioPremio: {
    descricaoFaixa: string;
    faixa: number;
    numeroDeGanhadores: number;
    valorPremio: number;
  }[];
  listaMunicipioUFGanhadores: unknown[];
  trevosSorteados?: string[] | null;
  timeCoracao?: string | null;
  mesSorte?: string | null;
}

// Nova API base URL - usar proxy em desenvolvimento para evitar CORS
const API_BASE_URL = import.meta.env.DEV 
  ? '/api/lottery'  // Proxy local para desenvolvimento
  : 'https://api.guidi.dev.br/loteria';  // URL direta para produção

/**
 * Converte data da API (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
 */
function convertApiDateToISOFormat(apiDate: string): string {
  try {
    const [day, month, year] = apiDate.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (error) {
    console.warn('Erro ao converter data da API, usando data atual:', error);
    return new Date().toISOString().split('T')[0];
  }
}

// REMOVIDO: Função generateMockLotteryResponse por solicitação do usuário
// Aplicativo de loterias com dinheiro real não deve usar dados fictícios

/**
 * Função auxiliar para fazer requisições com retry e melhor tratamento de erro
 */
async function fetchWithRetry(endpoint: string, maxRetries: number = 2): Promise<LotteryApiResponse> {
  let lastError: Error;
  const url = `${API_BASE_URL}${endpoint}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Tentativa ${attempt + 1}/${maxRetries + 1} para: ${url}${import.meta.env.DEV ? ' (via proxy)' : ' (direto)'}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      clearTimeout(timeoutId);

      console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Detalhes: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Resposta não é JSON válido. Content-Type: ${contentType}`);
      }

      const data: LotteryApiResponse = await response.json();
      console.log('✅ Resposta da API recebida:', { 
        numero: data.numero, 
        dataApuracao: data.dataApuracao,
        dezenas: data.listaDezenas?.length || 0
      });
      
      // Validar estrutura básica da resposta
      if (!data.numero || !data.listaDezenas) {
        throw new Error('Resposta da API incompleta ou inválida');
      }
      
      return data;

    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      lastError = errorObj;
      console.error(`❌ Erro na tentativa ${attempt + 1}:`, {
        message: errorObj.message,
        name: errorObj.name
      });
      
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 3000); // Backoff exponencial limitado a 3s
        console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  const finalError = new Error(`Falha ao conectar com a API após ${maxRetries + 1} tentativas. Último erro: ${lastError.message}`);
  console.error('🚨 Erro final:', finalError.message);
  throw finalError;
}

/**
 * Testa a conectividade com a API
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testando conectividade com a API...');
    
    // Testar endpoint simples primeiro
    const testUrls = [
      'https://api.guidi.dev.br/loteria/megasena/ultimo'
    ];

    for (const url of testUrls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000),
          mode: 'cors'
        });
        
        console.log(`🌐 Teste de conectividade para ${url}: ${response.status}`);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.log(`❌ Teste falhou para ${url}:`, error);
        continue;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Teste de conectividade falhou completamente:', error);
    return false;
  }
}

/**
 * Busca o resultado de uma loteria específica pelo número do concurso (com cache híbrido)
 */
export async function fetchLotteryResult(lotteryType: LotteryType, drawNumber: string): Promise<LotteryApiResponse> {
  const apiLotteryName = lotteryTypeMapping[lotteryType];
  if (!apiLotteryName) {
    throw new Error(`Tipo de loteria não suportado: ${lotteryType}`);
  }
  
  console.log(`🎲 Buscando resultado: ${apiLotteryName} concurso ${drawNumber}`);
  
  // Verificar cache híbrido primeiro
  const cachedResult = await HybridLotteryCache.get(lotteryType, drawNumber);
  if (cachedResult) {
    console.log(`✅ Resultado encontrado no cache: ${lotteryType} ${drawNumber}`);
    return cachedResult.apiResponse;
  }
  
  // Buscar na API externa
  console.log(`🌐 Buscando na API externa: ${lotteryType} ${drawNumber}`);
  const apiResponse = await fetchWithRetry(`/${apiLotteryName}/${drawNumber}`);
  
  console.log('📦 Resposta bruta da API:', {
    numero: apiResponse.numero,
    dataApuracao: apiResponse.dataApuracao,
    dezenasSorteadasOrdemSorteio: apiResponse.dezenasSorteadasOrdemSorteio,
    listaDezenas: apiResponse.listaDezenas,
    acumulado: apiResponse.acumulado
  });
  
  // Salvar no cache híbrido
  const drawDate = convertApiDateToISOFormat(apiResponse.dataApuracao);
  await HybridLotteryCache.set(lotteryType, drawNumber, drawDate, apiResponse);
  
  return apiResponse;
}

/**
 * Busca o último resultado de uma loteria específica (com cache híbrido)
 */
export async function fetchLatestLotteryResult(lotteryType: LotteryType): Promise<LotteryApiResponse> {
  const apiLotteryName = lotteryTypeMapping[lotteryType];
  if (!apiLotteryName) {
    throw new Error(`Tipo de loteria não suportado: ${lotteryType}`);
  }
  
  console.log(`🎯 Buscando último resultado: ${apiLotteryName}`);
  
  try {
    // Buscar na API externa (último resultado pode mudar)
    const apiResponse = await fetchWithRetry(`/${apiLotteryName}/ultimo`);
    
    // Salvar no cache híbrido
    const drawDate = convertApiDateToISOFormat(apiResponse.dataApuracao);
    await HybridLotteryCache.set(lotteryType, apiResponse.numero.toString(), drawDate, apiResponse);
    
    return apiResponse;
    
  } catch (error) {
    console.warn('⚠️ API principal indisponível, tentando API alternativa...', error);
    
    // Tentar API alternativa se a principal falhar
    try {
      const alternativeResult = await fetchFromAlternativeAPI(lotteryType);
      if (alternativeResult) {
        console.log('✅ Sucesso com API alternativa!');
        return alternativeResult;
      }
    } catch (altError) {
      console.warn('⚠️ API alternativa também falhou:', altError);
    }
    
    console.error('🚨 ERRO CRÍTICO: Todas as APIs de loteria falharam! Não é possível fornecer dados precisos.');
    throw new Error('Serviços de loteria indisponíveis. Não é possível fornecer dados precisos neste momento.');
  }
}

/**
 * API alternativa usando JSONP ou outros métodos para contornar CORS
 */
async function fetchFromAlternativeAPI(lotteryType: LotteryType): Promise<LotteryApiResponse | null> {
  try {
    // Implementar aqui outras fontes de dados públicas
    // Por enquanto, retornar null para usar o mock melhorado
    console.log(`🔄 Tentando fonte alternativa para ${lotteryType}...`);
    return null;
  } catch (error) {
    console.error('❌ Erro na API alternativa:', error);
    return null;
  }
}

/**
 * Estima o número do concurso baseado na data do sorteio
 * Esta é uma aproximação baseada na frequência dos sorteios
 */
function estimateContestNumber(lotteryType: LotteryType, targetDate: string): number {
  const target = new Date(targetDate);
  const baseDate = new Date('2025-01-01'); // Data de referência
  const baseMegaSena = 2880; // Concurso de referência para 01/01/2025 (aproximado)
  
  // Mega-Sena: sorteios terças e sábados (2 por semana)
  if (lotteryType === 'megasena') {
    const daysDiff = Math.floor((target.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksDiff = Math.floor(daysDiff / 7);
    return baseMegaSena + (weeksDiff * 2);
  }
  
  // Para outros tipos, usar uma estimativa similar
  return baseMegaSena + Math.floor((target.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 3.5));
}

/**
 * Busca resultado por data, tentando encontrar o concurso mais próximo
 */
export async function fetchLotteryResultByDate(lotteryType: LotteryType, targetDate: string): Promise<LotteryApiResponse> {
  console.log(`📅 Buscando resultado de ${lotteryType} para a data: ${targetDate}`);
  
  try {
    // Primeira tentativa: buscar o último resultado disponível
    console.log('🔍 Buscando último resultado disponível...');
    const latestResult = await fetchLatestLotteryResult(lotteryType);
    
    // Verificar se a data do último resultado é próxima à data solicitada
    const resultDate = latestResult.dataApuracao;
    if (resultDate) {
      const apiDateFormatted = convertApiDateToISOFormat(resultDate);
      const diffDays = Math.abs(new Date(apiDateFormatted).getTime() - new Date(targetDate).getTime()) / (1000 * 60 * 60 * 24);
      
      console.log(`📊 Data do último resultado: ${apiDateFormatted}, Data solicitada: ${targetDate}, Diferença: ${Math.round(diffDays)} dias`);
      
      // Se a diferença for menor que 7 dias, usar o último resultado
      if (diffDays <= 7) {
        return latestResult;
      }
    }
    
    // Segunda tentativa: estimar o número do concurso e buscar alguns concursos próximos
    const estimatedContest = estimateContestNumber(lotteryType, targetDate);
    console.log(`🎯 Tentando buscar concurso estimado: ${estimatedContest}`);
    
    // Tentar alguns concursos ao redor da estimativa
    const contestsToTry = [
      estimatedContest,
      estimatedContest - 1,
      estimatedContest + 1,
      estimatedContest - 2,
      estimatedContest + 2
    ];
    
    for (const contestNumber of contestsToTry) {
      try {
        console.log(`🔍 Tentando concurso ${contestNumber}...`);
        const result = await fetchLotteryResult(lotteryType, contestNumber.toString());
        
        // Verificar se a data está próxima
        if (result.dataApuracao) {
          const contestDate = convertApiDateToISOFormat(result.dataApuracao);
          const diffDays = Math.abs(new Date(contestDate).getTime() - new Date(targetDate).getTime()) / (1000 * 60 * 60 * 24);
          
          if (diffDays <= 7) {
            console.log(`✅ Encontrado concurso ${contestNumber} com data próxima: ${contestDate}`);
            return result;
          }
        }
      } catch (error) {
        console.log(`❌ Concurso ${contestNumber} não encontrado, tentando próximo...`);
        continue;
      }
    }
    
    // Se nenhum concurso próximo foi encontrado, usar o último disponível
    console.log('🔄 Nenhum concurso próximo encontrado, usando último disponível');
    return latestResult;
    
  } catch (error) {
    console.error('🚨 ERRO CRÍTICO: Não foi possível buscar dados do sorteio por data:', error);
    throw new Error(`Serviços de loteria indisponíveis para busca por data. Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
  }
}

/**
 * Converte a resposta da API para o formato usado pela aplicação
 */
export function convertApiResponseToLotteryResult(response: LotteryApiResponse, lotteryType: LotteryType): {
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
  try {
    // Valida campos obrigatórios
    if (!response.numero) {
      throw new Error('Resposta da API incompleta: falta número do concurso');
    }
    
    // Verifica se há números disponíveis em algum dos campos
    const hasNumbers = (response.dezenasSorteadasOrdemSorteio && response.dezenasSorteadasOrdemSorteio.length > 0) ||
                      (response.listaDezenas && response.listaDezenas.length > 0);
    
    if (!hasNumbers) {
      throw new Error('Resposta da API incompleta: não há números do sorteio');
    }
    
    // Calcula o número total de ganhadores da faixa principal
    const mainPrize = response.listaRateioPremio?.find(p => p.faixa === 1);
    const totalWinners = mainPrize ? mainPrize.numeroDeGanhadores : 0;
    
    // Converte as dezenas de string para número
    // Prioriza dezenasSorteadasOrdemSorteio, se disponível, senão usa listaDezenas
    const numbersArray = response.dezenasSorteadasOrdemSorteio?.length > 0 
      ? response.dezenasSorteadasOrdemSorteio 
      : response.listaDezenas;
    
    console.log('🎲 Números da API:', {
      dezenasSorteadasOrdemSorteio: response.dezenasSorteadasOrdemSorteio,
      listaDezenas: response.listaDezenas,
      numerosSelecionados: numbersArray
    });
    
    const numbers = numbersArray.map(num => {
      const parsed = parseInt(num, 10);
      if (isNaN(parsed)) {
        throw new Error(`Número inválido encontrado: ${num}`);
      }
      return parsed;
    }); // Mantém a ordem original (se for dezenasSorteadasOrdemSorteio) ou ordenada (se for listaDezenas)
    
    // Converte o formato de data para o formato usado pela aplicação (YYYY-MM-DD)
    const formattedDate = response.dataApuracao 
      ? convertApiDateToISOFormat(response.dataApuracao)
      : new Date().toISOString().split('T')[0];
    
    // Tipo de loteria passado como parâmetro
    
    // Processa prêmios se disponível
    const prizes = response.listaRateioPremio?.map(prize => ({
      hits: prize.descricaoFaixa || `${prize.faixa} acertos`,
      winners: prize.numeroDeGanhadores || 0,
      prize: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(prize.valorPremio || 0)
    })) || [];
    
    const result = {
      id: response.numero.toString(),
      lotteryType,
      drawNumber: response.numero.toString(),
      drawDate: formattedDate,
      numbers,
      winners: totalWinners,
      accumulated: response.acumulado || false,
      prizes
    };
    
    console.log('✅ Conversão de dados concluída:', {
      concurso: result.drawNumber,
      data: result.drawDate,
      números: result.numbers,
      totalNúmeros: result.numbers.length,
      acumulado: result.accumulated,
      ganhadores: result.winners,
      premios: result.prizes?.length || 0
    });
    
    return result;
    
  } catch (error) {
    console.error('💥 Erro ao converter resposta da API:', error);
    throw new Error(`Erro na conversão dos dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
