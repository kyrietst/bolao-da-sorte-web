
import { useState } from 'react';
import MainLayout from '@/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ParticipantList from '@/components/participants/ParticipantList';
import TicketGamesDisplay from '@/components/lottery/TicketGamesDisplay';
import PoolResults from '@/components/pool/PoolResults';
import { LotteryType } from '@/types';
import { usePoolDetail } from '@/features/pools/providers/PoolDetailProvider';
import { Loader2 } from 'lucide-react';

export default function PoolDetail() {
  const { pool, participants, tickets, isAdmin, loading, error } = usePoolDetail();
  const [activeTab, setActiveTab] = useState('participantes');

  if (loading) {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error || !pool) {
    return (
      <MainLayout>
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold">Bolão não encontrado</h2>
          <p className="text-muted-foreground mt-2">O bolão solicitado não existe ou você não tem acesso a ele.</p>
        </div>
      </MainLayout>
    );
  }

  const lotteryNames: Record<string, string> = {
    megasena: 'Mega-Sena',
    lotofacil: 'Lotofácil',
    quina: 'Quina',
    lotomania: 'Lotomania',
    timemania: 'Timemania',
    duplasena: 'Dupla Sena'
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{pool.name}</h1>
            <Badge variant="outline" className={pool.status === 'ativo' ? 
              "bg-green-100 text-green-800 hover:bg-green-100" : 
              "bg-gray-100 text-gray-800 hover:bg-gray-100"
            }>
              {pool.status === 'ativo' ? 'Ativo' : 'Finalizado'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {lotteryNames[pool.lotteryType] || pool.lotteryType} • Sorteio: {new Date(pool.drawDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants.length} / {pool.maxParticipants}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contribuição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {pool.contributionAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Bilhetes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length} / {pool.numTickets}</div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="participantes">Participantes</TabsTrigger>
            <TabsTrigger value="bilhetes">Bilhetes</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
            <TabsTrigger value="premios">Prêmios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="participantes" className="pt-6">
            <Card>
              <CardContent className="p-0">
                <ParticipantList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bilhetes" className="pt-6">
            {tickets.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {tickets.map(ticket => (
                  <TicketGamesDisplay 
                    key={ticket.id} 
                    ticket={ticket} 
                    gamesPerTicket={10}
                    numbersPerGame={6}
                    showResults={true}
                    drawNumber="3213"
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Nenhum bilhete registrado para este bolão ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="resultados" className="pt-6">
            <PoolResults />
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
