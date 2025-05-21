
import MainLayout from '@/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import LotteryResultCard from '@/components/dashboard/LotteryResult';
import { LotteryResult, LotteryType } from '@/types';

// Mock data - will be replaced with Supabase data
const mockResults: LotteryResult[] = [
  {
    id: '1',
    lotteryType: 'megasena' as LotteryType,
    drawNumber: '2650',
    drawDate: '2023-10-28',
    numbers: [4, 18, 29, 37, 39, 53],
    accumulated: true,
  },
  {
    id: '2',
    lotteryType: 'lotofacil' as LotteryType,
    drawNumber: '3000',
    drawDate: '2024-01-10',
    numbers: [1, 2, 3, 4, 5, 10],
    winners: 0,
  },
  {
    id: '3',
    lotteryType: 'quina' as LotteryType,
    drawNumber: '6400',
    drawDate: '2024-03-26',
    numbers: [4, 24, 33, 50, 77],
    accumulated: true,
  },
];

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo(a), adm! Visualize seus bolões ativos.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Total de Bolões"
            value={0}
            description="Bolões que você participa"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-muted-foreground"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            }
          />
          <StatCard
            title="Participações"
            value={0}
            description="Participantes nos seus bolões"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <StatCard
            title="Próximo Sorteio"
            value="Nenhum sorteio"
            description="Data do próximo sorteio"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-muted-foreground"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            }
          />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Últimos Resultados</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {mockResults.map((result) => (
              <LotteryResultCard key={result.id} result={result} />
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Seus Bolões</h2>
          <div className="bg-card border border-border rounded-lg p-10 text-center">
            <div className="mb-4 flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-12 w-12 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Nenhum bolão encontrado</h3>
            <p className="text-muted-foreground mt-1">
              Você ainda não participa de nenhum bolão. Use o link de convite para participar.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
