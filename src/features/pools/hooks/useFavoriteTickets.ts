import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { toast } from 'sonner';

export function useFavoriteTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar tickets favoritos do usuário
  const { data: favoriteTickets = [], isLoading } = useQuery({
    queryKey: ['favorite-tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('favorite_tickets')
        .select('ticket_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao buscar favoritos:', error);
        return [];
      }

      return data.map(fav => fav.ticket_id);
    },
    enabled: !!user?.id,
  });

  // Mutation para adicionar aos favoritos
  const addToFavoritesMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('favorite_tickets')
        .insert({
          user_id: user.id,
          ticket_id: ticketId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-tickets'] });
      toast.success('Volante adicionado aos favoritos!');
    },
    onError: (error) => {
      console.error('Erro ao adicionar favorito:', error);
      toast.error('Erro ao adicionar aos favoritos');
    },
  });

  // Mutation para remover dos favoritos
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('favorite_tickets')
        .delete()
        .eq('user_id', user.id)
        .eq('ticket_id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-tickets'] });
      toast.success('Volante removido dos favoritos!');
    },
    onError: (error) => {
      console.error('Erro ao remover favorito:', error);
      toast.error('Erro ao remover dos favoritos');
    },
  });

  // Função para verificar se um ticket é favorito
  const isFavorite = (ticketId: string) => {
    return favoriteTickets.includes(ticketId);
  };

  // Função para toggle favorito
  const toggleFavorite = (ticketId: string) => {
    if (!user?.id) {
      toast.error('Faça login para favoritar volantes');
      return;
    }

    if (isFavorite(ticketId)) {
      removeFromFavoritesMutation.mutate(ticketId);
    } else {
      addToFavoritesMutation.mutate(ticketId);
    }
  };

  return {
    favoriteTickets,
    isLoading,
    isFavorite,
    toggleFavorite,
    isToggling: addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending,
  };
}