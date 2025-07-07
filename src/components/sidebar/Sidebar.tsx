
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useProfile } from '@/features/auth/hooks/useProfile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const SidebarLink = ({ to, icon, label, active }: SidebarLinkProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors",
        active && "bg-sidebar-accent font-medium"
      )}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export function Sidebar({ className }: any) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="w-60 bg-sidebar h-screen border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M4.5 22h-2a.5.5 0 0 1-.5-.5v-19a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v19a.5.5 0 0 1-.5.5Z" />
              <path d="M22 11.5v4a1.5 1.5 0 0 1-3 0v-4a1.5 1.5 0 0 1 3 0Z" />
              <path d="M15 11.5v4a1.5 1.5 0 0 1-3 0v-4a1.5 1.5 0 0 1 3 0Z" />
              <path d="M8 11.5v4a1.5 1.5 0 0 1-3 0v-4a1.5 1.5 0 0 1 3 0Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-sidebar-foreground">SortePlay</h1>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-4 space-y-1 px-2">
        <SidebarLink
          to="/dashboard"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          }
          label="Dashboard"
          active={currentPath === "/dashboard"}
        />
        <SidebarLink
          to="/meus-boloes"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 2v20" />
              <path d="M2 5h20" />
              <path d="M14 11h8" />
              <path d="M10 17H2" />
            </svg>
          }
          label="Meus Bolões"
          active={currentPath === "/meus-boloes"}
        />
        <SidebarLink
          to="/pesquisar-resultados"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          }
          label="Pesquisar Resultados"
          active={currentPath === "/pesquisar-resultados"}
        />
      </div>

      <div className="border-t border-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <span className="text-gray-500 font-medium">
                  {profile?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {profile?.name || 'Usuário'}
                </span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <Link to="/perfil">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Meu Perfil
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
