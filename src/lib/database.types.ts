// Generated from the Supabase schema (supabase/migrations). Regenerate after schema changes.

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      exercises: {
        Row: { created_at: string; id: string; name: string; user_id: string };
        Insert: { created_at?: string; id?: string; name: string; user_id?: string };
        Update: { created_at?: string; id?: string; name?: string; user_id?: string };
        Relationships: [];
      };
      sets: {
        Row: {
          created_at: string;
          exercise_id: string;
          id: string;
          reps: number;
          user_id: string;
          weight: number;
          workout_id: string;
        };
        Insert: {
          created_at?: string;
          exercise_id: string;
          id?: string;
          reps: number;
          user_id?: string;
          weight: number;
          workout_id: string;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          id?: string;
          reps?: number;
          user_id?: string;
          weight?: number;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sets_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sets_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      workouts: {
        Row: { created_at: string; id: string; notes: string | null; performed_on: string; user_id: string };
        Insert: { created_at?: string; id?: string; notes?: string | null; performed_on?: string; user_id?: string };
        Update: { created_at?: string; id?: string; notes?: string | null; performed_on?: string; user_id?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
