
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
