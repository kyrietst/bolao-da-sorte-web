
import { Link } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Pool } from '@/types';

// Mock data - will be replaced with Supabase data
const mockPools: Pool[] = [];

export default function MyPools() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meus Bolões</h1>
            <p className="text-muted-foreground">Gerencie seus bolões ativos.</p>
          </div>
          <Button>
            Criar Novo Bolão
          </Button>
        </div>
        
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {mockPools.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data do Sorteio</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {mockPools.map((pool) => (
                  <tr key={pool.id} className="border-b border-border hover:bg-muted/20">
                    <td className="py-3 px-4">{pool.name}</td>
                    <td className="py-3 px-4">{pool.lotteryType}</td>
                    <td className="py-3 px-4">{new Date(pool.drawDate).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        pool.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pool.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/boloes/${pool.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center">
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
              <p className="text-muted-foreground mt-1 mb-4">
                Você ainda não criou ou participa de nenhum bolão.
              </p>
              <Button>Criar Novo Bolão</Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
