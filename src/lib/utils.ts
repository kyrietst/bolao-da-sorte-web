import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Pool, SupabasePool, Participant, SupabaseParticipant, Ticket, SupabaseTicket } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertSupabasePoolToPool = (pool: SupabasePool): Pool => {
  return {
    id: pool.id,
    name: pool.name,
    lotteryType: pool.lottery_type,
    drawDate: pool.draw_date,
    numTickets: pool.num_tickets,
    maxParticipants: pool.max_participants,
    contributionAmount: Number(pool.contribution_amount),
    adminId: pool.admin_id,
    status: pool.status,
    createdAt: pool.created_at,
  };
};

export const convertSupabaseParticipantToParticipant = (participant: SupabaseParticipant): Participant => {
  return {
    id: participant.id,
    userId: participant.user_id,
    poolId: participant.pool_id,
    name: participant.name,
    email: participant.email,
    status: participant.status,
  };
};

export const convertSupabaseTicketToTicket = (ticket: SupabaseTicket): Ticket => {
  return {
    id: ticket.id,
    poolId: ticket.pool_id,
    ticketNumber: ticket.ticket_number,
    numbers: ticket.numbers,
  };
};
