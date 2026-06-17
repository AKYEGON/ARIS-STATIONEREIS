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
      agent_zone_assignments: {
        Row: {
          created_at: string
          id: string
          user_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_zone_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "agent_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_zones: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      bogo_offers: {
        Row: {
          buy_quantity: number
          created_at: string
          display_order: number
          ends_at: string | null
          free_product_id: string | null
          get_quantity: number
          id: string
          is_active: boolean
          name: string
          product_id: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          buy_quantity?: number
          created_at?: string
          display_order?: number
          ends_at?: string | null
          free_product_id?: string | null
          get_quantity?: number
          id?: string
          is_active?: boolean
          name: string
          product_id: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          buy_quantity?: number
          created_at?: string
          display_order?: number
          ends_at?: string | null
          free_product_id?: string | null
          get_quantity?: number
          id?: string
          is_active?: boolean
          name?: string
          product_id?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          bundle_price: number
          created_at: string
          description: string | null
          display_order: number
          id: string
          image: string
          is_active: boolean
          name: string
          original_total_price: number
          updated_at: string
        }
        Insert: {
          bundle_price: number
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image: string
          is_active?: boolean
          name: string
          original_total_price: number
          updated_at?: string
        }
        Update: {
          bundle_price?: number
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image?: string
          is_active?: boolean
          name?: string
          original_total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      campus_branches: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          university_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          university_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_branches_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      course_bundle_items: {
        Row: {
          course_bundle_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          course_bundle_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          course_bundle_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_bundle_items_course_bundle_id_fkey"
            columns: ["course_bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bundle_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      course_bundles: {
        Row: {
          bundle_price: number
          course_id: string
          course_year_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image: string
          is_active: boolean
          name: string
          original_total_price: number
          updated_at: string
        }
        Insert: {
          bundle_price: number
          course_id: string
          course_year_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image: string
          is_active?: boolean
          name: string
          original_total_price: number
          updated_at?: string
        }
        Update: {
          bundle_price?: number
          course_id?: string
          course_year_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image?: string
          is_active?: boolean
          name?: string
          original_total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_bundles_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bundles_course_year_id_fkey"
            columns: ["course_year_id"]
            isOneToOne: false
            referencedRelation: "course_years"
            referencedColumns: ["id"]
          },
        ]
      }
      course_product_years: {
        Row: {
          course_product_id: string
          course_year_id: string
          created_at: string
          id: string
        }
        Insert: {
          course_product_id: string
          course_year_id: string
          created_at?: string
          id?: string
        }
        Update: {
          course_product_id?: string
          course_year_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      course_products: {
        Row: {
          course_id: string
          created_at: string
          display_order: number
          id: string
          product_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_products_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      course_years: {
        Row: {
          course_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          label: string
        }
        Insert: {
          course_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
        }
        Update: {
          course_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          faculty_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          faculty_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          faculty_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_testimonials: {
        Row: {
          average_view_duration: number | null
          completed_views: number | null
          completion_rate: number | null
          created_at: string | null
          customer_name: string
          customer_photo: string | null
          display_order: number | null
          engagement_score: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          is_verified_purchase: boolean
          last_viewed_at: string | null
          order_id: string | null
          product_id: string | null
          product_name: string | null
          rating: number
          review_text: string
          review_token: string | null
          video_url: string | null
          views: number | null
        }
        Insert: {
          average_view_duration?: number | null
          completed_views?: number | null
          completion_rate?: number | null
          created_at?: string | null
          customer_name: string
          customer_photo?: string | null
          display_order?: number | null
          engagement_score?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          is_verified_purchase?: boolean
          last_viewed_at?: string | null
          order_id?: string | null
          product_id?: string | null
          product_name?: string | null
          rating: number
          review_text: string
          review_token?: string | null
          video_url?: string | null
          views?: number | null
        }
        Update: {
          average_view_duration?: number | null
          completed_views?: number | null
          completion_rate?: number | null
          created_at?: string | null
          customer_name?: string
          customer_photo?: string | null
          display_order?: number | null
          engagement_score?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          is_verified_purchase?: boolean
          last_viewed_at?: string | null
          order_id?: string | null
          product_id?: string | null
          product_name?: string | null
          rating?: number
          review_text?: string
          review_token?: string | null
          video_url?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_testimonials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_testimonials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      faculties: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          channel: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          template: string
          trigger_status: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template: string
          trigger_status?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template?: string
          trigger_status?: string | null
        }
        Relationships: []
      }
      order_communications: {
        Row: {
          channel: string
          created_at: string | null
          created_by: string | null
          id: string
          message: string | null
          order_id: string
          status_at_time: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          message?: string | null
          order_id: string
          status_at_time?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          message?: string | null
          order_id?: string
          status_at_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_communications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          agent_zone_id: string | null
          completed_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          discount_amount: number | null
          discount_type: string | null
          follow_up_at: string | null
          id: string
          internal_notes: string | null
          last_contacted_at: string | null
          original_total: number | null
          priority: string | null
          profit: number | null
          status: string
          subtotal: number | null
          tags: string[] | null
          total: number
          updated_at: string
        }
        Insert: {
          agent_zone_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          discount_amount?: number | null
          discount_type?: string | null
          follow_up_at?: string | null
          id?: string
          internal_notes?: string | null
          last_contacted_at?: string | null
          original_total?: number | null
          priority?: string | null
          profit?: number | null
          status?: string
          subtotal?: number | null
          tags?: string[] | null
          total: number
          updated_at?: string
        }
        Update: {
          agent_zone_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          discount_amount?: number | null
          discount_type?: string | null
          follow_up_at?: string | null
          id?: string
          internal_notes?: string | null
          last_contacted_at?: string | null
          original_total?: number | null
          priority?: string | null
          profit?: number | null
          status?: string
          subtotal?: number | null
          tags?: string[] | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_agent_zone_id_fkey"
            columns: ["agent_zone_id"]
            isOneToOne: false
            referencedRelation: "agent_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_outlets: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          location: string | null
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_category_assignments: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_category_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      product_variants: {
        Row: {
          cost_price: number | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          price: number
          product_id: string
          sku: string | null
          stock: number | null
          updated_at: string
          variant_type: string
          variant_value: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          price: number
          product_id: string
          sku?: string | null
          stock?: number | null
          updated_at?: string
          variant_type: string
          variant_value: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          price?: number
          product_id?: string
          sku?: string | null
          stock?: number | null
          updated_at?: string
          variant_type?: string
          variant_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
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
          display_order: number
          id: string
          image: string
          is_common: boolean
          is_featured: boolean
          name: string
          original_price: number | null
          price: number
          sale_ends_at: string | null
          sale_starts_at: string | null
          slug: string
          stock: number | null
          updated_at: string
        }
        Insert: {
          category: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image: string
          is_common?: boolean
          is_featured?: boolean
          name: string
          original_price?: number | null
          price: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          slug: string
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image?: string
          is_common?: boolean
          is_featured?: boolean
          name?: string
          original_price?: number | null
          price?: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          slug?: string
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          order_id: string
          product_id: string
          sent_at: string | null
          sent_via: string | null
          status: string
          submitted_at: string | null
          testimonial_id: string | null
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          order_id: string
          product_id: string
          sent_at?: string | null
          sent_via?: string | null
          status?: string
          submitted_at?: string | null
          testimonial_id?: string | null
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          order_id?: string
          product_id?: string
          sent_at?: string | null
          sent_via?: string | null
          status?: string
          submitted_at?: string | null
          testimonial_id?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "customer_testimonials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonial_performance"
            referencedColumns: ["id"]
          },
        ]
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
      universities: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
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
      year_template_items: {
        Row: {
          created_at: string
          display_order: number
          id: string
          label: string
          template_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          label: string
          template_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "year_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "year_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      year_templates: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
      adjust_variant_stock: {
        Args: {
          p_change: number
          p_notes?: string
          p_reason: string
          p_variant_id: string
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
      slugify: { Args: { input: string }; Returns: string }
      submit_review_by_token: {
        Args: {
          p_customer_name: string
          p_customer_photo?: string
          p_rating: number
          p_review_text: string
          p_token: string
          p_video_url?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "employee" | "manager" | "agent"
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
      app_role: ["admin", "user", "employee", "manager", "agent"],
    },
  },
} as const
