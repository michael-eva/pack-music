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
      acceptances: {
        Row: {
          accepted_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acceptances_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          bio: string
          cohort: string | null
          created_at: string
          creator_id_url: string | null
          id: string
          legal_name: string
          links: string
          payout_account: string | null
          photo_url: string | null
          public_name: string
          region: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string
          cohort?: string | null
          created_at?: string
          creator_id_url?: string | null
          id?: string
          legal_name?: string
          links?: string
          payout_account?: string | null
          photo_url?: string | null
          public_name: string
          region?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string
          cohort?: string | null
          created_at?: string
          creator_id_url?: string | null
          id?: string
          legal_name?: string
          links?: string
          payout_account?: string | null
          photo_url?: string | null
          public_name?: string
          region?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_region_fkey"
            columns: ["region"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: number
          reason: string | null
          target: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          reason?: string | null
          target?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          reason?: string | null
          target?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string | null
        }
        Relationships: []
      }
      descriptors: {
        Row: {
          facet: string
          id: string
          label: string
          retired_at: string | null
        }
        Insert: {
          facet: string
          id: string
          label: string
          retired_at?: string | null
        }
        Update: {
          facet?: string
          id?: string
          label?: string
          retired_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          body: string
          href: string | null
          id: string
          is_current: boolean
          kind: Database["public"]["Enums"]["document_kind"]
          published_at: string
          summary: Json
          title: string
          version: string
        }
        Insert: {
          body?: string
          href?: string | null
          id?: string
          is_current?: boolean
          kind: Database["public"]["Enums"]["document_kind"]
          published_at?: string
          summary?: Json
          title: string
          version: string
        }
        Update: {
          body?: string
          href?: string | null
          id?: string
          is_current?: boolean
          kind?: Database["public"]["Enums"]["document_kind"]
          published_at?: string
          summary?: Json
          title?: string
          version?: string
        }
        Relationships: []
      }
      genres: {
        Row: {
          id: string
          label: string
          list_version: number
          parent_id: string | null
          retired_at: string | null
        }
        Insert: {
          id: string
          label: string
          list_version?: number
          parent_id?: string | null
          retired_at?: string | null
        }
        Update: {
          id?: string
          label?: string
          list_version?: number
          parent_id?: string | null
          retired_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "genres_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          business_id: string | null
          cohort: string | null
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          site_id: string | null
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          business_id?: string | null
          cohort?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          site_id?: string | null
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          business_id?: string | null
          cohort?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          site_id?: string | null
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          cents: number
          created_at: string
          id: string
          month: string
          person_id: string
          plays: number
          pot_plays: number
          reverses: string | null
          run_id: string | null
          share_bp: number | null
          site_id: string | null
          track_id: string | null
          type: Database["public"]["Enums"]["ledger_type"]
        }
        Insert: {
          cents: number
          created_at?: string
          id?: string
          month: string
          person_id: string
          plays?: number
          pot_plays?: number
          reverses?: string | null
          run_id?: string | null
          share_bp?: number | null
          site_id?: string | null
          track_id?: string | null
          type: Database["public"]["Enums"]["ledger_type"]
        }
        Update: {
          cents?: number
          created_at?: string
          id?: string
          month?: string
          person_id?: string
          plays?: number
          pot_plays?: number
          reverses?: string | null
          run_id?: string | null
          share_bp?: number | null
          site_id?: string | null
          track_id?: string | null
          type?: Database["public"]["Enums"]["ledger_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_reverses_fkey"
            columns: ["reverses"]
            isOneToOne: false
            referencedRelation: "ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "month_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          accepted_at: string
          class: Database["public"]["Enums"]["membership_class"]
          id: string
          rules_document_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          class: Database["public"]["Enums"]["membership_class"]
          id?: string
          rules_document_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          class?: Database["public"]["Enums"]["membership_class"]
          id?: string
          rules_document_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_rules_document_id_fkey"
            columns: ["rules_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      month_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          month: string
          settings_snapshot: Json
          state: Database["public"]["Enums"]["run_state"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          month: string
          settings_snapshot: Json
          state?: Database["public"]["Enums"]["run_state"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          month?: string
          settings_snapshot?: Json
          state?: Database["public"]["Enums"]["run_state"]
        }
        Relationships: []
      }
      now_playing: {
        Row: {
          playlist_version_id: string | null
          site_id: string
          started_at: string
          track_id: string | null
        }
        Insert: {
          playlist_version_id?: string | null
          site_id: string
          started_at?: string
          track_id?: string | null
        }
        Update: {
          playlist_version_id?: string | null
          site_id?: string
          started_at?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "now_playing_playlist_version_id_fkey"
            columns: ["playlist_version_id"]
            isOneToOne: false
            referencedRelation: "playlist_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "now_playing_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "now_playing_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          created_at: string
          email: string | null
          id: string
          ipi: string | null
          isni: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          ipi?: string | null
          isni?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          ipi?: string | null
          isni?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      play_events: {
        Row: {
          id: string
          playlist_version_id: string | null
          received_at: string
          seconds_played: number
          site_id: string
          started_at: string
          track_id: string
        }
        Insert: {
          id: string
          playlist_version_id?: string | null
          received_at?: string
          seconds_played: number
          site_id: string
          started_at: string
          track_id: string
        }
        Update: {
          id?: string
          playlist_version_id?: string | null
          received_at?: string
          seconds_played?: number
          site_id?: string
          started_at?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_events_playlist_version_id_fkey"
            columns: ["playlist_version_id"]
            isOneToOne: false
            referencedRelation: "playlist_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "play_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "play_events_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          playlist_version_id: string
          position: number
          track_id: string
        }
        Insert: {
          playlist_version_id: string
          position: number
          track_id: string
        }
        Update: {
          playlist_version_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_version_id_fkey"
            columns: ["playlist_version_id"]
            isOneToOne: false
            referencedRelation: "playlist_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_versions: {
        Row: {
          created_at: string
          id: string
          playlist_id: string
          published_at: string | null
          published_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          playlist_id: string
          published_at?: string | null
          published_by?: string | null
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          playlist_id?: string
          published_at?: string | null
          published_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "playlist_versions_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          curated_by: string
          curator_user_id: string | null
          id: string
          name: string
          site_id: string | null
        }
        Insert: {
          created_at?: string
          curated_by: string
          curator_user_id?: string | null
          id?: string
          name: string
          site_id?: string | null
        }
        Update: {
          created_at?: string
          curated_by?: string
          curator_user_id?: string | null
          id?: string
          name?: string
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deactivated_at: string | null
          display_name: string | null
          email: string
          news_opt_in: boolean
          open_data_consent_at: string | null
          postcode: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          display_name?: string | null
          email: string
          news_opt_in?: boolean
          open_data_consent_at?: string | null
          postcode?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          display_name?: string | null
          email?: string
          news_opt_in?: boolean
          open_data_consent_at?: string | null
          postcode?: string | null
          user_id?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          code: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      release_events: {
        Row: {
          actor: string | null
          created_at: string
          from_state: Database["public"]["Enums"]["release_state"] | null
          id: number
          reason: string | null
          release_id: string
          to_state: Database["public"]["Enums"]["release_state"]
        }
        Insert: {
          actor?: string | null
          created_at?: string
          from_state?: Database["public"]["Enums"]["release_state"] | null
          id?: never
          reason?: string | null
          release_id: string
          to_state: Database["public"]["Enums"]["release_state"]
        }
        Update: {
          actor?: string | null
          created_at?: string
          from_state?: Database["public"]["Enums"]["release_state"] | null
          id?: never
          reason?: string | null
          release_id?: string
          to_state?: Database["public"]["Enums"]["release_state"]
        }
        Relationships: [
          {
            foreignKeyName: "release_events_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      release_issues: {
        Row: {
          cleared_at: string | null
          code: string
          created_at: string
          fixed_by: string
          id: string
          message: string
          outcome: string
          release_id: string
          track_id: string | null
        }
        Insert: {
          cleared_at?: string | null
          code: string
          created_at?: string
          fixed_by: string
          id?: string
          message: string
          outcome: string
          release_id: string
          track_id?: string | null
        }
        Update: {
          cleared_at?: string | null
          code?: string
          created_at?: string
          fixed_by?: string
          id?: string
          message?: string
          outcome?: string
          release_id?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "release_issues_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          artist_id: string
          artwork_url: string | null
          created_at: string
          genre_list_version: number
          id: string
          label: string | null
          original_release_date: string | null
          p_line: string | null
          pack_release_date: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rights_confirmed_at: string | null
          rights_status: Database["public"]["Enums"]["rights_status"] | null
          splits_confirmed_at: string | null
          state: Database["public"]["Enums"]["release_state"]
          submitted_at: string | null
          title: string
          type: Database["public"]["Enums"]["release_type"]
          upc: string | null
          version: number
        }
        Insert: {
          artist_id: string
          artwork_url?: string | null
          created_at?: string
          genre_list_version?: number
          id?: string
          label?: string | null
          original_release_date?: string | null
          p_line?: string | null
          pack_release_date?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rights_confirmed_at?: string | null
          rights_status?: Database["public"]["Enums"]["rights_status"] | null
          splits_confirmed_at?: string | null
          state?: Database["public"]["Enums"]["release_state"]
          submitted_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["release_type"]
          upc?: string | null
          version?: number
        }
        Update: {
          artist_id?: string
          artwork_url?: string | null
          created_at?: string
          genre_list_version?: number
          id?: string
          label?: string | null
          original_release_date?: string | null
          p_line?: string | null
          pack_release_date?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rights_confirmed_at?: string | null
          rights_status?: Database["public"]["Enums"]["rights_status"] | null
          splits_confirmed_at?: string | null
          state?: Database["public"]["Enums"]["release_state"]
          submitted_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["release_type"]
          upc?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "releases_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          saved_at: string
          site_id: string | null
          track_id: string
          user_id: string
        }
        Insert: {
          saved_at?: string
          site_id?: string | null
          track_id: string
          user_id: string
        }
        Update: {
          saved_at?: string
          site_id?: string | null
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          changed_at: string
          changed_by: string | null
          key: string
          value: Json
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          key: string
          value: Json
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          key?: string
          value?: Json
        }
        Relationships: []
      }
      site_assignments: {
        Row: {
          assigned_by: string | null
          id: string
          playlist_version_id: string
          site_id: string
          starts_at: string
        }
        Insert: {
          assigned_by?: string | null
          id?: string
          playlist_version_id: string
          site_id: string
          starts_at?: string
        }
        Update: {
          assigned_by?: string | null
          id?: string
          playlist_version_id?: string
          site_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_assignments_playlist_version_id_fkey"
            columns: ["playlist_version_id"]
            isOneToOne: false
            referencedRelation: "playlist_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_assignments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pots: {
        Row: {
          artist_pool_cents: number
          fee_cents: number
          id: string
          pack_cents: number
          qualified_plays: number
          run_id: string
          site_id: string
        }
        Insert: {
          artist_pool_cents: number
          fee_cents: number
          id?: string
          pack_cents: number
          qualified_plays: number
          run_id: string
          site_id: string
        }
        Update: {
          artist_pool_cents?: number
          fee_cents?: number
          id?: string
          pack_cents?: number
          qualified_plays?: number
          run_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_pots_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "month_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_pots_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_staff: {
        Row: {
          created_at: string
          display_name: string
          site_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          site_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_staff_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string
          business_id: string
          business_type: string
          created_at: string
          explicit_allowed: boolean
          fee_cents: number
          id: string
          last_heartbeat_at: string | null
          licensing_accepted_at: string | null
          name: string
          opening_hours: string
          player_end: string
          player_start: string
          region: string | null
          short_code: string
          trim_db: number
          use_house_playlist: boolean
          vibe: string
        }
        Insert: {
          address?: string
          business_id: string
          business_type?: string
          created_at?: string
          explicit_allowed?: boolean
          fee_cents?: number
          id?: string
          last_heartbeat_at?: string | null
          licensing_accepted_at?: string | null
          name: string
          opening_hours?: string
          player_end?: string
          player_start?: string
          region?: string | null
          short_code: string
          trim_db?: number
          use_house_playlist?: boolean
          vibe?: string
        }
        Update: {
          address?: string
          business_id?: string
          business_type?: string
          created_at?: string
          explicit_allowed?: boolean
          fee_cents?: number
          id?: string
          last_heartbeat_at?: string | null
          licensing_accepted_at?: string | null
          name?: string
          opening_hours?: string
          player_end?: string
          player_start?: string
          region?: string | null
          short_code?: string
          trim_db?: number
          use_house_playlist?: boolean
          vibe?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_region_fkey"
            columns: ["region"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
      }
      skips: {
        Row: {
          created_at: string
          id: number
          reason: string
          site_id: string
          track_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          reason: string
          site_id: string
          track_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          reason?: string
          site_id?: string
          track_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skips_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skips_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      split_sets: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          track_id: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          track_id: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_sets_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      splits: {
        Row: {
          person_id: string
          role: string
          share_bp: number
          split_set_id: string
        }
        Insert: {
          person_id: string
          role: string
          share_bp: number
          split_set_id: string
        }
        Update: {
          person_id?: string
          role?: string
          share_bp?: number
          split_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "splits_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "splits_split_set_id_fkey"
            columns: ["split_set_id"]
            isOneToOne: false
            referencedRelation: "split_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          created_at: string
          handled_at: string | null
          id: string
          site_id: string
          track_id: string
          user_id: string
          why: string
        }
        Insert: {
          created_at?: string
          handled_at?: string | null
          id?: string
          site_id: string
          track_id: string
          user_id: string
          why?: string
        }
        Update: {
          created_at?: string
          handled_at?: string | null
          id?: string
          site_id?: string
          track_id?: string
          user_id?: string
          why?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_descriptors: {
        Row: {
          descriptor_id: string
          track_id: string
        }
        Insert: {
          descriptor_id: string
          track_id: string
        }
        Update: {
          descriptor_id?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_descriptors_descriptor_id_fkey"
            columns: ["descriptor_id"]
            isOneToOne: false
            referencedRelation: "descriptors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_descriptors_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          ai_declaration: string | null
          ai_declared_at: string | null
          audio_path: string | null
          created_at: string
          duration_ms: number
          explicit: boolean
          flag_reason: string | null
          flagged_at: string | null
          genre_id: string | null
          id: string
          isrc: string | null
          iswc: string | null
          language: string
          lra: number | null
          lufs: number | null
          position: number
          release_id: string
          story: string
          taken_down_at: string | null
          title: string
          true_peak: number | null
          version_title: string | null
        }
        Insert: {
          ai_declaration?: string | null
          ai_declared_at?: string | null
          audio_path?: string | null
          created_at?: string
          duration_ms?: number
          explicit?: boolean
          flag_reason?: string | null
          flagged_at?: string | null
          genre_id?: string | null
          id?: string
          isrc?: string | null
          iswc?: string | null
          language?: string
          lra?: number | null
          lufs?: number | null
          position: number
          release_id: string
          story?: string
          taken_down_at?: string | null
          title: string
          true_peak?: number | null
          version_title?: string | null
        }
        Update: {
          ai_declaration?: string | null
          ai_declared_at?: string | null
          audio_path?: string | null
          created_at?: string
          duration_ms?: number
          explicit?: boolean
          flag_reason?: string | null
          flagged_at?: string | null
          genre_id?: string | null
          id?: string
          isrc?: string | null
          iswc?: string | null
          language?: string
          lra?: number | null
          lufs?: number | null
          position?: number
          release_id?: string
          story?: string
          taken_down_at?: string | null
          title?: string
          true_peak?: number | null
          version_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      app_role:
        | "admin"
        | "curator"
        | "artist"
        | "business_owner"
        | "business_staff"
        | "listener"
      document_kind:
        | "terms"
        | "privacy"
        | "coop_rules"
        | "artist_agreement"
        | "licensing_notice"
      ledger_type: "accrual" | "adjustment" | "hold" | "release" | "payout"
      membership_class: "full" | "associate"
      release_state:
        | "draft"
        | "received"
        | "checking"
        | "needs_attention"
        | "held"
        | "rejected"
        | "in_review"
        | "approved"
        | "scheduled"
        | "live"
        | "withdrawn"
        | "taken_down"
      release_type: "single" | "ep" | "album"
      rights_status:
        | "unsigned"
        | "independent_label"
        | "distributor"
        | "major_label"
        | "unknown"
      run_state: "dry_run" | "approved"
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
    Enums: {
      app_role: [
        "admin",
        "curator",
        "artist",
        "business_owner",
        "business_staff",
        "listener",
      ],
      document_kind: [
        "terms",
        "privacy",
        "coop_rules",
        "artist_agreement",
        "licensing_notice",
      ],
      ledger_type: ["accrual", "adjustment", "hold", "release", "payout"],
      membership_class: ["full", "associate"],
      release_state: [
        "draft",
        "received",
        "checking",
        "needs_attention",
        "held",
        "rejected",
        "in_review",
        "approved",
        "scheduled",
        "live",
        "withdrawn",
        "taken_down",
      ],
      release_type: ["single", "ep", "album"],
      rights_status: [
        "unsigned",
        "independent_label",
        "distributor",
        "major_label",
        "unknown",
      ],
      run_state: ["dry_run", "approved"],
    },
  },
} as const

