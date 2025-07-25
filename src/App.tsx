
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { PoolDetailProvider } from "@/features/pools/providers/PoolDetailProvider";
import AuthGuard from "@/components/AuthGuard";
import { HybridLotteryCache } from "@/services/lotteryCache";
import { useEffect } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Statistics from "./pages/Statistics";
import Simulator from "./pages/Simulator";
import Generator from "./pages/Generator";
import Betting from "./pages/Betting";
import MyPools from "@/features/pools/pages/MyPools";
import PoolDetail from "@/features/pools/pages/PoolDetail";
import ManagePool from "./pages/ManagePool";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import Auth from "@/features/auth/pages/Auth";
import Profile from "@/features/auth/pages/Profile";

const queryClient = new QueryClient();

const App = () => {
  // Limpar cache periodicamente
  useEffect(() => {
    // Limpar na inicialização
    HybridLotteryCache.cleanup();
    
    // Limpar a cada 6 horas
    const interval = setInterval(() => {
      HybridLotteryCache.cleanup();
    }, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Rotas protegidas */}
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/meus-boloes" element={<AuthGuard><MyPools /></AuthGuard>} />
            <Route path="/boloes/:id" element={<AuthGuard><PoolDetailProvider><PoolDetail /></PoolDetailProvider></AuthGuard>} />
            <Route path="/boloes/:poolId/gerenciar" element={<AuthGuard><ManagePool /></AuthGuard>} />
            <Route path="/estatisticas" element={<AuthGuard><Statistics /></AuthGuard>} />
            <Route path="/simulador" element={<AuthGuard><Simulator /></AuthGuard>} />
            <Route path="/gerador" element={<AuthGuard><Generator /></AuthGuard>} />
            <Route path="/apostas" element={<AuthGuard><Betting /></AuthGuard>} />
            <Route path="/pesquisar-resultados" element={<AuthGuard><SearchResults /></AuthGuard>} />
            <Route path="/perfil" element={<AuthGuard><Profile /></AuthGuard>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
