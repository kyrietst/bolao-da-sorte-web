
import { Ticket, LotteryType } from '@/types';
import { LotteryNumbers } from './LotteryNumbers';

interface LotteryTicketProps {
  ticket: Ticket;
  type: LotteryType;
}

export default function LotteryTicket({ ticket, type }: LotteryTicketProps) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4">
      <h4 className="font-medium mb-3">Bilhete #{ticket.ticketNumber}</h4>
      <LotteryNumbers type={type} numbers={ticket.numbers} />
    </div>
  );
}
