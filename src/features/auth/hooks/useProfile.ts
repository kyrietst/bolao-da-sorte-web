import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useAuth } from '../providers/AuthProvider';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Erro ao buscar o perfil:', error);
          setProfile(null);
          return;
        }

        setProfile(data as unknown as Profile);
      } catch (error: unknown) {
        console.error('Ocorreu um erro desconhecido ao buscar o perfil:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile(user.id);
    } else {
      setLoading(false);
      setProfile(null);
    }
  }, [user]);

  return { profile, loading };
};
