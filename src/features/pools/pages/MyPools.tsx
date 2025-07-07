
import { Link } from 'react-router-dom';
import MainLayout from '@/layout/MainLayout';
import CreatePoolForm from '@/features/pools/components/CreatePoolForm';
import PoolsList from '@/features/pools/components/PoolsList';



export default function MyPools() {
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
        
        <PoolsList />
      </div>
    </MainLayout>
  );
}
