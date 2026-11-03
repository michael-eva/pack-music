export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      acceptances: {
        Row: {
          accepted_at: string;
          document_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          accepted_at?: string;
          document_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          accepted_at?: string;
          document_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "acceptances_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      artists: {
        Row: {
          bio: string;
          created_at: string;
          creator_id_url: string | null;
          id: string;
          links: string;
          name: string;
          photo_url: string | null;
          region: string | null;
          updated_at: string;
        };
        Insert: {
          bio?: string;
          created_at?: string;
          creator_id_url?: string | null;
          id?: string;
          links?: string;
          name: string;
          photo_url?: string | null;
          region?: string | null;
          updated_at?: string;
        };
        Update: {
          bio?: string;
          created_at?: string;
          creator_id_url?: string | null;
          id?: string;
          links?: string;
          name?: string;
          photo_url?: string | null;
          region?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artists_region_fkey";
            columns: ["region"];
            isOneToOne: false;
            referencedRelation: "regions";
            referencedColumns: ["code"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor: string | null;
          after: Json | null;
          before: Json | null;
          created_at: string;
          id: number;
          reason: string | null;
          target: string | null;
        };
        Insert: {
          action: string;
          actor?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          id?: never;
          reason?: string | null;
          target?: string | null;
        };
        Update: {
          action?: string;
          actor?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          id?: never;
          reason?: string | null;
          target?: string | null;
        };
        Relationships: [];
      };
      descriptors: {
        Row: {
          facet: string;
          id: string;
          label: string;
          retired_at: string | null;
        };
        Insert: {
          facet: string;
          id: string;
          label: string;
          retired_at?: string | null;
        };
        Update: {
          facet?: string;
          id?: string;
          label?: string;
          retired_at?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          body: string;
          href: string | null;
          id: string;
          is_current: boolean;
          kind: Database["public"]["Enums"]["document_kind"];
          published_at: string;
          title: string;
          version: string;
        };
        Insert: {
          body?: string;
          href?: string | null;
          id?: string;
          is_current?: boolean;
          kind: Database["public"]["Enums"]["document_kind"];
          published_at?: string;
          title: string;
          version: string;
        };
        Update: {
          body?: string;
          href?: string | null;
          id?: string;
          is_current?: boolean;
          kind?: Database["public"]["Enums"]["document_kind"];
          published_at?: string;
          title?: string;
          version?: string;
        };
        Relationships: [];
      };
      genres: {
        Row: {
          id: string;
          label: string;
          parent_id: string | null;
          retired_at: string | null;
        };
        Insert: {
          id: string;
          label: string;
          parent_id?: string | null;
          retired_at?: string | null;
        };
        Update: {
          id?: string;
          label?: string;
          parent_id?: string | null;
          retired_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "genres_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          created_at: string;
          created_by: string | null;
          email: string;
          expires_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          token: string;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          email: string;
          expires_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          token?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          email?: string;
          expires_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          token?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [];
      };
      playlist_tracks: {
        Row: {
          playlist_version_id: string;
          position: number;
          track_id: string;
        };
        Insert: {
          playlist_version_id: string;
          position: number;
          track_id: string;
        };
        Update: {
          playlist_version_id?: string;
          position?: number;
          track_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_version_id_fkey";
            columns: ["playlist_version_id"];
            isOneToOne: false;
            referencedRelation: "playlist_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      playlist_versions: {
        Row: {
          created_at: string;
          id: string;
          playlist_id: string;
          published_at: string | null;
          published_by: string | null;
          version: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          playlist_id: string;
          published_at?: string | null;
          published_by?: string | null;
          version: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          playlist_id?: string;
          published_at?: string | null;
          published_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "playlist_versions_playlist_id_fkey";
            columns: ["playlist_id"];
            isOneToOne: false;
            referencedRelation: "playlists";
            referencedColumns: ["id"];
          },
        ];
      };
      playlists: {
        Row: {
          cover_url: string | null;
          created_at: string;
          curated_by: string;
          curator_user_id: string | null;
          description: string;
          featured_order: number;
          id: string;
          is_featured: boolean;
          name: string;
        };
        Insert: {
          cover_url?: string | null;
          created_at?: string;
          curated_by: string;
          curator_user_id?: string | null;
          description?: string;
          featured_order?: number;
          id?: string;
          is_featured?: boolean;
          name: string;
        };
        Update: {
          cover_url?: string | null;
          created_at?: string;
          curated_by?: string;
          curator_user_id?: string | null;
          description?: string;
          featured_order?: number;
          id?: string;
          is_featured?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          deactivated_at: string | null;
          display_name: string | null;
          email: string;
          news_opt_in: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deactivated_at?: string | null;
          display_name?: string | null;
          email: string;
          news_opt_in?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deactivated_at?: string | null;
          display_name?: string | null;
          email?: string;
          news_opt_in?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      regions: {
        Row: {
          code: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          code: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          code?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      releases: {
        Row: {
          artist_id: string;
          artwork_url: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          label: string | null;
          original_release_date: string | null;
          p_line: string | null;
          published_at: string | null;
          state: Database["public"]["Enums"]["release_state"];
          title: string;
          type: Database["public"]["Enums"]["release_type"];
          upc: string | null;
          updated_at: string;
        };
        Insert: {
          artist_id: string;
          artwork_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string | null;
          original_release_date?: string | null;
          p_line?: string | null;
          published_at?: string | null;
          state?: Database["public"]["Enums"]["release_state"];
          title: string;
          type?: Database["public"]["Enums"]["release_type"];
          upc?: string | null;
          updated_at?: string;
        };
        Update: {
          artist_id?: string;
          artwork_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string | null;
          original_release_date?: string | null;
          p_line?: string | null;
          published_at?: string | null;
          state?: Database["public"]["Enums"]["release_state"];
          title?: string;
          type?: Database["public"]["Enums"]["release_type"];
          upc?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "releases_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      saves: {
        Row: {
          saved_at: string;
          track_id: string;
          user_id: string;
        };
        Insert: {
          saved_at?: string;
          track_id: string;
          user_id: string;
        };
        Update: {
          saved_at?: string;
          track_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saves_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          changed_at: string;
          changed_by: string | null;
          key: string;
          value: Json;
        };
        Insert: {
          changed_at?: string;
          changed_by?: string | null;
          key: string;
          value: Json;
        };
        Update: {
          changed_at?: string;
          changed_by?: string | null;
          key?: string;
          value?: Json;
        };
        Relationships: [];
      };
      track_descriptors: {
        Row: {
          descriptor_id: string;
          track_id: string;
        };
        Insert: {
          descriptor_id: string;
          track_id: string;
        };
        Update: {
          descriptor_id?: string;
          track_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "track_descriptors_descriptor_id_fkey";
            columns: ["descriptor_id"];
            isOneToOne: false;
            referencedRelation: "descriptors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "track_descriptors_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      tracks: {
        Row: {
          ai_declaration: string | null;
          audio_path: string | null;
          created_at: string;
          duration_ms: number;
          explicit: boolean;
          genre_id: string | null;
          id: string;
          isrc: string | null;
          lra: number | null;
          lufs: number | null;
          position: number;
          release_id: string;
          story: string;
          taken_down_at: string | null;
          title: string;
          true_peak: number | null;
        };
        Insert: {
          ai_declaration?: string | null;
          audio_path?: string | null;
          created_at?: string;
          duration_ms?: number;
          explicit?: boolean;
          genre_id?: string | null;
          id?: string;
          isrc?: string | null;
          lra?: number | null;
          lufs?: number | null;
          position: number;
          release_id: string;
          story?: string;
          taken_down_at?: string | null;
          title: string;
          true_peak?: number | null;
        };
        Update: {
          ai_declaration?: string | null;
          audio_path?: string | null;
          created_at?: string;
          duration_ms?: number;
          explicit?: boolean;
          genre_id?: string | null;
          id?: string;
          isrc?: string | null;
          lra?: number | null;
          lufs?: number | null;
          position?: number;
          release_id?: string;
          story?: string;
          taken_down_at?: string | null;
          title?: string;
          true_peak?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracks_genre_id_fkey";
            columns: ["genre_id"];
            isOneToOne: false;
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracks_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: "admin" | "curator" | "listener";
      document_kind: "terms" | "privacy";
      release_state: "draft" | "live" | "withdrawn";
      release_type: "single" | "ep" | "album";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "curator", "listener"],
      document_kind: ["terms", "privacy"],
      release_state: ["draft", "live", "withdrawn"],
      release_type: ["single", "ep", "album"],
    },
  },
} as const;
