export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string;
          id: string;
          is_archived: boolean;
          is_custom: boolean;
          muscle_group: string;
          name: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          is_custom?: boolean;
          muscle_group: string;
          name: string;
          type?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          is_custom?: boolean;
          muscle_group?: string;
          name?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      sets: {
        Row: {
          id: string;
          is_warmup: boolean;
          reps: number;
          set_index: number;
          to_failure: boolean;
          user_id: string;
          weight: number | null;
          workout_exercise_id: string;
        };
        Insert: {
          id: string;
          is_warmup?: boolean;
          reps: number;
          set_index: number;
          to_failure?: boolean;
          user_id: string;
          weight?: number | null;
          workout_exercise_id: string;
        };
        Update: {
          id?: string;
          is_warmup?: boolean;
          reps?: number;
          set_index?: number;
          to_failure?: boolean;
          user_id?: string;
          weight?: number | null;
          workout_exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sets_workout_exercise_id_fkey";
            columns: ["workout_exercise_id"];
            isOneToOne: false;
            referencedRelation: "workout_exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      template_exercises: {
        Row: {
          exercise_id: string;
          id: string;
          position: number;
          superset_group: number | null;
          target_sets: number;
          template_id: string;
          user_id: string;
        };
        Insert: {
          exercise_id: string;
          id?: string;
          position: number;
          superset_group?: number | null;
          target_sets: number;
          template_id: string;
          user_id: string;
        };
        Update: {
          exercise_id?: string;
          id?: string;
          position?: number;
          superset_group?: number | null;
          target_sets?: number;
          template_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "template_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "template_exercises_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };
      templates: {
        Row: {
          created_at: string;
          id: string;
          is_archived: boolean;
          name: string;
          position: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          name: string;
          position?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          name?: string;
          position?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_exercises: {
        Row: {
          exercise_id: string;
          id: string;
          is_adhoc: boolean;
          position: number;
          superset_group: number | null;
          user_id: string;
          workout_id: string;
        };
        Insert: {
          exercise_id: string;
          id: string;
          is_adhoc?: boolean;
          position: number;
          superset_group?: number | null;
          user_id: string;
          workout_id: string;
        };
        Update: {
          exercise_id?: string;
          id?: string;
          is_adhoc?: boolean;
          position?: number;
          superset_group?: number | null;
          user_id?: string;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      workouts: {
        Row: {
          created_at: string;
          finished_at: string;
          id: string;
          name: string;
          notes: string | null;
          performed_on: string;
          started_at: string;
          status: string;
          template_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          finished_at: string;
          id: string;
          name: string;
          notes?: string | null;
          performed_on: string;
          started_at: string;
          status?: string;
          template_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          finished_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          performed_on?: string;
          started_at?: string;
          status?: string;
          template_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workouts_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      exercise_last_performance: {
        Row: {
          exercise_id: string | null;
          finished_at: string | null;
          performed_on: string | null;
          reps: number | null;
          set_index: number | null;
          to_failure: boolean | null;
          weight: number | null;
          workout_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      finish_workout: { Args: { payload: Json }; Returns: Json };
      seed_default_exercises: { Args: never; Returns: number };
      seed_default_push_template: { Args: never; Returns: string };
      update_workout_history: { Args: { payload: Json }; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type FinishWorkoutPayload = {
  workout: {
    id: string;
    template_id?: string | null;
    name: string;
    performed_on: string;
    started_at: string;
    finished_at: string;
    notes?: string | null;
  };
  exercises: Array<{
    id: string;
    exercise_id: string;
    position: number;
    superset_group?: number | null;
    is_adhoc?: boolean;
    sets: Array<{
      id: string;
      set_index: number;
      weight?: number | null;
      reps: number;
      is_warmup?: boolean;
      to_failure?: boolean;
    }>;
  }>;
};

export type UpdateWorkoutHistoryPayload = {
  workout_id: string;
  performed_on: string;
  exercises: Array<{
    id: string;
    sets: Array<{
      id: string;
      weight: number | null;
      reps: number;
      is_warmup: boolean;
      to_failure: boolean;
    }>;
  }>;
};
