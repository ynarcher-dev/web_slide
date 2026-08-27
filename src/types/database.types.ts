/**
 * Supabase public 스키마의 DB 타입.
 *
 * 이 파일은 `supabase/migrations`의 스키마와 1:1로 대응한다.
 * Docker 또는 `SUPABASE_ACCESS_TOKEN`이 준비되면 `pnpm db:types`로 다시 생성해 덮어쓴다.
 * 애플리케이션 코드는 이 타입을 직접 쓰지 않고 `src/types/domain.ts`의 도메인 타입을 사용한다.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      presentations: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          brand_color: string;
          cover_tint: number;
          footer_text: string;
          show_page_number: boolean;
          is_public: boolean;
          share_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title?: string;
          brand_color?: string;
          cover_tint?: number;
          footer_text?: string;
          show_page_number?: boolean;
          is_public?: boolean;
          share_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          brand_color?: string;
          cover_tint?: number;
          footer_text?: string;
          show_page_number?: boolean;
          is_public?: boolean;
          share_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      slides: {
        Row: {
          id: string;
          presentation_id: string;
          template: Database["public"]["Enums"]["slide_template"];
          sort_order: number;
          title: string;
          subtitle: string;
          author: string;
          page_name: string;
          content_url: string | null;
          image_path: string | null;
          html_content: string | null;
          reload_on_enter: boolean;
          viewport_width: number;
          viewport_height: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          presentation_id: string;
          template: Database["public"]["Enums"]["slide_template"];
          sort_order?: number;
          title?: string;
          subtitle?: string;
          author?: string;
          page_name?: string;
          content_url?: string | null;
          image_path?: string | null;
          html_content?: string | null;
          reload_on_enter?: boolean;
          viewport_width?: number;
          viewport_height?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          presentation_id?: string;
          template?: Database["public"]["Enums"]["slide_template"];
          sort_order?: number;
          title?: string;
          subtitle?: string;
          author?: string;
          page_name?: string;
          content_url?: string | null;
          image_path?: string | null;
          html_content?: string | null;
          reload_on_enter?: boolean;
          viewport_width?: number;
          viewport_height?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "slides_presentation_id_fkey";
            columns: ["presentation_id"];
            isOneToOne: false;
            referencedRelation: "presentations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      reorder_slides: {
        Args: { p_presentation_id: string; p_slide_ids: string[] };
        Returns: undefined;
      };
      owns_slide_image: {
        Args: { object_name: string };
        Returns: boolean;
      };
    };
    Enums: {
      slide_template: "cover" | "content" | "image" | "html";
    };
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
