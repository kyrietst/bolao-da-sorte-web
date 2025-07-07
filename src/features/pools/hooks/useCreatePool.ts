import { useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { LotteryType, PoolId } from '@/types';
import { useToast } from '@/components/ui/use-toast';

// State and Action types for the form reducer
interface FormState {
  name: string;
  lotteryType: LotteryType;
  drawDate: string;
  numTickets: number;
  maxParticipants: number;
  contributionAmount: number;
}

type FormAction = 
  | { type: 'UPDATE_FIELD'; field: keyof FormState; value: any }
  | { type: 'RESET_FORM' };

const initialState: FormState = {
  name: '',
  lotteryType: 'megasena',
  drawDate: '',
  numTickets: 1,
  maxParticipants: 10,
  contributionAmount: 10,
};

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
};

export const useCreatePool = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formState, dispatch] = useReducer(formReducer, initialState);

  const handleFieldChange = (field: keyof FormState, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const createPool = async () => {
    if (!user) {
      toast({
        title: "Erro ao criar bolão",
        description: "Você precisa estar logado para criar um bolão.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const formattedDate = new Date(formState.drawDate).toISOString();

      const { data, error } = await supabase
        .from('pools')
        .insert([
          {
            name: formState.name,
            lottery_type: formState.lotteryType,
            draw_date: formattedDate,
            num_tickets: formState.numTickets,
            max_participants: formState.maxParticipants,
            contribution_amount: formState.contributionAmount,
            admin_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // 2. Inserir o admin como participante automático do bolão
      const { error: participantError } = await supabase.from('participants').insert([
        {
          user_id: user.id,
          pool_id: data.id as PoolId,
          name: user.user_metadata?.name || 'Admin',
          email: user.email,
          status: 'confirmado'
        }
      ]);

      if (participantError) throw participantError;

      // 3. Apenas se tudo deu certo, mostrar o sucesso e navegar
      toast({
        title: "Bolão criado com sucesso!",
        description: `Seu bolão "${formState.name}" foi criado.`,
      });

      dispatch({ type: 'RESET_FORM' });
      navigate(`/boloes/${data.id}`);
      return data.id;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast({
        title: "Erro ao criar bolão",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, formState, handleFieldChange, createPool, dispatch };
};
