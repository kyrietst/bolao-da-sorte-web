
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'participant';
};

export type LotteryType = 
  'megasena' | 
  'lotofacil' | 
  'quina' | 
  'lotomania' | 
  'timemania' | 
  'duplasena';

export type PaymentStatus = 'confirmado' | 'pago' | 'pendente';

export type Pool = {
  id: string;
  name: string;
  lotteryType: LotteryType;
  drawDate: string;
  numTickets: number;
  maxParticipants: number;
  contributionAmount: number;
  adminId: string;
  status: 'ativo' | 'finalizado';
  createdAt: string;
};

export type Participant = {
  id: string;
  userId: string;
  poolId: string;
  name: string;
  email: string;
  status: PaymentStatus;
};

export type Ticket = {
  id: string;
  poolId: string;
  ticketNumber: string;
  numbers: number[];
};

export type LotteryResult = {
  id: string;
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
};

export type Prize = {
  id: string;
  poolId: string;
  totalAmount: number;
  distributionPerParticipant: number;
  distributed: boolean;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type SupabasePool = {
  id: string;
  name: string;
  lottery_type: LotteryType; // Corrigido para usar o tipo LotteryType em vez de string
  draw_date: string;
  num_tickets: number;
  max_participants: number;
  contribution_amount: number;
  admin_id: string;
  status: 'ativo' | 'finalizado';
  created_at: string;
};

export type SupabaseParticipant = {
  id: string;
  user_id: string;
  pool_id: string;
  name: string;
  email: string;
  status: PaymentStatus;
  created_at: string;
};

export type SupabaseTicket = {
  id: string;
  pool_id: string;
  ticket_number: string;
  numbers: number[];
  created_at: string;
};
