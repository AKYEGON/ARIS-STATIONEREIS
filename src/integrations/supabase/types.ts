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
      customer_testimonials: {
        Row: {
          average_view_duration: number | null
          completed_views: number | null
          completion_rate: number | null
          created_at: string | null
          customer_name: string
          customer_photo: string
          display_order: number | null
          engagement_score: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          last_viewed_at: string | null
          product_name: string | null
          rating: number
          review_text: string
          video_url: string | null
          views: number | null
        }
        Insert: {
          average_view_duration?: number | null
          completed_views?: number | null
          completion_rate?: number | null
          created_at?: string | null
          customer_name: string
          customer_photo: string
          display_order?: number | null
          engagement_score?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          last_viewed_at?: string | null
          product_name?: string | null
          rating: number
          review_text: string
          video_url?: string | null
          views?: number | null
        }
        Update: {
          average_view_duration?: number | null
          completed_views?: number | null
          completion_rate?: number | null
          created_at?: string | null
          customer_name?: string
          customer_photo?: string
          display_order?: number | null
          engagement_score?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          last_viewed_at?: string | null
          product_name?: string | null
          rating?: number
          review_text?: string
          video_url?: string | null
          views?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cost_price: number | null
          created_at: string
          id: string
          order_id: string
          price: number
          product_image: string
          product_name: string
          profit: number | null
          quantity: number
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_image: string
          product_name: string
          profit?: number | null
          quantity: number
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_image?: string
          product_name?: string
          profit?: number | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          discount_amount: number | null
          discount_type: string | null
          id: string
          original_total: number | null
          profit: number | null
          status: string
          subtotal: number | null
          tags: string[] | null
          total: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          discount_amount?: number | null
          discount_type?: string | null
          id?: string
          original_total?: number | null
          profit?: number | null
          status?: string
          subtotal?: number | null
          tags?: string[] | null
          total: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          discount_amount?: number | null
          discount_type?: string | null
          id?: string
          original_total?: number | null
          profit?: number | null
          status?: string
          subtotal?: number | null
          tags?: string[] | null
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_media: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          media_type: string
          media_url: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          media_type: string
          media_url: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          media_type?: string
          media_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          image: string
          name: string
          original_price: number | null
          price: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          category: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image: string
          name: string
          original_price?: number | null
          price: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string
          name?: string
          original_price?: number | null
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          change: number
          created_at: string
          id: string
          notes: string | null
          product_id: string
          reason: string
        }
        Insert: {
          change: number
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          reason: string
        }
        Update: {
          change?: number
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          completed: boolean | null
          id: string
          testimonial_id: string
          user_session_id: string | null
          view_duration: number | null
          viewed_at: string | null
        }
        Insert: {
          completed?: boolean | null
          id?: string
          testimonial_id: string
          user_session_id?: string | null
          view_duration?: number | null
          viewed_at?: string | null
        }
        Update: {
          completed?: boolean | null
          id?: string
          testimonial_id?: string
          user_session_id?: string | null
          view_duration?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_views_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "customer_testimonials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonial_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      testimonial_performance: {
        Row: {
          average_view_duration: number | null
          completed_views: number | null
          completion_rate_calc: number | null
          created_at: string | null
          customer_name: string | null
          engagement_score: number | null
          id: string | null
          last_viewed_at: string | null
          product_name: string | null
          views: number | null
        }
        Insert: {
          average_view_duration?: number | null
          completed_views?: number | null
          completion_rate_calc?: never
          created_at?: string | null
          customer_name?: string | null
          engagement_score?: number | null
          id?: string | null
          last_viewed_at?: string | null
          product_name?: string | null
          views?: number | null
        }
        Update: {
          average_view_duration?: number | null
          completed_views?: number | null
          completion_rate_calc?: never
          created_at?: string | null
          customer_name?: string | null
          engagement_score?: number | null
          id?: string | null
          last_viewed_at?: string | null
          product_name?: string | null
          views?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      adjust_stock: {
        Args: {
          p_change: number
          p_notes?: string
          p_product_id: string
          p_reason: string
        }
        Returns: undefined
      }
      calculate_product_profit: {
        Args: { product_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_testimonial_view: {
        Args: { is_completed?: boolean; testimonial_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
