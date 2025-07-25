// Branded types for type-safe IDs
export type Brand<K, T> = K & { __brand: T };

export type UserId = Brand<string, 'UserId'>;
export type PoolId = Brand<string, 'PoolId'>;
export type ParticipantId = Brand<string, 'ParticipantId'>;
export type TicketId = Brand<string, 'TicketId'>;
export type LotteryResultId = Brand<string, 'LotteryResultId'>;
export type PrizeId = Brand<string, 'PrizeId'>;

export interface User {
  id: UserId;
  name: string;
  email: string;
  role: 'admin' | 'participant';
}

export type LotteryType = 'megasena';

export type CompetitionPeriod = 'mensal' | 'trimestral' | 'semestral' | 'anual';
export type CompetitionStatus = 'ativa' | 'finalizada' | 'pausada' | 'agendada';

export type PaymentStatus = 'confirmado' | 'pago' | 'pendente' | 'ativo';

export interface Pool {
  id: PoolId;
  name: string;
  lotteryType: LotteryType;
  drawDate: string;
  numTickets: number;
  maxParticipants: number;
  contributionAmount: number;
  adminId: UserId;
  status: 'ativo' | 'finalizado';
  createdAt: string;
  hasRanking?: boolean;
  rankingPeriod?: CompetitionPeriod;
}

export interface Participant {
  id: ParticipantId;
  userId: UserId;
  poolId: PoolId;
  name: string;
  email: string;
  status: PaymentStatus;
}

export interface Ticket {
  id: TicketId;
  poolId: PoolId;
  ticketNumber: string;
  numbers: number[];
}

export interface LotteryResult {
  id: LotteryResultId;
  lotteryType: LotteryType;
  drawNumber: string;
  drawDate: string;
  numbers: number[];
  accumulated: boolean;
  winners?: number;
  prizes?: Array<{
    hits: string;
    winners: number;
    prize: string;
  }>;
}

export interface Prize {
  id: PrizeId;
  poolId: PoolId;
  totalAmount: number;
  distributionPerParticipant: number;
  distributed: boolean;
}

export interface Profile {
  id: UserId;
  name: string;
  email: string;
  created_at: string;
}

export interface SupabasePool {
  id: PoolId;
  name: string;
  lottery_type: LotteryType;
  draw_date: string;
  num_tickets: number;
  max_participants: number;
  contribution_amount: number;
  admin_id: UserId;
  status: 'ativo' | 'finalizado';
  created_at: string;
  has_ranking?: boolean;
  ranking_period?: CompetitionPeriod;
}

export interface SupabaseParticipant {
  id: ParticipantId;
  user_id: UserId;
  pool_id: PoolId;
  name: string;
  email: string;
  status: PaymentStatus;
  created_at: string;
  shares_count?: number;
  total_contribution?: number;
  contribution_per_share?: number;
  join_method?: string;
  invited_by?: UserId;
  invitation_token?: string;
  updated_at?: string;
}

export interface SupabaseTicket {
  id: TicketId;
  pool_id: PoolId;
  ticket_number: string;
  numbers: number[];
  created_at: string;
}

// Interfaces para o sistema de ranking
export interface Competition {
  id: string;
  poolId: PoolId;
  name: string;
  description?: string;
  period: CompetitionPeriod;
  startDate: string;
  endDate: string;
  lotteryType: LotteryType;
  status: CompetitionStatus;
  pointsPerHit: number;
  bonusPoints: Record<string, number>;
  createdBy?: UserId;
  createdAt: string;
  updatedAt: string;
}

export interface LotteryDrawResult {
  id: string;
  lotteryType: LotteryType;
  drawNumber: string;
  drawDate: string;
  numbers: number[];
  accumulated: boolean;
  totalWinners: number;
  prizes: Array<{
    hits: string;
    winners: number;
    prize: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantDrawScore {
  id: string;
  participantId: ParticipantId;
  competitionId: string;
  lotteryResultId: string;
  totalHits: number;
  hitBreakdown: Record<string, number>;
  totalGamesPlayed: number;
  pointsEarned: number;
  prizeValue: number;
  prizeTier?: string;
  drawDate: string;
  createdAt: string;
}

export interface CompetitionRanking {
  id: string;
  participantId: ParticipantId;
  competitionId: string;
  totalPoints: number;
  totalHits: number;
  totalGamesPlayed: number;
  totalPrizeValue: number;
  bestHitCount: number;
  drawsParticipated: number;
  averageHitsPerDraw: number;
  consistencyScore: number;
  currentRank: number;
  previousRank: number;
  rankChange: number;
  lastUpdated: string;
}

// Interfaces para exibição de ranking
export interface RankingEntry {
  rank: number;
  participant: Participant;
  totalPoints: number;
  totalHits: number;
  averageHitsPerDraw: number;
  totalPrizeValue: number;
  bestHitCount: number;
  drawsParticipated: number;
  rankChange: number; // +/- mudança de posição
  trend: 'up' | 'down' | 'stable';
}

export interface CompetitionStats {
  totalParticipants: number;
  totalDraws: number;
  totalPrizeDistributed: number;
  averageHitsPerDraw: number;
  topPerformer: RankingEntry | null;
  mostConsistent: RankingEntry | null;
}
