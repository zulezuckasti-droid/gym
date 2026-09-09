import { createClient } from "@/lib/supabase/server";

export type ExerciseRow = {
  id: string;
  name: string;
  muscle_group: string;
  type: string;
  is_custom: boolean;
  is_archived: boolean;
};

export type TemplateListItem = {
  id: string;
  name: string;
  position: number;
  exerciseCount: number;
};

export type TemplateExerciseRow = {
  id: string;
  exerciseId: string;
  name: string;
  position: number;
  targetSets: number;
};

export type TemplateDetail = {
  id: string;
  name: string;
  position: number;
  exercises: TemplateExerciseRow[];
};

export async function ensureDefaultExercises(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("seed_default_exercises");
  return { error: error?.message ?? null };
}

export async function getExercises(): Promise<{
  exercises: ExerciseRow[];
  error: string | null;
}> {
  const seeded = await ensureDefaultExercises();
  if (seeded.error) {
    return { exercises: [], error: seeded.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, type, is_custom, is_archived")
    .eq("is_archived", false)
    .order("muscle_group")
    .order("name");

  if (error) {
    return { exercises: [], error: error.message };
  }

  return { exercises: (data ?? []) as ExerciseRow[], error: null };
}

export async function getExerciseById(
  id: string,
): Promise<{ exercise: ExerciseRow | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, type, is_custom, is_archived")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { exercise: null, error: error.message };
  }

  return { exercise: (data as ExerciseRow | null) ?? null, error: null };
}

export async function getTemplatesList(): Promise<{
  templates: TemplateListItem[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("templates")
    .select(
      `
      id,
      name,
      position,
      template_exercises ( id )
    `,
    )
    .eq("is_archived", false)
    .order("position");

  if (error) {
    return { templates: [], error: error.message };
  }

  return {
    templates: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      position: row.position,
      exerciseCount: row.template_exercises?.length ?? 0,
    })),
    error: null,
  };
}

export async function getTemplateById(
  id: string,
): Promise<{ template: TemplateDetail | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select(
      `
      id,
      name,
      position,
      template_exercises (
        id,
        exercise_id,
        position,
        target_sets,
        exercises ( name )
      )
    `,
    )
    .eq("id", id)
    .eq("is_archived", false)
    .maybeSingle();

  if (error) {
    return { template: null, error: error.message };
  }
  if (!data) {
    return { template: null, error: null };
  }

  const exercises = (data.template_exercises ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      id: item.id,
      exerciseId: item.exercise_id,
      name: item.exercises?.name ?? "Exercise",
      position: item.position,
      targetSets: item.target_sets,
    }));

  return {
    template: {
      id: data.id,
      name: data.name,
      position: data.position,
      exercises,
    },
    error: null,
  };
}
