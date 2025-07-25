import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Pool, Participant, Ticket, SupabasePool, SupabaseParticipant, SupabaseTicket } from '@/types';
import { convertSupabasePoolToPool, convertSupabaseParticipantToParticipant, convertSupabaseTicketToTicket } from '@/lib/utils';

// Define the shape of the state
interface State {
  pool: Pool | null;
  participants: Participant[];
  tickets: Ticket[];
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

// Define the actions that can be dispatched
type Action = 
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { pool: Pool; participants: Participant[]; tickets: Ticket[]; isAdmin: boolean } }
  | { type: 'FETCH_ERROR'; payload: string };

// The context will provide the state and the dispatch function
interface PoolDetailContextType extends State {
  dispatch: React.Dispatch<Action>;
}

const PoolDetailContext = createContext<PoolDetailContextType | undefined>(undefined);

const initialState: State = {
  pool: null,
  participants: [],
  tickets: [],
  isAdmin: false,
  loading: true,
  error: null,
};

const poolDetailReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...initialState, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        pool: action.payload.pool,
        participants: action.payload.participants,
        tickets: action.payload.tickets,
        isAdmin: action.payload.isAdmin,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export const PoolDetailProvider = ({ children }: { children: ReactNode }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(poolDetailReducer, initialState);

  const fetchPoolDetails = async () => {
    if (!id) return;
    
    dispatch({ type: 'FETCH_START' });
    try {
      // Fetch pool details
      const { data: poolData, error: poolError } = await supabase
        .from('pools')
        .select('*')
        .eq('id', id)
        .single();

      if (poolError) throw new Error('Bolão não encontrado.');
      const convertedPool = convertSupabasePoolToPool(poolData as unknown as SupabasePool);
      const isAdmin = user?.id === convertedPool.adminId;

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('pool_id', id);
      if (participantsError) throw participantsError;
      const convertedParticipants = ((participantsData || []) as unknown as SupabaseParticipant[]).map(p =>
        convertSupabaseParticipantToParticipant(p)
      );

      // Fetch tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('pool_id', id);
      if (ticketsError) throw ticketsError;
      const convertedTickets = ((ticketsData || []) as unknown as SupabaseTicket[]).map(t =>
        convertSupabaseTicketToTicket(t)
      );

      dispatch({ 
        type: 'FETCH_SUCCESS', 
        payload: { 
          pool: convertedPool, 
          participants: convertedParticipants, 
          tickets: convertedTickets, 
          isAdmin 
        }
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
    }
  };

  useEffect(() => {
    fetchPoolDetails();
  }, [id, user]);

  return (
    <PoolDetailContext.Provider value={{ ...state, dispatch, refreshData: fetchPoolDetails }}>
      {children}
    </PoolDetailContext.Provider>
  );
};

export const usePoolDetail = () => {
  const context = useContext(PoolDetailContext);
  if (context === undefined) {
    throw new Error('usePoolDetail must be used within a PoolDetailProvider');
  }
  // We don't expose dispatch to the consuming components, but include refreshData
  const { dispatch, ...stateAndRefresh } = context;
  return stateAndRefresh;
};
