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

export type LotteryType = 
  'megasena' | 
  'lotofacil' | 
  'quina' | 
  'lotomania' | 
  'timemania' | 
  'duplasena';

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
}

export interface SupabaseParticipant {
  id: ParticipantId;
  user_id: UserId;
  pool_id: PoolId;
  name: string;
  email: string;
  status: PaymentStatus;
  created_at: string;
}

export interface SupabaseTicket {
  id: TicketId;
  pool_id: PoolId;
  ticket_number: string;
  numbers: number[];
  created_at: string;
}
