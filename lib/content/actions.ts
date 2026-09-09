"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MuscleGroup } from "@/lib/content/constants";

type ActionResult = { error: string | null };

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function createExercise(
  name: string,
  muscleGroup: MuscleGroup,
): Promise<ActionResult & { id?: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Exercise name is required." };
  }

  const userId = await getUserId();
  if (!userId) {
    return { error: "Not authenticated." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      user_id: userId,
      name: trimmed,
      muscle_group: muscleGroup,
      type: "weight_reps",
      is_custom: true,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/exercises");
  revalidatePath("/");
  return { error: null, id: data.id };
}

export async function renameExercise(
  id: string,
  name: string,
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Exercise name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${id}`);
  revalidatePath("/");
  return { error: null };
}

export async function archiveExercise(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .update({ is_archived: true })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/exercises");
  revalidatePath("/");
  revalidatePath("/templates");
  return { error: null };
}

export async function createTemplate(name: string): Promise<
  ActionResult & { id?: string }
> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Template name is required." };
  }

  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) {
    return { error: "Not authenticated." };
  }

  const { data: existing } = await supabase
    .from("templates")
    .select("position")
    .eq("is_archived", false)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = existing ? existing.position + 1 : 0;

  const { data, error } = await supabase
    .from("templates")
    .insert({ user_id: userId, name: trimmed, position })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/templates");
  revalidatePath("/");
  return { error: null, id: data.id };
}

export async function renameTemplate(
  id: string,
  name: string,
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Template name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/templates");
  revalidatePath(`/templates/${id}`);
  revalidatePath("/");
  return { error: null };
}

export async function archiveTemplate(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({ is_archived: true })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/templates");
  revalidatePath("/");
  return { error: null };
}

export async function addExerciseToTemplate(
  templateId: string,
  exerciseId: string,
  targetSets = 3,
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) {
    return { error: "Not authenticated." };
  }

  const { data: existing } = await supabase
    .from("template_exercises")
    .select("id")
    .eq("template_id", templateId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();

  if (existing) {
    return { error: null };
  }

  const { data: last } = await supabase
    .from("template_exercises")
    .select("position")
    .eq("template_id", templateId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = last ? last.position + 1 : 0;

  const { error } = await supabase.from("template_exercises").insert({
    user_id: userId,
    template_id: templateId,
    exercise_id: exerciseId,
    position,
    target_sets: Math.max(1, targetSets),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}`);
  revalidatePath("/");
  return { error: null };
}

export async function removeExerciseFromTemplate(
  templateExerciseId: string,
  templateId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("template_exercises")
    .delete()
    .eq("id", templateExerciseId);

  if (error) {
    return { error: error.message };
  }

  const { data: remaining } = await supabase
    .from("template_exercises")
    .select("id, position")
    .eq("template_id", templateId)
    .order("position");

  for (const [index, row] of (remaining ?? []).entries()) {
    if (row.position !== index) {
      await supabase
        .from("template_exercises")
        .update({ position: index })
        .eq("id", row.id);
    }
  }

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}`);
  revalidatePath("/");
  return { error: null };
}

export async function updateTemplateExerciseSets(
  templateExerciseId: string,
  templateId: string,
  targetSets: number,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("template_exercises")
    .update({ target_sets: Math.max(1, targetSets) })
    .eq("id", templateExerciseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/templates/${templateId}`);
  revalidatePath("/");
  return { error: null };
}
