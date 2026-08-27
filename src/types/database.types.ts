// 이 파일은 `pnpm db:types`가 생성한다. 직접 수정하지 않는다.
// 애플리케이션에서 쓰는 도메인 타입은 src/types/domain.ts에 둔다.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      presentations: {
        Row: {
          brand_color: string;
          cover_tint: number;
          created_at: string;
          footer_text: string;
          id: string;
          is_public: boolean;
          owner_id: string;
          share_id: string;
          show_page_number: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          brand_color?: string;
          cover_tint?: number;
          created_at?: string;
          footer_text?: string;
          id?: string;
          is_public?: boolean;
          owner_id: string;
          share_id?: string;
          show_page_number?: boolean;
          title?: string;
          updated_at?: string;
        };
        Update: {
          brand_color?: string;
          cover_tint?: number;
          created_at?: string;
          footer_text?: string;
          id?: string;
          is_public?: boolean;
          owner_id?: string;
          share_id?: string;
          show_page_number?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      slides: {
        Row: {
          author: string;
          content_url: string | null;
          created_at: string;
          html_content: string | null;
          id: string;
          image_path: string | null;
          page_name: string;
          presentation_id: string;
          reload_on_enter: boolean;
          sort_order: number;
          subtitle: string;
          template: Database["public"]["Enums"]["slide_template"];
          title: string;
          updated_at: string;
          viewport_height: number;
          viewport_width: number;
        };
        Insert: {
          author?: string;
          content_url?: string | null;
          created_at?: string;
          html_content?: string | null;
          id?: string;
          image_path?: string | null;
          page_name?: string;
          presentation_id: string;
          reload_on_enter?: boolean;
          sort_order?: number;
          subtitle?: string;
          template: Database["public"]["Enums"]["slide_template"];
          title?: string;
          updated_at?: string;
          viewport_height?: number;
          viewport_width?: number;
        };
        Update: {
          author?: string;
          content_url?: string | null;
          created_at?: string;
          html_content?: string | null;
          id?: string;
          image_path?: string | null;
          page_name?: string;
          presentation_id?: string;
          reload_on_enter?: boolean;
          sort_order?: number;
          subtitle?: string;
          template?: Database["public"]["Enums"]["slide_template"];
          title?: string;
          updated_at?: string;
          viewport_height?: number;
          viewport_width?: number;
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
    Views: {
      [_ in never]: never;
    };
    Functions: {
      owns_slide_image: { Args: { object_name: string }; Returns: boolean };
      reorder_slides: {
        Args: { p_presentation_id: string; p_slide_ids: string[] };
        Returns: undefined;
      };
    };
    Enums: {
      slide_template: "cover" | "content" | "image" | "html";
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
  public: {
    Enums: {
      slide_template: ["cover", "content", "image", "html"],
    },
  },
} as const;
