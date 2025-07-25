import { supabase } from '@/integrations/supabase/client';
import { LotteryType } from '@/types';
import { LotteryApiResponse } from './lotteryApi';

// Durações de cache em milissegundos
export const CACHE_DURATIONS = {
  // Resultados já realizados (nunca mudam)
  COMPLETED_DRAW: 30 * 24 * 60 * 60 * 1000, // 30 dias
  
  // Resultado mais recente (pode ter updates de premiação)
  LATEST_DRAW: 24 * 60 * 60 * 1000, // 24 horas
  
  // Cache local (acesso rápido)
  LOCAL_CACHE: 2 * 60 * 60 * 1000, // 2 horas
};

// Interface para dados em cache
export interface CachedLotteryResult {
  lotteryType: LotteryType;
  contestNumber: string;
  drawDate: string;
  apiResponse: LotteryApiResponse;
  timestamp: number;
  isCompleted: boolean; // Se o sorteio já aconteceu
}

// Interface para cache local
interface LocalCacheItem {
  data: CachedLotteryResult;
  timestamp: number;
}

/**
 * Gera chave única para identificar um resultado de loteria
 */
function getCacheKey(lotteryType: LotteryType, contestNumber: string): string {
  return `lottery_${lotteryType}_${contestNumber}`;
}

/**
 * Verifica se um item do cache expirou
 */
function isExpired(timestamp: number, duration: number): boolean {
  return Date.now() - timestamp > duration;
}

/**
 * Determina se um sorteio já foi realizado baseado na data
 */
function isDrawCompleted(drawDate: string): boolean {
  const today = new Date();
  const targetDate = new Date(drawDate);
  
  // Normalizar para comparação apenas de data
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  return targetDate.getTime() <= today.getTime();
}

/**
 * CACHE LOCAL (Primeiro Nível - LocalStorage)
 */
export class LocalLotteryCache {
  private static readonly PREFIX = 'lottery_cache_';
  
  /**
   * Busca resultado no cache local
   */
  static get(lotteryType: LotteryType, contestNumber: string): CachedLotteryResult | null {
    try {
      const key = this.PREFIX + getCacheKey(lotteryType, contestNumber);
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        return null;
      }
      
      const item: LocalCacheItem = JSON.parse(cached);
      const duration = item.data.isCompleted ? CACHE_DURATIONS.COMPLETED_DRAW : CACHE_DURATIONS.LOCAL_CACHE;
      
      if (isExpired(item.timestamp, duration)) {
        localStorage.removeItem(key);
        return null;
      }
      
      console.log(`📱 Cache local hit: ${key}`);
      return item.data;
      
    } catch (error) {
      console.error('❌ Erro ao ler cache local:', error);
      return null;
    }
  }
  
  /**
   * Armazena resultado no cache local
   */
  static set(data: CachedLotteryResult): void {
    try {
      const key = this.PREFIX + getCacheKey(data.lotteryType, data.contestNumber);
      const item: LocalCacheItem = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(key, JSON.stringify(item));
      console.log(`💾 Salvo no cache local: ${key}`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar no cache local:', error);
      // Se localStorage estiver cheio, tentar limpar itens antigos
      this.cleanup();
    }
  }
  
  /**
   * Limpa itens expirados do cache local
   */
  static cleanup(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.PREFIX));
      let cleaned = 0;
      
      for (const key of keys) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const item: LocalCacheItem = JSON.parse(cached);
            const duration = item.data.isCompleted ? CACHE_DURATIONS.COMPLETED_DRAW : CACHE_DURATIONS.LOCAL_CACHE;
            
            if (isExpired(item.timestamp, duration)) {
              localStorage.removeItem(key);
              cleaned++;
            }
          }
        } catch {
          // Item corrompido, remover
          localStorage.removeItem(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`🧹 Limpeza do cache local: ${cleaned} itens removidos`);
      }
      
    } catch (error) {
      console.error('❌ Erro na limpeza do cache local:', error);
    }
  }
  
  /**
   * Remove item específico do cache
   */
  static remove(lotteryType: LotteryType, contestNumber: string): void {
    try {
      const key = this.PREFIX + getCacheKey(lotteryType, contestNumber);
      localStorage.removeItem(key);
      console.log(`🗑️ Removido do cache local: ${key}`);
    } catch (error) {
      console.error('❌ Erro ao remover do cache local:', error);
    }
  }
}

/**
 * CACHE SUPABASE (Segundo Nível - Banco de Dados)
 */
export class SupabaseLotteryCache {
  /**
   * Busca resultado no cache do Supabase
   */
  static async get(lotteryType: LotteryType, contestNumber: string): Promise<CachedLotteryResult | null> {
    try {
      console.log(`🔍 Buscando no cache Supabase: ${lotteryType} ${contestNumber}`);
      
      const { data, error } = await supabase
        .from('lottery_results_cache')
        .select('*')
        .eq('lottery_type', lotteryType)
        .eq('draw_number', parseInt(contestNumber, 10))
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Not found é esperado
          console.error('❌ Erro ao buscar cache Supabase:', error);
        }
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      // Verificar se não expirou
      const timestamp = new Date(data.updated_at || data.created_at).getTime();
      const isCompleted = isDrawCompleted(data.draw_date);
      const duration = isCompleted ? CACHE_DURATIONS.COMPLETED_DRAW : CACHE_DURATIONS.LATEST_DRAW;
      
      if (isExpired(timestamp, duration)) {
        console.log(`⏰ Cache Supabase expirado: ${lotteryType} ${contestNumber}`);
        await this.remove(lotteryType, contestNumber);
        return null;
      }
      
      console.log(`🎯 Cache Supabase hit: ${lotteryType} ${contestNumber}`);
      
      return {
        lotteryType,
        contestNumber,
        drawDate: data.draw_date,
        apiResponse: data.response as LotteryApiResponse,
        timestamp,
        isCompleted
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar cache Supabase:', error);
      return null;
    }
  }
  
  /**
   * Sanitiza dados para remover caracteres Unicode problemáticos
   */
  private static sanitizeData(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      // Remove caracteres null e outros caracteres de controle problemáticos
      return obj.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }
    
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return obj.map(item => this.sanitizeData(item));
      } else {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = this.sanitizeData(value);
        }
        return sanitized;
      }
    }
    
    return obj;
  }

  /**
   * Armazena resultado no cache do Supabase
   */
  static async set(data: CachedLotteryResult): Promise<void> {
    try {
      console.log(`💾 Salvando no cache Supabase: ${data.lotteryType} ${data.contestNumber}`);
      
      // Sanitizar dados antes de salvar para evitar erros Unicode
      const sanitizedResponse = this.sanitizeData(data.apiResponse);
      
      const { error } = await supabase
        .from('lottery_results_cache')
        .upsert({
          lottery_type: data.lotteryType,
          draw_number: parseInt(data.contestNumber, 10),
          draw_date: data.drawDate,
          response: sanitizedResponse,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'lottery_type,draw_number'
        });
      
      if (error) {
        console.error('❌ Erro ao salvar cache Supabase:', error);
        console.error('❌ Dados que causaram erro:', {
          lottery_type: data.lotteryType,
          draw_number: data.contestNumber,
          draw_date: data.drawDate,
          error_details: error
        });
        return;
      }
      
      console.log(`✅ Salvo no cache Supabase: ${data.lotteryType} ${data.contestNumber}`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar cache Supabase:', error);
    }
  }
  
  /**
   * Remove item específico do cache
   */
  static async remove(lotteryType: LotteryType, contestNumber: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lottery_results_cache')
        .delete()
        .eq('lottery_type', lotteryType)
        .eq('draw_number', parseInt(contestNumber, 10));
      
      if (error) {
        console.error('❌ Erro ao remover cache Supabase:', error);
        return;
      }
      
      console.log(`🗑️ Removido do cache Supabase: ${lotteryType} ${contestNumber}`);
      
    } catch (error) {
      console.error('❌ Erro ao remover cache Supabase:', error);
    }
  }
  
  /**
   * Limpa itens expirados do cache (pode ser chamado periodicamente)
   */
  static async cleanup(): Promise<void> {
    try {
      console.log('🧹 Iniciando limpeza do cache Supabase...');
      
      // Buscar itens que podem estar expirados
      const { data, error } = await supabase
        .from('lottery_results_cache')
        .select('lottery_type, draw_number, draw_date, updated_at, created_at');
      
      if (error) {
        console.error('❌ Erro ao buscar itens para limpeza:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('✅ Cache Supabase já está limpo');
        return;
      }
      
      const itemsToDelete: Array<{lottery_type: string, draw_number: number}> = [];
      
      for (const item of data) {
        const timestamp = new Date(item.updated_at || item.created_at).getTime();
        const isCompleted = isDrawCompleted(item.draw_date);
        const duration = isCompleted ? CACHE_DURATIONS.COMPLETED_DRAW : CACHE_DURATIONS.LATEST_DRAW;
        
        if (isExpired(timestamp, duration)) {
          itemsToDelete.push({
            lottery_type: item.lottery_type,
            draw_number: item.draw_number
          });
        }
      }
      
      if (itemsToDelete.length > 0) {
        for (const item of itemsToDelete) {
          await this.remove(item.lottery_type as LotteryType, item.draw_number.toString());
        }
        console.log(`🧹 Limpeza do cache Supabase: ${itemsToDelete.length} itens removidos`);
      } else {
        console.log('✅ Nenhum item expirado encontrado no cache Supabase');
      }
      
    } catch (error) {
      console.error('❌ Erro na limpeza do cache Supabase:', error);
    }
  }
}

/**
 * GERENCIADOR DE CACHE HÍBRIDO (Interface Principal)
 */
export class HybridLotteryCache {
  /**
   * Busca resultado usando estratégia em camadas
   */
  static async get(lotteryType: LotteryType, contestNumber: string): Promise<CachedLotteryResult | null> {
    // 1º Nível: Cache Local (mais rápido)
    const localResult = LocalLotteryCache.get(lotteryType, contestNumber);
    if (localResult) {
      return localResult;
    }
    
    // 2º Nível: Cache Supabase (persistente)
    const supabaseResult = await SupabaseLotteryCache.get(lotteryType, contestNumber);
    if (supabaseResult) {
      // Salvar no cache local para próximas consultas
      LocalLotteryCache.set(supabaseResult);
      return supabaseResult;
    }
    
    return null;
  }
  
  /**
   * Armazena resultado em ambas as camadas
   */
  static async set(
    lotteryType: LotteryType,
    contestNumber: string,
    drawDate: string,
    apiResponse: LotteryApiResponse
  ): Promise<void> {
    const cachedResult: CachedLotteryResult = {
      lotteryType,
      contestNumber,
      drawDate,
      apiResponse,
      timestamp: Date.now(),
      isCompleted: isDrawCompleted(drawDate)
    };
    
    // Salvar em ambos os caches
    LocalLotteryCache.set(cachedResult);
    await SupabaseLotteryCache.set(cachedResult);
  }
  
  /**
   * Remove de ambas as camadas
   */
  static async remove(lotteryType: LotteryType, contestNumber: string): Promise<void> {
    LocalLotteryCache.remove(lotteryType, contestNumber);
    await SupabaseLotteryCache.remove(lotteryType, contestNumber);
  }
  
  /**
   * Limpa ambos os caches
   */
  static async cleanup(): Promise<void> {
    LocalLotteryCache.cleanup();
    await SupabaseLotteryCache.cleanup();
  }
}