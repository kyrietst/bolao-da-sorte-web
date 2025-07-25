import { CheckCircle, Clock, XCircle, Mail, User, MoreVertical, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'confirmed' | 'rejected';
  avatar?: string;
  isAdmin?: boolean;
}

interface ModernParticipantsListProps {
  participants: Participant[];
  isAdmin: boolean;
  onConfirmPayment?: (participantId: string) => void;
  onRejectPayment?: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  loading?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    variant: 'secondary' as const,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30'
  },
  confirmed: {
    label: 'Confirmado',
    icon: CheckCircle,
    variant: 'default' as const,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30'
  },
  rejected: {
    label: 'Rejeitado',
    icon: XCircle,
    variant: 'destructive' as const,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30'
  }
};

export default function ModernParticipantsList({
  participants,
  isAdmin,
  onConfirmPayment,
  onRejectPayment,
  onRemoveParticipant,
  loading = false
}: ModernParticipantsListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <EmptyState
        icon={<User className="h-12 w-12 text-muted-foreground" />}
        title="Nenhum participante"
        description="Este bolão ainda não possui participantes cadastrados."
      />
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Estatísticas Rápidas */}
      <div className="flex gap-4 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = participants.filter(p => p.status === status).length;
          if (!config) return null;
          return (
            <div key={status} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", config.bgColor)}>
              <config.icon className={cn("h-4 w-4", config.color)} />
              <span className="text-sm font-medium">{count} {config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Lista de Participantes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant) => {
          const statusInfo = statusConfig[participant.status];
          if (!statusInfo) return null;
          
          return (
            <Card key={participant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(participant.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {participant.name}
                        </h3>
                        {participant.isAdmin && (
                          <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{participant.email}</span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && !participant.isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {participant.status === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => onConfirmPayment?.(participant.id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar Pagamento
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onRejectPayment?.(participant.id)}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeitar Pagamento
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onRemoveParticipant?.(participant.id)}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Remover Participante
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                    <statusInfo.icon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                  
                  {participant.isAdmin && (
                    <Badge variant="outline" className="text-xs">
                      Organizador
                    </Badge>
                  )}
                </div>

                {/* Ações Rápidas para Admin */}
                {isAdmin && !participant.isAdmin && participant.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => onConfirmPayment?.(participant.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Confirmar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => onRejectPayment?.(participant.id)}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}