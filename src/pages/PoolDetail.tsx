
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ParticipantList from '@/components/participants/ParticipantList';
import LotteryTicket from '@/components/lottery/LotteryTicket';
import { Participant, Pool, Ticket, LotteryType } from '@/types';

// Mock data for pool details - will be replaced with Supabase data
const mockPool: Pool = {
  id: '1',
  name: 'Mega da Virada 2025',
  lotteryType: 'megasena',
  drawDate: '2025-12-30',
  numTickets: 3,
  maxParticipants: 40,
  contributionAmount: 12.5,
  adminId: 'admin-id',
  status: 'ativo',
  createdAt: '2023-10-15',
};

// Mock participants
const mockParticipants: Participant[] = [
  {
    id: '1',
    userId: 'user1',
    poolId: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    status: 'confirmado',
  },
  {
    id: '2',
    userId: 'user2',
    poolId: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'confirmado',
  },
  {
    id: '3',
    userId: 'user3',
    poolId: '1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'pago',
  },
  {
    id: '4',
    userId: 'user4',
    poolId: '1',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    status: 'pendente',
  },
];

// Mock tickets
const mockTickets: Ticket[] = [
  {
    id: '1',
    poolId: '1',
    ticketNumber: '1',
    numbers: [4, 8, 15, 16, 23, 42],
  },
  {
    id: '2',
    poolId: '1',
    ticketNumber: '2',
    numbers: [7, 13, 22, 35, 41, 59],
  },
  {
    id: '3',
    poolId: '1',
    ticketNumber: '3',
    numbers: [5, 17, 24, 33, 51, 60],
  },
];

export default function PoolDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('participantes');
  
  // In a real implementation, we'd fetch the pool, participants and tickets based on the ID
  // For now, we'll use the mock data
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{mockPool.name}</h1>
            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Mega-Sena • Sorteio: {new Date(mockPool.drawDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockParticipants.length} / {mockPool.maxParticipants}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contribuição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {mockPool.contributionAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Bilhetes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockTickets.length} / {mockPool.numTickets}</div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="participantes">Participantes</TabsTrigger>
            <TabsTrigger value="bilhetes">Bilhetes</TabsTrigger>
            <TabsTrigger value="premios">Prêmios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="participantes" className="pt-6">
            <Card>
              <CardContent className="p-0">
                <ParticipantList participants={mockParticipants} isAdmin={true} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bilhetes" className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              {mockTickets.map(ticket => (
                <LotteryTicket key={ticket.id} ticket={ticket} type={mockPool.lotteryType as LotteryType} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="premios" className="pt-6">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  Nenhum prêmio registrado para este bolão ainda.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
