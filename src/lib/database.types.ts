export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      artist_payment_account: {
        Row: {
          account_id: string
          account_name: string
          artist_id: string
        }
        Insert: {
          account_id: string
          account_name: string
          artist_id: string
        }
        Update: {
          account_id?: string
          account_name?: string
          artist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_bank_account_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artist_profile"
            referencedColumns: ["artist_id"]
          },
        ]
      }
      artist_profile: {
        Row: {
          artist_id: string
          bio: string
          cohort_label: string | null
          private_name: string
          public_name: string
          region: string
          stripe_account_id: string | null
          user_id: string
        }
        Insert: {
          artist_id?: string
          bio: string
          cohort_label?: string | null
          private_name: string
          public_name: string
          region: string
          stripe_account_id?: string | null
          user_id: string
        }
        Update: {
          artist_id?: string
          bio?: string
          cohort_label?: string | null
          private_name?: string
          public_name?: string
          region?: string
          stripe_account_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_and_site: {
        Row: {
          address: string
          business_id: string
          notional_fee_cents: number
          region: string
          site_id: string
          site_name: string
          stripe_id: string | null
        }
        Insert: {
          address: string
          business_id: string
          notional_fee_cents: number
          region: string
          site_id: string
          site_name: string
          stripe_id?: string | null
        }
        Update: {
          address?: string
          business_id?: string
          notional_fee_cents?: number
          region?: string
          site_id?: string
          site_name?: string
          stripe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_and_site_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "payer"
            referencedColumns: ["payer_id"]
          },
        ]
      }
      ledger: {
        Row: {
          account_category: string | null
          amount_dollars: string
          amount_units: number
          artist_id: string | null
          created_at: string
          entry_id: string
          entry_type: string
          month: string
          public_name: string | null
        }
        Insert: {
          account_category?: string | null
          amount_dollars: string
          amount_units: number
          artist_id?: string | null
          created_at?: string
          entry_id?: string
          entry_type?: string
          month: string
          public_name?: string | null
        }
        Update: {
          account_category?: string | null
          amount_dollars?: string
          amount_units?: number
          artist_id?: string | null
          created_at?: string
          entry_id?: string
          entry_type?: string
          month?: string
          public_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profile"
            referencedColumns: ["artist_id"]
          },
        ]
      }
      listeners_profile: {
        Row: {
          listener_id: string
          listener_name: string
          listener_stripe_id: string | null
          user_id: string
        }
        Insert: {
          listener_id: string
          listener_name: string
          listener_stripe_id?: string | null
          user_id: string
        }
        Update: {
          listener_id?: string
          listener_name?: string
          listener_stripe_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listeners_profile_listener_id_fkey"
            columns: ["listener_id"]
            isOneToOne: true
            referencedRelation: "payer"
            referencedColumns: ["payer_id"]
          },
        ]
      }
      payer: {
        Row: {
          fee: number
          payer_id: string
          payer_type: string
        }
        Insert: {
          fee: number
          payer_id?: string
          payer_type: string
        }
        Update: {
          fee?: number
          payer_id?: string
          payer_type?: string
        }
        Relationships: []
      }
      payout: {
        Row: {
          artist_id: string
          created_at: string
          error: string | null
          ledger_entry_id: string
          month: string | null
          payout_id: string
          payout_transfer_id: string | null
          payout_type: string
          payout_value_cents: number
          public_name: string | null
          status: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          error?: string | null
          ledger_entry_id: string
          month?: string | null
          payout_id?: string
          payout_transfer_id?: string | null
          payout_type: string
          payout_value_cents: number
          public_name?: string | null
          status?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          error?: string | null
          ledger_entry_id?: string
          month?: string | null
          payout_id?: string
          payout_transfer_id?: string | null
          payout_type?: string
          payout_value_cents?: number
          public_name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profile"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "payout_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "ledger"
            referencedColumns: ["entry_id"]
          },
        ]
      }
      play_event: {
        Row: {
          duration_played: number
          event_id: string
          payer_id: string
          played_date: string
          playlist: string | null
          track_id: string
        }
        Insert: {
          duration_played: number
          event_id?: string
          payer_id: string
          played_date: string
          playlist?: string | null
          track_id: string
        }
        Update: {
          duration_played?: number
          event_id?: string
          payer_id?: string
          played_date?: string
          playlist?: string | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_event_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "play_event_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "track"
            referencedColumns: ["track_id"]
          },
        ]
      }
      run_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      track: {
        Row: {
          artist_id: string
          duration_seconds: number | null
          release: string | null
          title: string
          track_id: string
        }
        Insert: {
          artist_id: string
          duration_seconds?: number | null
          release?: string | null
          title: string
          track_id?: string
        }
        Update: {
          artist_id?: string
          duration_seconds?: number | null
          release?: string | null
          title?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_artist_id_temp_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profile"
            referencedColumns: ["artist_id"]
          },
        ]
      }
      track_artists: {
        Row: {
          artist_id: string
          split_pct: number | null
          track_id: string
        }
        Insert: {
          artist_id: string
          split_pct?: number | null
          track_id: string
        }
        Update: {
          artist_id?: string
          split_pct?: number | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profile"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "track_artists_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "track"
            referencedColumns: ["track_id"]
          },
        ]
      }
    }
    Views: {
      artist_balance: {
        Row: {
          artist_id: string | null
          balance_dollars: string | null
          balance_units: number | null
          last_update_month: string | null
          payable: boolean | null
          public_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profile"
            referencedColumns: ["artist_id"]
          },
        ]
      }
      payer_split: {
        Row: {
          artists_cents: number | null
          industry_cents: number | null
          licence_cents: number | null
          month: string | null
          net_revenue_cents: number | null
          operations_cents: number | null
          played_by: string | null
          unallocated_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "play_event_payer_id_fkey"
            columns: ["played_by"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["payer_id"]
          },
        ]
      }
      payment_calc: {
        Row: {
          artist_id: string | null
          artists_cents: number | null
          eligible_duration_ms: number | null
          industry_cents: number | null
          licence_cents: number | null
          month: string | null
          net_revenue_cents: number | null
          operations_cents: number | null
          payer_total_duration_ms: number | null
          played_by: string | null
          song_payment: number | null
          track_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "play_event_payer_id_fkey"
            columns: ["played_by"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "play_event_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "track"
            referencedColumns: ["track_id"]
          },
          {
            foreignKeyName: "track_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profile"
            referencedColumns: ["artist_id"]
          },
        ]
      }
    }
    Functions: {
      complete_payout: {
        Args: { p_error?: string; p_result: string; p_transfer_id: string }
        Returns: string
      }
      monthly_run: { Args: never; Returns: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

