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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      audit_logs: {
        Row: {
          changes: Json | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          event_time: string | null
          event_type: string
          id: number
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          changes?: Json | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_time?: string | null
          event_type: string
          id?: number
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          changes?: Json | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_time?: string | null
          event_type?: string
          id?: number
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
        }
        Relationships: []
      }
      customer_skills: {
        Row: {
          created_at: string | null
          customer_id: number | null
          id: number
          skill_id: number | null
          utilization_level: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: number | null
          id?: number
          skill_id?: number | null
          utilization_level?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: number | null
          id?: number
          skill_id?: number | null
          utilization_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_skills_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_users: {
        Row: {
          created_at: string | null
          customer_id: number | null
          id: number
          role_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: number | null
          id?: number
          role_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: number | null
          id?: number
          role_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_users_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "customer_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          description: string | null
          extended_data: Json | null
          id: number
          industry: string | null
          industry_id: number | null
          logo_url: string | null
          name: string
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          extended_data?: Json | null
          id?: number
          industry?: string | null
          industry_id?: number | null
          logo_url?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          extended_data?: Json | null
          id?: number
          industry?: string | null
          industry_id?: number | null
          logo_url?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          extended_data: Json | null
          first_name: string
          id: string
          last_name: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          extended_data?: Json | null
          first_name?: string
          id: string
          last_name?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          extended_data?: Json | null
          first_name?: string
          id?: string
          last_name?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_applications: {
        Row: {
          created_at: string | null
          customer_id: number
          end_date: string | null
          id: number
          notes: string | null
          proficiency: string
          skill_id: number
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: number
          end_date?: string | null
          id?: number
          notes?: string | null
          proficiency: string
          skill_id: number
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: number
          end_date?: string | null
          id?: number
          notes?: string | null
          proficiency?: string
          skill_id?: number
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_applications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_applications_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      skill_customers: {
        Row: {
          application_level: string | null
          created_at: string | null
          customer_id: number | null
          id: number
          is_active: boolean | null
          skill_id: number | null
        }
        Insert: {
          application_level?: string | null
          created_at?: string | null
          customer_id?: number | null
          id?: number
          is_active?: boolean | null
          skill_id?: number | null
        }
        Update: {
          application_level?: string | null
          created_at?: string | null
          customer_id?: number | null
          id?: number
          is_active?: boolean | null
          skill_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_customers_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_users: {
        Row: {
          created_at: string | null
          id: number
          proficiency_display: string | null
          skill_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          proficiency_display?: string | null
          skill_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          proficiency_display?: string | null
          skill_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_users_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          category_id: number | null
          created_at: string | null
          description: string | null
          extended_data: Json | null
          id: number
          name: string
          proficiency_levels: string[] | null
          svg_icon: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          extended_data?: Json | null
          id?: number
          name: string
          proficiency_levels?: string[] | null
          svg_icon?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          extended_data?: Json | null
          id?: number
          name?: string
          proficiency_levels?: string[] | null
          svg_icon?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_customers: {
        Row: {
          created_at: string | null
          customer_id: number | null
          end_date: string | null
          id: number
          role_id: number
          start_date: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: number | null
          end_date?: string | null
          id?: number
          role_id: number
          start_date?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: number | null
          end_date?: string | null
          id?: number
          role_id?: number
          start_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_customers_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "customer_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          created_at: string | null
          id: number
          proficiency_level: string | null
          skill_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          proficiency_level?: string | null
          skill_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          proficiency_level?: string | null
          skill_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      skill_application_view: {
        Row: {
          created_at: string | null
          customer_id: number | null
          customer_name: string | null
          end_date: string | null
          id: number | null
          notes: string | null
          proficiency: string | null
          skill_id: number | null
          skill_name: string | null
          start_date: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_applications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_applications_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_applications_view: {
        Row: {
          created_at: string | null
          customer_id: number | null
          customer_name: string | null
          end_date: string | null
          id: number | null
          notes: string | null
          proficiency: string | null
          skill_id: number | null
          skill_name: string | null
          start_date: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_applications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_applications_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_applications_with_relations: {
        Row: {
          created_at: string | null
          customer_id: number | null
          customer_name: string | null
          end_date: string | null
          id: number | null
          notes: string | null
          proficiency: string | null
          skill_id: number | null
          skill_name: string | null
          start_date: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_applications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_applications_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      find_skill_application_logs: {
        Args: Record<PropertyKey, never>
        Returns: {
          changes: Json | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          event_time: string | null
          event_type: string
          id: number
          metadata: Json | null
          user_id: string | null
        }[]
      }
      get_customer_skill_applications: {
        Args: {
          p_customer_id: number
        }
        Returns: Json[]
      }
      get_user_skill_applications: {
        Args: {
          p_user_id: string
        }
        Returns: Json[]
      }
      test_audit_log: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

