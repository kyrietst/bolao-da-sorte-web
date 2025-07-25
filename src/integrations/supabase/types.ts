export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      favorite_tickets: {
        Row: {
          created_at: string | null
          id: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_tickets_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_games: {
        Row: {
          created_at: string | null
          expires_at: string | null
          generated_combinations: number[] | null
          id: string
          numbers_per_game: number
          selected_numbers: number[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          generated_combinations?: number[] | null
          id?: string
          numbers_per_game?: number
          selected_numbers?: number[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          generated_combinations?: number[] | null
          id?: string
          numbers_per_game?: number
          selected_numbers?: number[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      lottery_results: {
        Row: {
          created_at: string
          draw_date: string
          draw_number: number
          id: string
          lottery_type: string
          numbers: number[]
          prize_values: Json | null
        }
        Insert: {
          created_at?: string
          draw_date: string
          draw_number: number
          id?: string
          lottery_type: string
          numbers: number[]
          prize_values?: Json | null
        }
        Update: {
          created_at?: string
          draw_date?: string
          draw_number?: number
          id?: string
          lottery_type?: string
          numbers?: number[]
          prize_values?: Json | null
        }
        Relationships: []
      }
      lottery_results_cache: {
        Row: {
          created_at: string | null
          draw_date: string
          draw_number: number
          id: string
          lottery_type: string
          response: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          draw_date: string
          draw_number: number
          id?: string
          lottery_type: string
          response: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          draw_date?: string
          draw_number?: number
          id?: string
          lottery_type?: string
          response?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          pool_id: string | null
          status: string
          user_id: string | null
          shares_count: number | null
          total_contribution: number | null
          contribution_per_share: number | null
          join_method: string | null
          invited_by: string | null
          invitation_token: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          pool_id?: string | null
          status?: string
          user_id?: string | null
          shares_count?: number | null
          total_contribution?: number | null
          contribution_per_share?: number | null
          join_method?: string | null
          invited_by?: string | null
          invitation_token?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          pool_id?: string | null
          status?: string
          user_id?: string | null
          shares_count?: number | null
          total_contribution?: number | null
          contribution_per_share?: number | null
          join_method?: string | null
          invited_by?: string | null
          invitation_token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "extended_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          features: Json
          id: string
          interval: string
          name: string
          price: number
          stripe_price_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval: string
          name: string
          price: number
          stripe_price_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          name?: string
          price?: number
          stripe_price_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pools: {
        Row: {
          admin_id: string
          contribution_amount: number
          created_at: string
          draw_date: string
          id: string
          lottery_type: string
          max_participants: number
          name: string
          num_tickets: number
          status: string
          status_history: Json | null
          status_changed_at: string | null
          status_changed_by: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          contribution_amount: number
          created_at?: string
          draw_date: string
          id?: string
          lottery_type: string
          max_participants: number
          name: string
          num_tickets?: number
          status?: string
          status_history?: Json | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          contribution_amount?: number
          created_at?: string
          draw_date?: string
          id?: string
          lottery_type?: string
          max_participants?: number
          name?: string
          num_tickets?: number
          status?: string
          status_history?: Json | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          stripe_customer_id: string | null
          subscription_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_results: {
        Row: {
          created_at: string
          draw_number: number
          hits: number
          id: string
          matched_numbers: number[] | null
          prize_value: number | null
          ticket_id: string | null
        }
        Insert: {
          created_at?: string
          draw_number: number
          hits: number
          id?: string
          matched_numbers?: number[] | null
          prize_value?: number | null
          ticket_id?: string | null
        }
        Update: {
          created_at?: string
          draw_number?: number
          hits?: number
          id?: string
          matched_numbers?: number[] | null
          prize_value?: number | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_results_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_draw_scores: {
        Row: {
          id: string
          participant_id: string
          competition_id: string | null
          lottery_result_id: string | null
          total_hits: number
          hit_breakdown: Json | null
          total_games_played: number
          points_earned: number
          prize_value: number
          prize_tier: string | null
          draw_date: string
          created_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          competition_id?: string | null
          lottery_result_id?: string | null
          total_hits: number
          hit_breakdown?: Json | null
          total_games_played: number
          points_earned: number
          prize_value: number
          prize_tier?: string | null
          draw_date: string
          created_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          competition_id?: string | null
          lottery_result_id?: string | null
          total_hits?: number
          hit_breakdown?: Json | null
          total_games_played?: number
          points_earned?: number
          prize_value?: number
          prize_tier?: string | null
          draw_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_draw_scores_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          }
        ]
      }
      competitions: {
        Row: {
          id: string
          pool_id: string
          name: string
          period: string
          start_date: string
          end_date: string
          lottery_type: string
          status: string
          points_per_hit: number
          bonus_points: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          pool_id: string
          name: string
          period: string
          start_date: string
          end_date: string
          lottery_type: string
          status?: string
          points_per_hit: number
          bonus_points?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          pool_id?: string
          name?: string
          period?: string
          start_date?: string
          end_date?: string
          lottery_type?: string
          status?: string
          points_per_hit?: number
          bonus_points?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          }
        ]
      }
      competition_rankings: {
        Row: {
          id: string
          participant_id: string
          competition_id: string
          total_points: number
          total_hits: number
          total_games_played: number
          total_prize_value: number
          current_rank: number
          rank_change: number | null
          average_hits_per_draw: number
          last_updated: string
        }
        Insert: {
          id?: string
          participant_id: string
          competition_id: string
          total_points: number
          total_hits: number
          total_games_played: number
          total_prize_value: number
          current_rank: number
          rank_change?: number | null
          average_hits_per_draw: number
          last_updated?: string
        }
        Update: {
          id?: string
          participant_id?: string
          competition_id?: string
          total_points?: number
          total_hits?: number
          total_games_played?: number
          total_prize_value?: number
          current_rank?: number
          rank_change?: number | null
          average_hits_per_draw?: number
          last_updated?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_rankings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_rankings_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          }
        ]
      }
      tickets: {
        Row: {
          created_at: string
          id: string
          numbers: number[]
          pool_id: string | null
          ticket_number: string
        }
        Insert: {
          created_at?: string
          id?: string
          numbers: number[]
          pool_id?: string | null
          ticket_number: string
        }
        Update: {
          created_at?: string
          id?: string
          numbers?: number[]
          pool_id?: string | null
          ticket_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "extended_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lottery_preferences: {
        Row: {
          created_at: string
          id: string
          lottery_types: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lottery_types?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lottery_types?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      extended_pools: {
        Row: {
          admin_email: string | null
          admin_id: string | null
          admin_name: string | null
          admin_profile_id: string | null
          contribution_amount: number | null
          created_at: string | null
          draw_date: string | null
          id: string | null
          lottery_type: string | null
          max_participants: number | null
          name: string | null
          num_tickets: number | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_feature_access: {
        Args: { p_user_id: string; p_feature: string }
        Returns: boolean
      }
      check_plan_limits: {
        Args: { p_user_id: string; p_action: string; p_pool_id?: string }
        Returns: boolean
      }
      check_ticket_results: {
        Args: { p_ticket_id: string; p_draw_number: number }
        Returns: {
          id: string
          ticket_number: string
          numbers: number[]
          winning_numbers: number[]
          matched_numbers: number[]
          hits: number
          prize: number
        }[]
      }
      cleanup_expired_games: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_plan: {
        Args: { user_id: string }
        Returns: Json
      }
      schedule_subscription_end: {
        Args: { p_user_id: string; p_cancel_at: string }
        Returns: undefined
      }
    }
    Enums: {
      plan_type: "free" | "basic" | "premium" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plan_type: ["free", "basic", "premium", "enterprise"],
    },
  },
} as const
