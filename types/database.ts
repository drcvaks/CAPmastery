export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          after_summary: Json | null;
          before_summary: Json | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      organization_memberships: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          membership_role: string;
          organization_id: string;
          status: Database["public"]["Enums"]["membership_status"];
          user_id: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          organization_type: Database["public"]["Enums"]["organization_type"];
          parent_organization_id: string | null;
          status: Database["public"]["Enums"]["organization_status"];
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          status: Database["public"]["Enums"]["profile_status"];
          updated_at: string;
        };
        Insert: never;
        Update: {
          avatar_url?: string | null;
          display_name?: string;
          first_name?: string | null;
          last_name?: string | null;
        };
        Relationships: [];
      };
      student_guardian_links: {
        Row: {
          can_assign_content: boolean;
          can_manage_challenges: boolean;
          can_view_progress: boolean;
          created_at: string;
          created_by: string;
          guardian_id: string;
          id: string;
          relationship_type: string;
          status: Database["public"]["Enums"]["relationship_status"];
          student_id: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          scope_id: string | null;
          scope_type: Database["public"]["Enums"]["role_scope_type"];
          user_id: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_set_guardian_link: {
        Args: {
          p_can_assign_content?: boolean;
          p_can_manage_challenges?: boolean;
          p_can_view_progress?: boolean;
          p_guardian_id: string;
          p_relationship_type: string;
          p_status: Database["public"]["Enums"]["relationship_status"];
          p_student_id: string;
        };
        Returns: string;
      };
      admin_set_user_role: {
        Args: {
          p_enabled: boolean;
          p_role: Database["public"]["Enums"]["app_role"];
          p_scope_id?: string | null;
          p_scope_type?: Database["public"]["Enums"]["role_scope_type"];
          p_user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "student" | "parent" | "coach" | "content_reviewer" | "squadron_leader" | "admin";
      membership_status: "active" | "inactive";
      organization_status: "active" | "inactive";
      organization_type: "family" | "squadron" | "group";
      profile_status: "active" | "disabled";
      relationship_status: "active" | "inactive";
      role_scope_type: "global" | "organization";
    };
    CompositeTypes: Record<string, never>;
  };
};
