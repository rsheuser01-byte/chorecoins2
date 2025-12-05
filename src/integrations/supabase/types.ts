export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alpaca_connections: {
        Row: {
          account_id: string | null
          account_number: string | null
          buying_power: number | null
          cash: number | null
          created_at: string
          id: string
          is_active: boolean | null
          last_synced: string | null
          portfolio_value: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          account_number?: string | null
          buying_power?: number | null
          cash?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_synced?: string | null
          portfolio_value?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          account_number?: string | null
          buying_power?: number | null
          cash?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_synced?: string | null
          portfolio_value?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          access_token: string
          account_name: string
          account_type: string
          bank_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          mask: string | null
          plaid_account_id: string
          plaid_item_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_name: string
          account_type: string
          bank_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mask?: string | null
          plaid_account_id: string
          plaid_item_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_name?: string
          account_type?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mask?: string | null
          plaid_account_id?: string
          plaid_item_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chores: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
          value?: number
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      deposit_schedules: {
        Row: {
          amount: number
          bank_account_id: string
          created_at: string | null
          day_of_month: number | null
          day_of_week: number | null
          frequency: string
          id: string
          is_active: boolean | null
          last_deposit_date: string | null
          next_deposit_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_deposit_date?: string | null
          next_deposit_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_deposit_date?: string | null
          next_deposit_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_schedules_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          completed_at: string | null
          created_at: string | null
          deposit_schedule_id: string | null
          description: string
          id: string
          plaid_transaction_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          completed_at?: string | null
          created_at?: string | null
          deposit_schedule_id?: string | null
          description: string
          id?: string
          plaid_transaction_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          completed_at?: string | null
          created_at?: string | null
          deposit_schedule_id?: string | null
          description?: string
          id?: string
          plaid_transaction_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_transactions_deposit_schedule_id_fkey"
            columns: ["deposit_schedule_id"]
            isOneToOne: false
            referencedRelation: "deposit_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          chore_reminders_enabled: boolean | null
          created_at: string | null
          id: string
          push_enabled: boolean | null
          push_subscription: Json | null
          reminder_days: number[] | null
          reminder_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chore_reminders_enabled?: boolean | null
          created_at?: string | null
          id?: string
          push_enabled?: boolean | null
          push_subscription?: Json | null
          reminder_days?: number[] | null
          reminder_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chore_reminders_enabled?: boolean | null
          created_at?: string | null
          id?: string
          push_enabled?: boolean | null
          push_subscription?: Json | null
          reminder_days?: number[] | null
          reminder_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          scheduled_for: string
          sent: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          scheduled_for: string
          sent?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          scheduled_for?: string
          sent?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          available_to_invest: number | null
          created_at: string
          id: string
          last_synced: string | null
          real_bank_balance: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_to_invest?: number | null
          created_at?: string
          id?: string
          last_synced?: string | null
          real_bank_balance?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_to_invest?: number | null
          created_at?: string
          id?: string
          last_synced?: string | null
          real_bank_balance?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
