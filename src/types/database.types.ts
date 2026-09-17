/**
 * Hand-authored to match the schema actually applied in Supabase:
 *   - supabase/migrations/20260910130000_thaiarthub_v1.sql
 *   - supabase/migrations/20260910140000_storage_public_media_access.sql
 *
 * This was written from the migration SQL, not generated from a live
 * connection (no network access in this environment). Regenerate from the
 * real project when possible for an authoritative source:
 *
 *   supabase gen types typescript --project-id <project-ref> > src/types/database.types.ts
 *
 * Do not hand-edit column names/types without checking them against the
 * applied migrations first.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileRole = "user" | "creator" | "admin";
export type ContentStatus = "draft" | "published";
export type EventStatus = "draft" | "published" | "cancelled";
export type SavedItemType = "artist" | "work" | "event" | "place" | "article";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          role: ProfileRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: ProfileRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      artists: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          slug: string;
          bio: string | null;
          cover_image_url: string | null;
          avatar_url: string | null;
          location: string | null;
          website_url: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
          tiktok_url: string | null;
          contact_url: string | null;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          slug: string;
          bio?: string | null;
          cover_image_url?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          website_url?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          contact_url?: string | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["artists"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      artist_categories: {
        Row: {
          artist_id: string;
          category_id: string;
        };
        Insert: {
          artist_id: string;
          category_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["artist_categories"]["Insert"]>;
      };
      works: {
        Row: {
          id: string;
          artist_id: string;
          title: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          external_url: string | null;
          type: string;
          year: number | null;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          title: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          external_url?: string | null;
          type: string;
          year?: number | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["works"]["Insert"]>;
      };
      work_images: {
        Row: {
          id: string;
          work_id: string;
          image_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_id: string;
          image_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["work_images"]["Insert"]>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          cover_image_url: string | null;
          venue_name: string | null;
          address: string | null;
          province: string | null;
          latitude: number | null;
          longitude: number | null;
          start_at: string;
          end_at: string | null;
          external_url: string | null;
          status: EventStatus;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          cover_image_url?: string | null;
          venue_name?: string | null;
          address?: string | null;
          province?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          start_at: string;
          end_at?: string | null;
          external_url?: string | null;
          status?: EventStatus;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
      };
      event_artists: {
        Row: {
          event_id: string;
          artist_id: string;
        };
        Insert: {
          event_id: string;
          artist_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_artists"]["Insert"]>;
      };
      article_images: {
        Row: {
          id: string;
          article_id: string;
          image_url: string;
          sort_order: number;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          image_url: string;
          sort_order?: number;
          caption?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["article_images"]["Insert"]>;
      };
      event_images: {
        Row: {
          id: string;
          event_id: string;
          image_url: string;
          sort_order: number;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          image_url: string;
          sort_order?: number;
          caption?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_images"]["Insert"]>;
      };
      articles: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          cover_image_url: string | null;
          category: string;
          status: ContentStatus;
          is_featured: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content: string;
          cover_image_url?: string | null;
          category: string;
          status?: ContentStatus;
          is_featured?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
      };
      creative_places: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          cover_image_url: string | null;
          type: string;
          address: string | null;
          province: string | null;
          latitude: number | null;
          longitude: number | null;
          external_url: string | null;
          status: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          cover_image_url?: string | null;
          type: string;
          address?: string | null;
          province?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          external_url?: string | null;
          status?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["creative_places"]["Insert"]>;
      };
      claim_requests: {
        Row: {
          id: string;
          artist_id: string;
          requester_profile_id: string;
          verification_url: string | null;
          message: string | null;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          requester_profile_id: string;
          verification_url?: string | null;
          message?: string | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["claim_requests"]["Insert"]>;
      };
      user_saved_items: {
        Row: {
          id: string;
          profile_id: string;
          item_type: SavedItemType;
          item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          item_type: SavedItemType;
          item_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_saved_items"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_creator_or_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      owns_artist: {
        Args: { target_artist_id: string };
        Returns: boolean;
      };
      is_artist_claimed: {
        Args: { p_artist_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      profile_role: ProfileRole;
      content_status: ContentStatus;
      event_status: EventStatus;
      saved_item_type: SavedItemType;
    };
    CompositeTypes: Record<string, never>;
  };
}
