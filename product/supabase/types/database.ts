// Supabase schema types used by the apps in this repo.
// Keep this file aligned with repo migrations and refresh from `supabase gen types` when the local stack is current.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          favorite_brew_method_id: string | null;
          sensory_level: 'beginner' | 'advanced' | 'expert';
          sensory_level_override: 'beginner' | 'advanced' | 'expert' | null;
          sensory_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          favorite_brew_method_id?: string | null;
          sensory_level?: 'beginner' | 'advanced' | 'expert';
          sensory_level_override?: 'beginner' | 'advanced' | 'expert' | null;
          sensory_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          favorite_brew_method_id?: string | null;
          sensory_level?: 'beginner' | 'advanced' | 'expert';
          sensory_level_override?: 'beginner' | 'advanced' | 'expert' | null;
          sensory_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      roasters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          customer_number: string;
          company_name: string | null;
          roaster_short_name: string | null;
          country: string | null;
          city: string | null;
          description: string | null;
          website: string | null;
          logo_url: string | null;
          street: string | null;
          building_number: string | null;
          apartment_number: string | null;
          postal_code: string | null;
          regon: string | null;
          nip: string | null;
          subscription_status: string | null;
          verification_status: 'pending' | 'verified' | 'revoked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          customer_number?: string;
          company_name?: string | null;
          roaster_short_name?: string | null;
          country?: string | null;
          city?: string | null;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          street?: string | null;
          building_number?: string | null;
          apartment_number?: string | null;
          postal_code?: string | null;
          regon?: string | null;
          nip?: string | null;
          subscription_status?: string | null;
          verification_status?: 'pending' | 'verified' | 'revoked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          name?: string;
          customer_number?: string;
          company_name?: string | null;
          roaster_short_name?: string | null;
          country?: string | null;
          city?: string | null;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          street?: string | null;
          building_number?: string | null;
          apartment_number?: string | null;
          postal_code?: string | null;
          regon?: string | null;
          nip?: string | null;
          subscription_status?: string | null;
          verification_status?: 'pending' | 'verified' | 'revoked';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roaster_follows: {
        Row: {
          user_id: string;
          roaster_id: string;
          source: 'legacy-backfill' | 'discover-roasters-hub' | 'roaster-profile' | 'roasters-screen';
          created_at: string;
          last_seen_at: string;
        };
        Insert: {
          user_id: string;
          roaster_id: string;
          source: 'legacy-backfill' | 'discover-roasters-hub' | 'roaster-profile' | 'roasters-screen';
          created_at?: string;
          last_seen_at?: string;
        };
        Update: {
          user_id?: string;
          roaster_id?: string;
          source?: 'legacy-backfill' | 'discover-roasters-hub' | 'roaster-profile' | 'roasters-screen';
          created_at?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      roaster_customer_number_registry: {
        Row: {
          customer_number: string;
          roaster_id: string;
          assigned_at: string;
        };
        Insert: {
          customer_number: string;
          roaster_id: string;
          assigned_at?: string;
        };
        Update: {
          customer_number?: string;
          roaster_id?: string;
          assigned_at?: string;
        };
        Relationships: [];
      };
      coffees: {
        Row: {
          id: string;
          roaster_id: string;
          origin_id: string | null;
          name: string;
          variety: string | null;
          processing_method:
            | 'washed'
            | 'natural'
            | 'honey'
            | 'anaerobic'
            | 'wet-hulled'
            | 'other'
            | null;
          producer_notes: string | null;
          status: 'draft' | 'active' | 'archived';
          cover_image_url: string | null;
          store_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      coffee_varieties: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      coffee_variety_assignments: {
        Row: {
          id: string;
          coffee_id: string;
          variety_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          coffee_id: string;
          variety_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          coffee_id?: string;
          variety_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      roast_batches: {
        Row: {
          id: string;
          coffee_id: string;
          roast_date: string;
          lot_number: string;
          status: 'draft' | 'active' | 'archived';
          brewing_notes: string | null;
          roaster_story: string | null;
          declared_sensory_acidity: number | null;
          declared_sensory_sweetness: number | null;
          declared_sensory_body: number | null;
          declared_sensory_bitter: number | null;
          declared_sensory_aftertaste: number | null;
          suggested_brew_method_ids: string[];
          suggested_tasting_note_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coffee_id: string;
          roast_date: string;
          lot_number: string;
          status?: 'draft' | 'active' | 'archived';
          brewing_notes?: string | null;
          roaster_story?: string | null;
          declared_sensory_acidity?: number | null;
          declared_sensory_sweetness?: number | null;
          declared_sensory_body?: number | null;
          declared_sensory_bitter?: number | null;
          declared_sensory_aftertaste?: number | null;
          suggested_brew_method_ids?: string[];
          suggested_tasting_note_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coffee_id?: string;
          roast_date?: string;
          lot_number?: string;
          status?: 'draft' | 'active' | 'archived';
          brewing_notes?: string | null;
          roaster_story?: string | null;
          declared_sensory_acidity?: number | null;
          declared_sensory_sweetness?: number | null;
          declared_sensory_body?: number | null;
          declared_sensory_bitter?: number | null;
          declared_sensory_aftertaste?: number | null;
          suggested_brew_method_ids?: string[];
          suggested_tasting_note_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qr_codes: {
        Row: {
          id: string;
          batch_id: string;
          hash: string;
          qr_url: string;
          svg_storage_path: string;
          png_storage_path: string;
          generated_at: string;
        };
      };
      brew_methods: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
        };
      };
      tasting_notes: {
        Row: {
          id: string;
          name: string;
          label: string;
          category: string;
          sort_order: number;
        };
      };
      user_favorite_flavor_notes: {
        Row: {
          user_id: string;
          tasting_note_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          tasting_note_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          tasting_note_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_favorite_coffee_logs: {
        Row: {
          id: string;
          user_id: string;
          coffee_log_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          coffee_log_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          coffee_log_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_favorite_qr_entries: {
        Row: {
          id: string;
          user_id: string;
          qr_hash: string;
          batch_id: string;
          coffee_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          qr_hash: string;
          batch_id: string;
          coffee_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          qr_hash?: string;
          batch_id?: string;
          coffee_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      coffee_logs: {
        Row: {
          id: string;
          user_id: string;
          batch_id: string;
          rating: number;
          brew_method_id: string | null;
          brew_time_seconds: number | null;
          free_text_notes: string | null;
          logged_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          batch_id: string;
          rating: number;
          brew_method_id?: string | null;
          brew_time_seconds?: number | null;
          free_text_notes?: string | null;
          logged_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          batch_id?: string;
          rating?: number;
          brew_method_id?: string | null;
          brew_time_seconds?: number | null;
          free_text_notes?: string | null;
          logged_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      coffee_log_telemetry_core: {
        Row: {
          id: string;
          coffee_log_id: string;
          brew_method_id: string;
          overall_rating: number;
          sensory_acidity: number;
          sensory_sweetness: number;
          sensory_body: number;
          sensory_bitter: number | null;
          sensory_aftertaste: number | null;
          repurchase_intent: 'yes' | 'no' | 'unsure';
          experience_level: 'beginner' | 'advanced' | 'expert';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coffee_log_id: string;
          brew_method_id: string;
          overall_rating: number;
          sensory_acidity: number;
          sensory_sweetness: number;
          sensory_body: number;
          sensory_bitter?: number | null;
          sensory_aftertaste?: number | null;
          repurchase_intent: 'yes' | 'no' | 'unsure';
          experience_level?: 'beginner' | 'advanced' | 'expert';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coffee_log_id?: string;
          brew_method_id?: string;
          overall_rating?: number;
          sensory_acidity?: number;
          sensory_sweetness?: number;
          sensory_body?: number;
          sensory_bitter?: number | null;
          sensory_aftertaste?: number | null;
          repurchase_intent?: 'yes' | 'no' | 'unsure';
          experience_level?: 'beginner' | 'advanced' | 'expert';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      coffee_log_tasting_notes: {
        Row: {
          id: string;
          coffee_log_id: string;
          tasting_note_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          coffee_log_id: string;
          tasting_note_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          coffee_log_id?: string;
          tasting_note_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          coffee_log_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coffee_log_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coffee_log_id?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      review_votes: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          value: number;
          created_at: string;
        };
      };
      coffee_stats: {
        Row: {
          batch_id: string;
          total_count: number;
          avg_rating: number;
          rating_distribution: Record<string, number>;
          top_flavor_notes: string[];
          created_at: string;
          updated_at: string;
        };
      };
      origins: {
        Row: {
          id: string;
          country: string;
          region: string | null;
          farm: string | null;
          altitude_min: number | null;
          altitude_max: number | null;
          producer: string | null;
          created_at: string;
        };
      };
      roaster_coffee_tags: {
        Row: {
          id: string;
          public_hash: string;
          roaster_id: string;
          roaster_short_name: string;
          img_coffee_label: string;
          bean_origin_country: string;
          bean_origin_farm: string;
          bean_origin_tradename: string;
          bean_origin_region: string;
          bean_type: string;
          bean_varietal_main: string;
          bean_varietal_extra: string;
          bean_origin_height: number;
          bean_processing: string;
          bean_roast_date: string;
          bean_roast_level: string;
          brew_method: string;
          tasting_note_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          public_hash?: string;
          roaster_id: string;
          roaster_short_name: string;
          img_coffee_label: string;
          bean_origin_country: string;
          bean_origin_farm: string;
          bean_origin_tradename: string;
          bean_origin_region: string;
          bean_type: string;
          bean_varietal_main: string;
          bean_varietal_extra: string;
          bean_origin_height: number;
          bean_processing: string;
          bean_roast_date: string;
          bean_roast_level: string;
          brew_method: string;
          tasting_note_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          roaster_short_name?: string;
          img_coffee_label?: string;
          bean_origin_country?: string;
          bean_origin_farm?: string;
          bean_origin_tradename?: string;
          bean_origin_region?: string;
          bean_type?: string;
          bean_varietal_main?: string;
          bean_varietal_extra?: string;
          bean_origin_height?: number;
          bean_processing?: string;
          bean_roast_date?: string;
          bean_roast_level?: string;
          brew_method?: string;
          tasting_note_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'roaster_coffee_tags_roaster_id_fkey';
            columns: ['roaster_id'];
            isOneToOne: false;
            referencedRelation: 'roasters';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      get_coffee_favorite_user_count: {
        Args: {
          p_coffee_id: string;
        };
        Returns: number;
      };
      get_batch_community_reviews: {
        Args: {
          p_batch_id: string;
        };
        Returns: {
          review_id: string;
          body: string;
          coffee_log_id: string;
          logged_at: string;
          helpful_count: number;
          viewer_marked_helpful: boolean;
          author_name: string | null;
          author_sensory_level: 'beginner' | 'advanced' | 'expert' | null;
        }[];
      };
      get_roaster_batch_telemetry_summary: {
        Args: {
          p_batch_id: string;
        };
        Returns: {
          row_scope: string;
          brew_method_id: string | null;
          total_logs: number;
          logs_with_telemetry: number;
          avg_sensory_acidity: number | null;
          avg_sensory_sweetness: number | null;
          avg_sensory_body: number | null;
          repurchase_yes_count: number;
          repurchase_no_count: number;
          repurchase_unsure_count: number;
          experience_beginner_count: number;
          experience_advanced_count: number;
          experience_expert_count: number;
        }[];
      };
      get_user_community_summary: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          review_count: number;
          helpful_received: number;
        }[];
      };
    };
  };
};
