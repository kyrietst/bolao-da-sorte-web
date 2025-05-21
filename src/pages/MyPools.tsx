
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';
import { Button } from '@/components/ui/button';
import CreatePoolForm from '@/components/pools/CreatePoolForm';
import { Pool, SupabasePool } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const convertSupabasePoolToPool = (pool: SupabasePool): Pool => {
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

export default function MyPools() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPools();
  }, [user]);

  const fetchPools = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar bolões que o usuário é administrador
      const { data: adminPools, error: adminError } = await supabase
        .from('pools')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminError) throw adminError;
      
      // Buscar bolões que o usuário participa
      const { data: participantPools, error: participantError } = await supabase
        .from('participants')
        .select('pool_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      // Se o usuário participa de algum bolão, buscar informações completas desses bolões
      let participantPoolsData: SupabasePool[] = [];
      if (participantPools.length > 0) {
        const participantPoolIds = participantPools.map(p => p.pool_id);
        
        const { data, error } = await supabase
          .from('pools')
          .select('*')
          .in('id', participantPoolIds)
          .not('admin_id', 'eq', user.id); // Exclui bolões que ele é admin (para evitar duplicações)
        
        if (error) throw error;
        participantPoolsData = data || [];
      }

      // Combinar os bolões e converter para o formato Pool
      const allPools = [...(adminPools || []), ...participantPoolsData];
      const formattedPools = allPools.map(convertSupabasePoolToPool);
      
      setPools(formattedPools);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar bolões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meus Bolões</h1>
            <p className="text-muted-foreground">Gerencie seus bolões ativos.</p>
          </div>
          <CreatePoolForm />
        </div>
        
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-10 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pools.length > 0 ? (
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
                {pools.map((pool) => {
                  const lotteryNames: Record<string, string> = {
                    megasena: 'Mega-Sena',
                    lotofacil: 'Lotofácil',
                    quina: 'Quina',
                    lotomania: 'Lotomania',
                    timemania: 'Timemania',
                    duplasena: 'Dupla Sena'
                  };
                  
                  return (
                    <tr key={pool.id} className="border-b border-border hover:bg-muted/20">
                      <td className="py-3 px-4">{pool.name}</td>
                      <td className="py-3 px-4">{lotteryNames[pool.lotteryType] || pool.lotteryType}</td>
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
                  );
                })}
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
              <CreatePoolForm />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
