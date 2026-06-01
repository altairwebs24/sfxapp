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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          app_name: string
          app_short_name: string
          auth_wallpaper_url: string | null
          ea_logo_url: string | null
          ea_name: string
          feature_icons: Json
          id: number
          theme_accent: string
          updated_at: string
        }
        Insert: {
          app_name?: string
          app_short_name?: string
          auth_wallpaper_url?: string | null
          ea_logo_url?: string | null
          ea_name?: string
          feature_icons?: Json
          id?: number
          theme_accent?: string
          updated_at?: string
        }
        Update: {
          app_name?: string
          app_short_name?: string
          auth_wallpaper_url?: string | null
          ea_logo_url?: string | null
          ea_name?: string
          feature_icons?: Json
          id?: number
          theme_accent?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_lessons: {
        Row: {
          body_md: string
          created_at: string
          id: string
          order_index: number
          slug: string
          title: string
        }
        Insert: {
          body_md: string
          created_at?: string
          id?: string
          order_index?: number
          slug: string
          title: string
        }
        Update: {
          body_md?: string
          created_at?: string
          id?: string
          order_index?: number
          slug?: string
          title?: string
        }
        Relationships: []
      }
      education_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          quiz_score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          quiz_score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          quiz_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "education_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      education_quizzes: {
        Row: {
          correct_index: number
          id: string
          lesson_id: string
          options: Json
          order_index: number
          question: string
        }
        Insert: {
          correct_index: number
          id?: string
          lesson_id: string
          options: Json
          order_index?: number
          question: string
        }
        Update: {
          correct_index?: number
          id?: string
          lesson_id?: string
          options?: Json
          order_index?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "education_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_broadcast: boolean
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_broadcast?: boolean
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_broadcast?: boolean
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount_zar: number
          approved_at: string | null
          created_at: string
          id: string
          note: string | null
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          amount_zar: number
          approved_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          plan: string
          status?: string
          user_id: string
        }
        Update: {
          amount_zar?: number
          approved_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          created_at: string
          education_enrolled: boolean
          email: string | null
          id: string
          name: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          status: Database["public"]["Enums"]["account_status"]
          surname: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          education_enrolled?: boolean
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: Database["public"]["Enums"]["account_status"]
          surname?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          education_enrolled?: boolean
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: Database["public"]["Enums"]["account_status"]
          surname?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      signals: {
        Row: {
          closed_at: string | null
          created_at: string
          entry: number
          id: string
          pair: string
          reason: string | null
          side: Database["public"]["Enums"]["signal_side"]
          status: Database["public"]["Enums"]["signal_status"]
          stop_loss: number
          take_profit: number
          tp_percent: number
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          entry: number
          id?: string
          pair: string
          reason?: string | null
          side: Database["public"]["Enums"]["signal_side"]
          status?: Database["public"]["Enums"]["signal_status"]
          stop_loss: number
          take_profit: number
          tp_percent?: number
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          entry?: number
          id?: string
          pair?: string
          reason?: string | null
          side?: Database["public"]["Enums"]["signal_side"]
          status?: Database["public"]["Enums"]["signal_status"]
          stop_loss?: number
          take_profit?: number
          tp_percent?: number
        }
        Relationships: []
      }
      trading_credentials: {
        Row: {
          mt4_broker: string | null
          mt4_login: string | null
          mt4_password: string | null
          mt4_server: string | null
          mt5_broker: string | null
          mt5_login: string | null
          mt5_password: string | null
          mt5_server: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          mt4_broker?: string | null
          mt4_login?: string | null
          mt4_password?: string | null
          mt4_server?: string | null
          mt5_broker?: string | null
          mt5_login?: string | null
          mt5_password?: string | null
          mt5_server?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          mt4_broker?: string | null
          mt4_login?: string | null
          mt4_password?: string | null
          mt4_server?: string | null
          mt5_broker?: string | null
          mt5_login?: string | null
          mt5_password?: string | null
          mt5_server?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      education_quizzes_public: {
        Row: {
          id: string | null
          lesson_id: string | null
          options: Json | null
          order_index: number | null
          question: string | null
        }
        Insert: {
          id?: string | null
          lesson_id?: string | null
          options?: Json | null
          order_index?: number | null
          question?: string | null
        }
        Update: {
          id?: string | null
          lesson_id?: string | null
          options?: Json | null
          order_index?: number | null
          question?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "education_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "pending" | "approved" | "blocked" | "declined"
      app_role: "admin" | "user"
      plan_tier: "none" | "lite" | "pro" | "premium"
      signal_side: "BUY" | "SELL"
      signal_status: "active" | "tp_hit" | "sl_hit" | "cancelled"
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
    Enums: {
      account_status: ["pending", "approved", "blocked", "declined"],
      app_role: ["admin", "user"],
      plan_tier: ["none", "lite", "pro", "premium"],
      signal_side: ["BUY", "SELL"],
      signal_status: ["active", "tp_hit", "sl_hit", "cancelled"],
    },
  },
} as const
