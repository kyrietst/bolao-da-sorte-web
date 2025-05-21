
import Sidebar from '@/components/sidebar/Sidebar';
import { ReactNode } from 'react';

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
