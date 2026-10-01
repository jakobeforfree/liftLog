"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function withParam(path: string, key: string, value: string) {
  return `${path}?${key}=${encodeURIComponent(value)}`;
}

// ---------- Auth ----------

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: field(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect(withParam("/login", "error", error.message));
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email: field(formData, "email"),
    password: String(formData.get("password") ?? ""),
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(withParam("/login", "error", error.message));
  if (!data.session) {
    redirect(withParam("/login", "message", "Check your email to confirm your account, then log in."));
  }
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- Workouts ----------

export async function createWorkout(formData: FormData) {
  const { supabase } = await requireUser();
  const performed_on = field(formData, "performed_on") || undefined;
  const notes = field(formData, "notes") || null;
  const { data, error } = await supabase
    .from("workouts")
    .insert({ performed_on, notes })
    .select("id")
    .single();
  if (error) redirect(withParam("/", "error", error.message));
  revalidatePath("/");
  redirect(`/workouts/${data.id}`);
}

export async function deleteWorkout(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("workouts").delete().eq("id", field(formData, "workout_id"));
  if (error) redirect(withParam("/", "error", error.message));
  revalidatePath("/", "layout");
  redirect("/");
}

/** Adds a set; the exercise is matched by name (case-insensitive) or created if new. */
export async function addSet(formData: FormData) {
  const { supabase } = await requireUser();
  const workoutId = field(formData, "workout_id");
  const back = `/workouts/${workoutId}`;
  const name = field(formData, "exercise_name").replace(/\s+/g, " ");
  const weight = Number(field(formData, "weight"));
  const reps = Number(field(formData, "reps"));

  if (!name) redirect(withParam(back, "error", "Pick or type an exercise."));
  if (!Number.isFinite(weight) || weight < 0 || weight >= 10000)
    redirect(withParam(back, "error", "Weight must be a number between 0 and 9999."));
  if (!Number.isInteger(reps) || reps < 1 || reps > 1000)
    redirect(withParam(back, "error", "Reps must be a whole number between 1 and 1000."));

  const exerciseId = await findOrCreateExercise(name);
  if (!exerciseId) redirect(withParam(back, "error", "Could not save that exercise."));

  const { error } = await supabase
    .from("sets")
    .insert({ workout_id: workoutId, exercise_id: exerciseId, weight, reps });
  if (error) redirect(withParam(back, "error", error.message));
  revalidatePath(back);
  redirect(back);
}

export async function deleteSet(formData: FormData) {
  const { supabase } = await requireUser();
  const back = `/workouts/${field(formData, "workout_id")}`;
  const { error } = await supabase.from("sets").delete().eq("id", field(formData, "set_id"));
  if (error) redirect(withParam(back, "error", error.message));
  revalidatePath(back);
  redirect(back);
}

// ---------- Exercises ----------

async function findOrCreateExercise(name: string): Promise<string | null> {
  const { supabase } = await requireUser();
  const { data: existing } = await supabase.from("exercises").select("id, name");
  const match = existing?.find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (match) return match.id;
  const { data, error } = await supabase.from("exercises").insert({ name }).select("id").single();
  return error ? null : data.id;
}

export async function createExercise(formData: FormData) {
  const name = field(formData, "name").replace(/\s+/g, " ");
  if (!name) redirect(withParam("/exercises", "error", "Enter an exercise name."));
  if (name.length > 80) redirect(withParam("/exercises", "error", "Name must be 80 characters or fewer."));
  const id = await findOrCreateExercise(name);
  if (!id) redirect(withParam("/exercises", "error", "Could not save that exercise."));
  revalidatePath("/exercises");
  redirect("/exercises");
}

export async function deleteExercise(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("exercises").delete().eq("id", field(formData, "exercise_id"));
  if (error) redirect(withParam("/exercises", "error", error.message));
  revalidatePath("/", "layout");
  redirect("/exercises");
}
