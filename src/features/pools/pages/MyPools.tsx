
import { Link } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';
import CreatePoolForm from '@/features/pools/components/CreatePoolForm';
import PoolsList from '@/features/pools/components/PoolsList';
import OrganizedPoolsList from '@/features/pools/components/OrganizedPoolsList';
import ParticipatingPoolsList from '@/features/pools/components/ParticipatingPoolsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useUserPools } from '@/features/pools/hooks/useUserPools';

export default function MyPools() {
  const { user } = useAuth();
  const { organizedPools, participatingPools, loading } = useUserPools(user);

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
        
        <Tabs defaultValue="organized" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organized">
              Bolões que Organizo ({organizedPools?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="participating">
              Bolões que Participo ({participatingPools?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="organized" className="mt-6">
            <OrganizedPoolsList pools={organizedPools} loading={loading} />
          </TabsContent>
          
          <TabsContent value="participating" className="mt-6">
            <ParticipatingPoolsList pools={participatingPools} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
