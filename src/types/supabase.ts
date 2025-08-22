export type Json = string | number | boolean | null | {
  [key: string]: Json | undefined;
} | Json[];
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  graphql_public: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
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
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          id: string;
          name: string | null;
          settings: Json | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          id: string;
          name?: string | null;
          settings?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          settings?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          priority: boolean | null;
          status: string;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          priority?: boolean | null;
          status: string;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          priority?: boolean | null;
          status?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};