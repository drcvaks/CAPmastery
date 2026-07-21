export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
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
        Insert: {
          action: string;
          actor_id?: string | null;
          after_summary?: Json | null;
          before_summary?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          after_summary?: Json | null;
          before_summary?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chapters: {
        Row: {
          code: string;
          course_id: string;
          created_at: string;
          description: string | null;
          id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
          volume_id: string | null;
        };
        Insert: {
          code: string;
          course_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
          volume_id?: string | null;
        };
        Update: {
          code?: string;
          course_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
          volume_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chapters_volume_id_fkey";
            columns: ["volume_id"];
            isOneToOne: false;
            referencedRelation: "volumes";
            referencedColumns: ["id"];
          },
        ];
      };
      concept_objectives: {
        Row: {
          concept_id: string;
          created_at: string;
          learning_objective_id: string;
        };
        Insert: {
          concept_id: string;
          created_at?: string;
          learning_objective_id: string;
        };
        Update: {
          concept_id?: string;
          created_at?: string;
          learning_objective_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concept_objectives_concept_id_fkey";
            columns: ["concept_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concept_objectives_learning_objective_id_fkey";
            columns: ["learning_objective_id"];
            isOneToOne: false;
            referencedRelation: "learning_objectives";
            referencedColumns: ["id"];
          },
        ];
      };
      concept_relationships: {
        Row: {
          concept_id: string;
          created_at: string;
          related_concept_id: string;
          relationship_type: Database["public"]["Enums"]["concept_relationship_type"];
        };
        Insert: {
          concept_id: string;
          created_at?: string;
          related_concept_id: string;
          relationship_type: Database["public"]["Enums"]["concept_relationship_type"];
        };
        Update: {
          concept_id?: string;
          created_at?: string;
          related_concept_id?: string;
          relationship_type?: Database["public"]["Enums"]["concept_relationship_type"];
        };
        Relationships: [
          {
            foreignKeyName: "concept_relationships_concept_id_fkey";
            columns: ["concept_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concept_relationships_related_concept_id_fkey";
            columns: ["related_concept_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id"];
          },
        ];
      };
      concepts: {
        Row: {
          code: string;
          common_confusions: string | null;
          created_at: string;
          deeper_definition: string | null;
          id: string;
          importance_weight: number;
          parent_concept_id: string | null;
          plain_language_definition: string | null;
          sort_order: number;
          source_document_id: string | null;
          source_reference: string | null;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          topic_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          common_confusions?: string | null;
          created_at?: string;
          deeper_definition?: string | null;
          id?: string;
          importance_weight?: number;
          parent_concept_id?: string | null;
          plain_language_definition?: string | null;
          sort_order?: number;
          source_document_id?: string | null;
          source_reference?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          topic_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          common_confusions?: string | null;
          created_at?: string;
          deeper_definition?: string | null;
          id?: string;
          importance_weight?: number;
          parent_concept_id?: string | null;
          plain_language_definition?: string | null;
          sort_order?: number;
          source_document_id?: string | null;
          source_reference?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          topic_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concepts_parent_concept_id_fkey";
            columns: ["parent_concept_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concepts_source_document_id_fkey";
            columns: ["source_document_id"];
            isOneToOne: false;
            referencedRelation: "source_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "concepts_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          exam_id: string;
          id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          exam_id: string;
          id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          exam_id?: string;
          id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
      exams: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          passing_score: number | null;
          program_id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          time_limit_minutes: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          passing_score?: number | null;
          program_id: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          time_limit_minutes?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          passing_score?: number | null;
          program_id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          time_limit_minutes?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exams_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_objective_relationships: {
        Row: {
          created_at: string;
          objective_id: string;
          related_objective_id: string;
          relationship_type: Database["public"]["Enums"]["learning_relationship_type"];
        };
        Insert: {
          created_at?: string;
          objective_id: string;
          related_objective_id: string;
          relationship_type: Database["public"]["Enums"]["learning_relationship_type"];
        };
        Update: {
          created_at?: string;
          objective_id?: string;
          related_objective_id?: string;
          relationship_type?: Database["public"]["Enums"]["learning_relationship_type"];
        };
        Relationships: [
          {
            foreignKeyName: "learning_objective_relationships_objective_id_fkey";
            columns: ["objective_id"];
            isOneToOne: false;
            referencedRelation: "learning_objectives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_objective_relationships_related_objective_id_fkey";
            columns: ["related_objective_id"];
            isOneToOne: false;
            referencedRelation: "learning_objectives";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_objectives: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          importance_weight: number;
          official_objective_number: string | null;
          official_objective_text: string | null;
          sort_order: number;
          source_document_id: string | null;
          source_page_end: number | null;
          source_page_start: number | null;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          topic_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          importance_weight?: number;
          official_objective_number?: string | null;
          official_objective_text?: string | null;
          sort_order?: number;
          source_document_id?: string | null;
          source_page_end?: number | null;
          source_page_start?: number | null;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          topic_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          importance_weight?: number;
          official_objective_number?: string | null;
          official_objective_text?: string | null;
          sort_order?: number;
          source_document_id?: string | null;
          source_page_end?: number | null;
          source_page_start?: number | null;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          topic_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_objectives_source_document_id_fkey";
            columns: ["source_document_id"];
            isOneToOne: false;
            referencedRelation: "source_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_objectives_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
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
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          membership_role: string;
          organization_id: string;
          status?: Database["public"]["Enums"]["membership_status"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          membership_role?: string;
          organization_id?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_memberships_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_memberships_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          organization_type: Database["public"]["Enums"]["organization_type"];
          parent_organization_id?: string | null;
          status?: Database["public"]["Enums"]["organization_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          organization_type?: Database["public"]["Enums"]["organization_type"];
          parent_organization_id?: string | null;
          status?: Database["public"]["Enums"]["organization_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_parent_organization_id_fkey";
            columns: ["parent_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
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
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          status?: Database["public"]["Enums"]["profile_status"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          status?: Database["public"]["Enums"]["profile_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      question_choices: {
        Row: {
          choice_key: string;
          choice_text: string;
          created_at: string;
          id: string;
          question_id: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          choice_key: string;
          choice_text: string;
          created_at?: string;
          id?: string;
          question_id: string;
          sort_order: number;
          updated_at?: string;
        };
        Update: {
          choice_key?: string;
          choice_text?: string;
          created_at?: string;
          id?: string;
          question_id?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_choices_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      question_concepts: {
        Row: {
          concept_id: string;
          created_at: string;
          is_primary: boolean;
          question_id: string;
        };
        Insert: {
          concept_id: string;
          created_at?: string;
          is_primary?: boolean;
          question_id: string;
        };
        Update: {
          concept_id?: string;
          created_at?: string;
          is_primary?: boolean;
          question_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_concepts_concept_id_fkey";
            columns: ["concept_id"];
            isOneToOne: false;
            referencedRelation: "concepts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_concepts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      question_families: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          exam_id: string;
          id: string;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          exam_id: string;
          id?: string;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          exam_id?: string;
          id?: string;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_families_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
      question_quality_reviews: {
        Row: {
          accuracy_rating: number;
          clarity_rating: number;
          created_at: string;
          decision: Database["public"]["Enums"]["review_decision"];
          id: string;
          notes: string | null;
          question_id: string;
          reviewer_id: string;
          source_alignment_rating: number;
        };
        Insert: {
          accuracy_rating: number;
          clarity_rating: number;
          created_at?: string;
          decision: Database["public"]["Enums"]["review_decision"];
          id?: string;
          notes?: string | null;
          question_id: string;
          reviewer_id: string;
          source_alignment_rating: number;
        };
        Update: {
          accuracy_rating?: number;
          clarity_rating?: number;
          created_at?: string;
          decision?: Database["public"]["Enums"]["review_decision"];
          id?: string;
          notes?: string | null;
          question_id?: string;
          reviewer_id?: string;
          source_alignment_rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "question_quality_reviews_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_quality_reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      question_reinforcements: {
        Row: {
          created_at: string;
          question_id: string;
          reinforcement_question_id: string;
        };
        Insert: {
          created_at?: string;
          question_id: string;
          reinforcement_question_id: string;
        };
        Update: {
          created_at?: string;
          question_id?: string;
          reinforcement_question_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_reinforcements_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_reinforcements_reinforcement_question_id_fkey";
            columns: ["reinforcement_question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      question_reports: {
        Row: {
          created_at: string;
          details: string;
          id: string;
          question_id: string;
          report_type: Database["public"]["Enums"]["question_report_type"];
          reporter_id: string;
          resolution_notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database["public"]["Enums"]["question_report_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          details: string;
          id?: string;
          question_id: string;
          report_type: Database["public"]["Enums"]["question_report_type"];
          reporter_id: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["question_report_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          details?: string;
          id?: string;
          question_id?: string;
          report_type?: Database["public"]["Enums"]["question_report_type"];
          reporter_id?: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["question_report_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_reports_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      question_versions: {
        Row: {
          change_reason: string;
          created_at: string;
          created_by: string;
          id: string;
          question_id: string;
          snapshot: Json;
          version: number;
        };
        Insert: {
          change_reason: string;
          created_at?: string;
          created_by: string;
          id?: string;
          question_id: string;
          snapshot: Json;
          version: number;
        };
        Update: {
          change_reason?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          question_id?: string;
          snapshot?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "question_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_versions_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          cognitive_level: Database["public"]["Enums"]["cognitive_level"];
          created_at: string;
          created_by: string;
          difficulty: Database["public"]["Enums"]["question_difficulty"];
          estimated_time_seconds: number | null;
          exam_id: string;
          id: string;
          is_exam_style: boolean;
          learning_objective_id: string | null;
          purpose: Database["public"]["Enums"]["question_purpose"] | null;
          question_family_id: string | null;
          question_text: string;
          question_type: Database["public"]["Enums"]["question_type"];
          review_status: Database["public"]["Enums"]["question_review_status"];
          source_document_id: string | null;
          source_page_end: number | null;
          source_page_start: number | null;
          source_reference: string | null;
          status: Database["public"]["Enums"]["content_status"];
          topic_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          cognitive_level: Database["public"]["Enums"]["cognitive_level"];
          created_at?: string;
          created_by: string;
          difficulty: Database["public"]["Enums"]["question_difficulty"];
          estimated_time_seconds?: number | null;
          exam_id: string;
          id?: string;
          is_exam_style?: boolean;
          learning_objective_id?: string | null;
          purpose?: Database["public"]["Enums"]["question_purpose"] | null;
          question_family_id?: string | null;
          question_text: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          review_status?: Database["public"]["Enums"]["question_review_status"];
          source_document_id?: string | null;
          source_page_end?: number | null;
          source_page_start?: number | null;
          source_reference?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          topic_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          cognitive_level?: Database["public"]["Enums"]["cognitive_level"];
          created_at?: string;
          created_by?: string;
          difficulty?: Database["public"]["Enums"]["question_difficulty"];
          estimated_time_seconds?: number | null;
          exam_id?: string;
          id?: string;
          is_exam_style?: boolean;
          learning_objective_id?: string | null;
          purpose?: Database["public"]["Enums"]["question_purpose"] | null;
          question_family_id?: string | null;
          question_text?: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          review_status?: Database["public"]["Enums"]["question_review_status"];
          source_document_id?: string | null;
          source_page_end?: number | null;
          source_page_start?: number | null;
          source_reference?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          topic_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "questions_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_learning_objective_id_fkey";
            columns: ["learning_objective_id"];
            isOneToOne: false;
            referencedRelation: "learning_objectives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_question_family_id_fkey";
            columns: ["question_family_id"];
            isOneToOne: false;
            referencedRelation: "question_families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_source_document_id_fkey";
            columns: ["source_document_id"];
            isOneToOne: false;
            referencedRelation: "source_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      sections: {
        Row: {
          chapter_id: string;
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          parent_section_id: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          chapter_id: string;
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          parent_section_id?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          chapter_id?: string;
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          parent_section_id?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sections_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sections_parent_section_id_fkey";
            columns: ["parent_section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
        ];
      };
      source_documents: {
        Row: {
          authorization_status: Database["public"]["Enums"]["source_authorization_status"];
          created_at: string;
          created_by: string;
          document_type: string;
          edition: string | null;
          external_reference: string | null;
          id: string;
          publication_date: string | null;
          status: Database["public"]["Enums"]["content_status"];
          storage_path: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          authorization_status?: Database["public"]["Enums"]["source_authorization_status"];
          created_at?: string;
          created_by: string;
          document_type: string;
          edition?: string | null;
          external_reference?: string | null;
          id?: string;
          publication_date?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          storage_path?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          authorization_status?: Database["public"]["Enums"]["source_authorization_status"];
          created_at?: string;
          created_by?: string;
          document_type?: string;
          edition?: string | null;
          external_reference?: string | null;
          id?: string;
          publication_date?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          storage_path?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_documents_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Insert: {
          can_assign_content?: boolean;
          can_manage_challenges?: boolean;
          can_view_progress?: boolean;
          created_at?: string;
          created_by: string;
          guardian_id: string;
          id?: string;
          relationship_type: string;
          status?: Database["public"]["Enums"]["relationship_status"];
          student_id: string;
          updated_at?: string;
        };
        Update: {
          can_assign_content?: boolean;
          can_manage_challenges?: boolean;
          can_view_progress?: boolean;
          created_at?: string;
          created_by?: string;
          guardian_id?: string;
          id?: string;
          relationship_type?: string;
          status?: Database["public"]["Enums"]["relationship_status"];
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_guardian_links_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_guardian_links_guardian_id_fkey";
            columns: ["guardian_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_guardian_links_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      topics: {
        Row: {
          chapter_id: string | null;
          code: string;
          course_id: string | null;
          created_at: string;
          description: string | null;
          exam_id: string;
          id: string;
          section_id: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
          volume_id: string | null;
        };
        Insert: {
          chapter_id?: string | null;
          code: string;
          course_id?: string | null;
          created_at?: string;
          description?: string | null;
          exam_id: string;
          id?: string;
          section_id?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
          volume_id?: string | null;
        };
        Update: {
          chapter_id?: string | null;
          code?: string;
          course_id?: string | null;
          created_at?: string;
          description?: string | null;
          exam_id?: string;
          id?: string;
          section_id?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
          volume_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topics_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topics_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topics_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topics_volume_id_fkey";
            columns: ["volume_id"];
            isOneToOne: false;
            referencedRelation: "volumes";
            referencedColumns: ["id"];
          },
        ];
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
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          scope_id?: string | null;
          scope_type?: Database["public"]["Enums"]["role_scope_type"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          scope_id?: string | null;
          scope_type?: Database["public"]["Enums"]["role_scope_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_scope_id_fkey";
            columns: ["scope_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      volumes: {
        Row: {
          code: string;
          course_id: string;
          created_at: string;
          description: string | null;
          edition: string | null;
          id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          course_id: string;
          created_at?: string;
          description?: string | null;
          edition?: string | null;
          id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          course_id?: string;
          created_at?: string;
          description?: string | null;
          edition?: string | null;
          id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "volumes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
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
          p_scope_id?: string;
          p_scope_type?: Database["public"]["Enums"]["role_scope_type"];
          p_user_id: string;
        };
        Returns: undefined;
      };
      get_approved_questions: {
        Args: { p_exam_id: string; p_limit?: number; p_topic_id?: string };
        Returns: {
          choices: Json;
          cognitive_level: Database["public"]["Enums"]["cognitive_level"];
          difficulty: Database["public"]["Enums"]["question_difficulty"];
          exam_id: string;
          id: string;
          question_text: string;
          question_type: Database["public"]["Enums"]["question_type"];
          source_reference: string;
          topic_id: string;
        }[];
      };
      reviewer_approve_question: {
        Args: { p_question_id: string };
        Returns: undefined;
      };
      reviewer_set_choice_feedback: {
        Args: { p_choice_id: string; p_feedback_text: string };
        Returns: undefined;
      };
      reviewer_set_question_answer: {
        Args: {
          p_common_mistake?: string;
          p_correct_choice_id: string;
          p_explanation: string;
          p_question_id: string;
          p_remediation?: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "student" | "parent" | "coach" | "content_reviewer" | "squadron_leader" | "admin";
      cognitive_level: "recall" | "understanding" | "application" | "scenario";
      concept_relationship_type:
        | "supports"
        | "requires"
        | "expresses"
        | "guides"
        | "contrasts_with"
        | "is_example_of"
        | "develops"
        | "influences"
        | "prerequisite_for"
        | "reinforces";
      content_status: "draft" | "active" | "archived";
      learning_relationship_type: "prerequisite" | "related";
      membership_status: "active" | "inactive";
      organization_status: "active" | "inactive";
      organization_type: "family" | "squadron" | "group";
      profile_status: "active" | "disabled";
      question_difficulty: "easy" | "medium" | "hard";
      question_purpose:
        | "recall"
        | "recognition"
        | "understanding"
        | "application"
        | "scenario_judgment"
        | "analysis"
        | "misconception_check"
        | "reinforcement"
        | "retention_check";
      question_report_status: "open" | "reviewing" | "resolved" | "dismissed";
      question_report_type:
        | "unclear_wording"
        | "incorrect_answer"
        | "poor_explanation"
        | "source_mismatch"
        | "formatting_problem"
        | "other";
      question_review_status: "draft" | "in_review" | "approved" | "rejected" | "archived";
      question_type: "multiple_choice" | "true_false";
      relationship_status: "active" | "inactive";
      review_decision: "approve" | "request_changes" | "reject";
      role_scope_type: "global" | "organization";
      source_authorization_status: "pending" | "approved" | "restricted" | "rejected";
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
      app_role: ["student", "parent", "coach", "content_reviewer", "squadron_leader", "admin"],
      cognitive_level: ["recall", "understanding", "application", "scenario"],
      concept_relationship_type: [
        "supports",
        "requires",
        "expresses",
        "guides",
        "contrasts_with",
        "is_example_of",
        "develops",
        "influences",
        "prerequisite_for",
        "reinforces",
      ],
      content_status: ["draft", "active", "archived"],
      learning_relationship_type: ["prerequisite", "related"],
      membership_status: ["active", "inactive"],
      organization_status: ["active", "inactive"],
      organization_type: ["family", "squadron", "group"],
      profile_status: ["active", "disabled"],
      question_difficulty: ["easy", "medium", "hard"],
      question_purpose: [
        "recall",
        "recognition",
        "understanding",
        "application",
        "scenario_judgment",
        "analysis",
        "misconception_check",
        "reinforcement",
        "retention_check",
      ],
      question_report_status: ["open", "reviewing", "resolved", "dismissed"],
      question_report_type: [
        "unclear_wording",
        "incorrect_answer",
        "poor_explanation",
        "source_mismatch",
        "formatting_problem",
        "other",
      ],
      question_review_status: ["draft", "in_review", "approved", "rejected", "archived"],
      question_type: ["multiple_choice", "true_false"],
      relationship_status: ["active", "inactive"],
      review_decision: ["approve", "request_changes", "reject"],
      role_scope_type: ["global", "organization"],
      source_authorization_status: ["pending", "approved", "restricted", "rejected"],
    },
  },
} as const;
