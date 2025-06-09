
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

// Tipo para a resposta da API - corrigido conforme documentação real
export interface LotteryApiResponse {
  loteria: string;
  concurso: number;
  data: string;
  local: string;
  dezenasOrdemSorteio: string[];
  dezenas: string[];
  trevos?: string[];
  timeCoracao?: string | null;
  mesSorte?: string | null;
  premiacoes: {
    descricao: string;
    faixa: number;
    ganhadores: number;
    valorPremio: number;
  }[];
  estadosPremiados: any[];
  observacao: string;
  acumulou: boolean;
  proximoConcurso: number;
  dataProximoConcurso: string;
  localGanhadores: {
    ganhadores: number;
    municipio: string;
    nomeFatansiaUL: string;
    serie: string;
    posicao: number;
    uf: string;
  }[];
  valorArrecadado: number;
  valorAcumuladoConcurso_0_5: number;
  valorAcumuladoConcursoEspecial: number;
  valorAcumuladoProximoConcurso: number;
  valorEstimadoProximoConcurso: number;
}

// URL correta da API conforme documentação
const API_BASE_URL = 'https://loteriascaixa-api.herokuapp.com/api';

/**
 * Função auxiliar para fazer requisições com retry e melhor tratamento de erro
 */
async function fetchWithRetry(endpoint: string, maxRetries: number = 3): Promise<LotteryApiResponse> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Tentativa ${attempt + 1}/${maxRetries + 1} para: ${API_BASE_URL}${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'User-Agent': 'LotoBolao/1.0',
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
        loteria: data.loteria, 
        concurso: data.concurso, 
        data: data.data,
        dezenas: data.dezenas?.length || 0
      });
      
      // Validar estrutura básica da resposta
      if (!data.loteria || !data.concurso || !data.dezenas) {
        throw new Error('Resposta da API incompleta ou inválida');
      }
      
      return data;

    } catch (error: any) {
      lastError = error;
      console.error(`❌ Erro na tentativa ${attempt + 1}:`, {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200)
      });
      
      // Se for erro de abort (timeout), não vale a pena tentar novamente
      if (error.name === 'AbortError') {
        console.log('⏰ Timeout detectado, não tentando novamente');
        break;
      }
      
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000); // Backoff exponencial limitado a 5s
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
    const response = await fetch(API_BASE_URL.replace('/api', ''), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`🌐 Teste de conectividade: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error('❌ Teste de conectividade falhou:', error);
    return false;
  }
}

/**
 * Busca o resultado de uma loteria específica pelo número do concurso
 */
export async function fetchLotteryResult(lotteryType: LotteryType, drawNumber: string): Promise<LotteryApiResponse> {
  const apiLotteryName = lotteryTypeMapping[lotteryType];
  if (!apiLotteryName) {
    throw new Error(`Tipo de loteria não suportado: ${lotteryType}`);
  }
  
  console.log(`🎲 Buscando resultado: ${apiLotteryName} concurso ${drawNumber}`);
  return await fetchWithRetry(`/${apiLotteryName}/${drawNumber}`);
}

/**
 * Busca o último resultado de uma loteria específica
 */
export async function fetchLatestLotteryResult(lotteryType: LotteryType): Promise<LotteryApiResponse> {
  const apiLotteryName = lotteryTypeMapping[lotteryType];
  if (!apiLotteryName) {
    throw new Error(`Tipo de loteria não suportado: ${lotteryType}`);
  }
  
  console.log(`🎯 Buscando último resultado: ${apiLotteryName}`);
  return await fetchWithRetry(`/${apiLotteryName}/latest`);
}

/**
 * Busca resultado por data (usa o último disponível se não encontrar a data específica)
 */
export async function fetchLotteryResultByDate(lotteryType: LotteryType, targetDate: string): Promise<LotteryApiResponse> {
  console.log(`📅 Buscando resultado de ${lotteryType} para a data: ${targetDate}`);
  
  try {
    // Busca o último resultado disponível
    console.log('🔍 Buscando último resultado disponível...');
    const latestResult = await fetchLatestLotteryResult(lotteryType);
    
    // Converte a data da API (DD/MM/YYYY) para comparação com a data alvo (YYYY-MM-DD)
    const resultDate = latestResult.data;
    if (!resultDate) {
      throw new Error('Data do resultado não disponível na resposta da API');
    }
    
    const [day, month, year] = resultDate.split('/');
    if (!day || !month || !year) {
      throw new Error(`Formato de data inválido na resposta da API: ${resultDate}`);
    }
    
    const apiDateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    console.log(`📊 Data do último resultado: ${apiDateFormatted}, Data solicitada: ${targetDate}`);
    
    return latestResult;
    
  } catch (error) {
    console.error('💥 Erro ao buscar resultado:', error);
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
  try {
    // Valida campos obrigatórios
    if (!response.concurso || !response.dezenas || !Array.isArray(response.dezenas)) {
      throw new Error('Resposta da API incompleta: faltam campos obrigatórios');
    }
    
    // Calcula o número total de ganhadores da faixa principal
    const mainPrize = response.premiacoes?.find(p => p.faixa === 1);
    const totalWinners = mainPrize ? mainPrize.ganhadores : 0;
    
    // Converte as dezenas de string para número
    const numbers = response.dezenas.map(num => {
      const parsed = parseInt(num, 10);
      if (isNaN(parsed)) {
        throw new Error(`Número inválido encontrado: ${num}`);
      }
      return parsed;
    });
    
    // Converte o formato de data para o formato usado pela aplicação (YYYY-MM-DD)
    let formattedDate = '';
    if (response.data) {
      try {
        const dateParts = response.data.split('/');
        if (dateParts.length === 3) {
          const [day, month, year] = dateParts;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          throw new Error(`Formato de data inválido: ${response.data}`);
        }
      } catch (dateError) {
        console.warn('Erro ao converter data, usando data atual:', dateError);
        formattedDate = new Date().toISOString().split('T')[0];
      }
    } else {
      formattedDate = new Date().toISOString().split('T')[0];
    }
    
    // Determina o tipo de loteria baseado no nome da API
    const lotteryType = Object.entries(lotteryTypeMapping)
      .find(([_, apiName]) => apiName === response.loteria)?.[0] as LotteryType || 'megasena';
    
    // Processa prêmios se disponível
    const prizes = response.premiacoes?.map(prize => ({
      hits: prize.descricao || `${prize.faixa} acertos`,
      winners: prize.ganhadores || 0,
      prize: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(prize.valorPremio || 0)
    })) || [];
    
    const result = {
      id: response.concurso.toString(),
      lotteryType,
      drawNumber: response.concurso.toString(),
      drawDate: formattedDate,
      numbers,
      winners: totalWinners,
      accumulated: response.acumulou || false,
      prizes
    };
    
    console.log('✅ Conversão de dados concluída:', {
      concurso: result.drawNumber,
      data: result.drawDate,
      números: result.numbers.length,
      premios: result.prizes?.length || 0
    });
    
    return result;
    
  } catch (error) {
    console.error('💥 Erro ao converter resposta da API:', error);
    throw new Error(`Erro na conversão dos dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
