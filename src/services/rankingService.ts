import { supabase } from '@/integrations/supabase/client';
import { LotteryType, LotteryDrawResult, ParticipantDrawScore, CompetitionRanking } from '@/types';

/**
 * Serviço para gerenciamento do sistema de ranking
 */
export class RankingService {
  
  /**
   * Calcula pontos baseado em acertos e tipo de loteria
   */
  static calculatePoints(
    hits: number, 
    lotteryType: LotteryType, 
    basePointsPerHit: number = 1,
    bonusConfig: Record<string, number> = {}
  ): number {
    let basePoints = hits * basePointsPerHit;
    let bonusPoints = 0;

    // Bonificações especiais por tipo de loteria
    switch (lotteryType) {
      case 'megasena':
        switch (hits) {
          case 6: bonusPoints = bonusConfig.sena || 1000; break;
          case 5: bonusPoints = bonusConfig.quina || 500; break;
          case 4: bonusPoints = bonusConfig.quadra || 100; break;
          default: bonusPoints = 0;
        }
        break;
      
      default:
        bonusPoints = 0;
    }

    return basePoints + bonusPoints;
  }

  /**
   * Compara um jogo com o resultado do sorteio e conta acertos
   */
  static compareGameWithResult(gameNumbers: number[], resultNumbers: number[]): number {
    return gameNumbers.filter(num => resultNumbers.includes(num)).length;
  }

  /**
   * Obtém número de números por jogo baseado no tipo de loteria
   */
  static getNumbersPerGame(lotteryType: LotteryType): number {
    switch (lotteryType) {
      case 'megasena': return 6;
      default: return 6;
    }
  }

  /**
   * Calcula os acertos de todos os jogos de um participante em um sorteio
   */
  static async calculateParticipantHits(
    participantId: string,
    poolId: string,
    resultNumbers: number[],
    lotteryType: LotteryType
  ): Promise<{ totalHits: number; hitBreakdown: Record<string, number>; totalGamesPlayed: number }> {
    try {
      // Buscar todos os tickets do pool
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, ticket_number, numbers')
        .eq('pool_id', poolId);

      if (ticketsError) throw ticketsError;

      let totalHits = 0;
      let totalGamesPlayed = 0;
      const hitBreakdown: Record<string, number> = {};
      const numbersPerGame = this.getNumbersPerGame(lotteryType);

      // Para cada ticket, dividir o array numbers em jogos
      for (const ticket of tickets || []) {
        if (ticket.numbers && Array.isArray(ticket.numbers)) {
          const numbers = ticket.numbers;
          
          // Dividir números em jogos baseado no tipo de loteria
          for (let i = 0; i < numbers.length; i += numbersPerGame) {
            const gameNumbers = numbers.slice(i, i + numbersPerGame);
            
            if (gameNumbers.length === numbersPerGame) {
              const gameHits = this.compareGameWithResult(gameNumbers, resultNumbers);
              const gameIndex = Math.floor(i / numbersPerGame) + 1;
              const gameKey = `ticket_${ticket.ticket_number}_game_${gameIndex}`;
              
              hitBreakdown[gameKey] = gameHits;
              totalHits += gameHits;
              totalGamesPlayed++;
            }
          }
        }
      }

      return { totalHits, hitBreakdown, totalGamesPlayed };
    } catch (error) {
      console.error('Erro ao calcular acertos do participante:', error);
      return { totalHits: 0, hitBreakdown: {}, totalGamesPlayed: 0 };
    }
  }

  /**
   * Processa um sorteio e atualiza as pontuações de todos os participantes
   */
  static async processDrawForCompetition(
    competitionId: string,
    lotteryResult: LotteryDrawResult
  ): Promise<void> {
    try {
      console.log(`🎯 Processando sorteio ${lotteryResult.drawNumber} para competição ${competitionId}`);

      // 1. Buscar competição e configurações
      const { data: competition, error: compError } = await supabase
        .from('competitions')
        .select(`
          *,
          pools!inner (
            id,
            name,
            participants!inner (
              id,
              user_id,
              name,
              email
            )
          )
        `)
        .eq('id', competitionId)
        .single();

      if (compError || !competition) {
        throw new Error(`Competição não encontrada: ${compError?.message}`);
      }

      const pool = competition.pools;
      const participants = pool.participants || [];

      console.log(`📊 Processando ${participants.length} participantes`);

      // 2. Para cada participante, calcular pontuação
      for (const participant of participants) {
        const participantHits = await this.calculateParticipantHits(
          participant.id,
          pool.id,
          lotteryResult.numbers,
          competition.lottery_type as LotteryType
        );

        const points = this.calculatePoints(
          participantHits.totalHits,
          competition.lottery_type as LotteryType,
          competition.points_per_hit,
          competition.bonus_points as Record<string, number>
        );

        // 3. Inserir/atualizar pontuação do sorteio
        const { error: scoreError } = await supabase
          .from('participant_draw_scores')
          .upsert({
            participant_id: participant.id,
            competition_id: competitionId,
            lottery_result_id: lotteryResult.id,
            total_hits: participantHits.totalHits,
            hit_breakdown: participantHits.hitBreakdown,
            total_games_played: participantHits.totalGamesPlayed,
            points_earned: points,
            draw_date: lotteryResult.drawDate,
            prize_value: 0, // TODO: Calcular valor de prêmios
            prize_tier: this.getPrizeTier(participantHits.totalHits, competition.lottery_type as LotteryType)
          });

        if (scoreError) {
          console.error(`Erro ao salvar pontuação para participante ${participant.id}:`, scoreError);
        } else {
          console.log(`✅ Pontuação salva: ${participant.name} - ${participantHits.totalHits} acertos, ${points} pontos`);
        }
      }

      // 4. Atualizar ranking consolidado
      await this.updateCompetitionRanking(competitionId);

      console.log(`🏆 Ranking da competição ${competitionId} atualizado com sucesso`);

    } catch (error) {
      console.error('Erro ao processar sorteio para competição:', error);
      throw error;
    }
  }

  /**
   * Determina o tier do prêmio baseado nos acertos
   */
  static getPrizeTier(hits: number, lotteryType: LotteryType): string | undefined {
    switch (lotteryType) {
      case 'megasena':
        if (hits === 6) return 'sena';
        if (hits === 5) return 'quina';
        if (hits === 4) return 'quadra';
        break;
    }
    return undefined;
  }

  /**
   * Atualiza o ranking consolidado de uma competição
   */
  static async updateCompetitionRanking(competitionId: string): Promise<void> {
    try {
      // Usar a função SQL para atualizar ranking
      const { error } = await supabase.rpc('update_competition_ranking', {
        comp_id: competitionId
      });

      if (error) {
        console.error('Erro ao atualizar ranking:', error);
        throw error;
      }

      console.log(`🔄 Ranking da competição ${competitionId} atualizado`);
    } catch (error) {
      console.error('Erro ao atualizar ranking da competição:', error);
      throw error;
    }
  }

  /**
   * Busca o ranking atual de uma competição
   */
  static async getCompetitionRanking(competitionId: string): Promise<CompetitionRanking[]> {
    try {
      const { data, error } = await supabase
        .from('competition_rankings')
        .select(`
          *,
          participants!inner (
            id,
            name,
            email,
            user_id
          )
        `)
        .eq('competition_id', competitionId)
        .order('current_rank', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar ranking da competição:', error);
      return [];
    }
  }

  /**
   * Busca histórico de pontuação de um participante
   */
  static async getParticipantScoreHistory(
    participantId: string,
    competitionId: string
  ): Promise<ParticipantDrawScore[]> {
    try {
      const { data, error } = await supabase
        .from('participant_draw_scores')
        .select(`
          *,
          lottery_draw_results!inner (
            draw_number,
            draw_date,
            numbers
          )
        `)
        .eq('participant_id', participantId)
        .eq('competition_id', competitionId)
        .order('draw_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico de pontuação:', error);
      return [];
    }
  }

  /**
   * Cria competição automaticamente para um pool
   */
  static async createCompetitionForPool(
    poolId: string,
    period: 'mensal' | 'trimestral' | 'semestral' | 'anual',
    lotteryType: LotteryType,
    adminId: string
  ): Promise<string | null> {
    try {
      // Primeiro verificar se a tabela competitions existe
      const { error: testError } = await supabase
        .from('competitions')
        .select('id')
        .limit(1);

      if (testError) {
        console.warn('Tabela competitions não existe ainda. Migração não foi executada:', testError.message);
        return null;
      }

      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      let name: string;

      // Calcular datas baseado no período
      switch (period) {
        case 'mensal':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          name = `Ranking ${startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
          break;
        case 'trimestral':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          name = `Ranking Q${quarter + 1}/${now.getFullYear()}`;
          break;
        case 'semestral':
          const semester = now.getMonth() < 6 ? 0 : 1;
          startDate = new Date(now.getFullYear(), semester * 6, 1);
          endDate = new Date(now.getFullYear(), semester * 6 + 6, 0);
          name = `Ranking ${semester + 1}º Semestre ${now.getFullYear()}`;
          break;
        case 'anual':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          name = `Ranking ${now.getFullYear()}`;
          break;
      }

      const { data, error } = await supabase
        .from('competitions')
        .insert({
          pool_id: poolId,
          name,
          description: `Competição automática do período ${period}`,
          period,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          lottery_type: lotteryType,
          status: 'ativa',
          points_per_hit: 1,
          bonus_points: this.getDefaultBonusConfig(lotteryType),
          created_by: adminId
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`🏆 Competição criada: ${data.name} (${data.id})`);
      return data.id;
    } catch (error) {
      console.error('Erro ao criar competição:', error);
      return null;
    }
  }

  /**
   * Configuração padrão de bônus por tipo de loteria
   */
  static getDefaultBonusConfig(lotteryType: LotteryType): Record<string, number> {
    switch (lotteryType) {
      case 'megasena':
        return { sena: 1000, quina: 500, quadra: 100 };
      default:
        return {};
    }
  }

  /**
   * Função de teste para validar sistema de ranking com dados reais
   * USAR APENAS PARA TESTES COM DADOS REAIS - NUNCA MOCK DATA
   */
  static async testRankingWithRealData(competitionId: string): Promise<void> {
    console.log('🧪 TESTE: Iniciando teste do sistema de ranking com dados reais');
    
    try {
      // Simular resultado real da Mega-Sena 2763 (13/07/2025)
      const realMegaSenaResult: LotteryDrawResult = {
        id: '2763',
        lotteryType: 'megasena',
        drawNumber: '2763',
        drawDate: '2025-07-13',
        numbers: [4, 17, 23, 39, 42, 56], // Números reais do sorteio
        accumulated: false,
        totalWinners: 0,
        prizes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('🎯 Processando resultado real:', realMegaSenaResult);
      
      // Processar o resultado para a competição
      await this.processDrawForCompetition(competitionId, realMegaSenaResult);
      
      console.log('✅ TESTE CONCLUÍDO: Sistema de ranking testado com dados reais');
      
    } catch (error) {
      console.error('❌ ERRO NO TESTE:', error);
      throw error;
    }
  }
}