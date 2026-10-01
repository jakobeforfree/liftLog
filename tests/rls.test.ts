// Integration test against the real Supabase project: proves row-level security isolates users.
// Runs only when E2E_PASSWORD is set (two confirmed users: e2e-a@liftlog.test, e2e-b@liftlog.test).
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const password = process.env.E2E_PASSWORD;

const client = () => createClient<Database>(url, key, { auth: { persistSession: false } });

describe.skipIf(!password)("row-level security", () => {
  let a: ReturnType<typeof client>;
  let b: ReturnType<typeof client>;
  let anon: ReturnType<typeof client>;
  let workoutId = "";
  let exerciseId = "";

  beforeAll(async () => {
    [a, b, anon] = [client(), client(), client()];
    for (const [c, email] of [[a, "e2e-a@liftlog.test"], [b, "e2e-b@liftlog.test"]] as const) {
      const { error } = await c.auth.signInWithPassword({ email, password: password! });
      if (error) throw error;
    }
    const w = await a.from("workouts").insert({ notes: "rls-test" }).select("id").single();
    const e = await a.from("exercises").insert({ name: `RLS Test ${Date.now()}` }).select("id").single();
    workoutId = w.data!.id;
    exerciseId = e.data!.id;
    const s = await a.from("sets").insert({ workout_id: workoutId, exercise_id: exerciseId, weight: 100, reps: 5 });
    expect(s.error).toBeNull();
  });

  afterAll(async () => {
    await a.from("workouts").delete().eq("id", workoutId);
    await a.from("exercises").delete().eq("id", exerciseId);
  });

  it("owner can read their own rows", async () => {
    const { data } = await a.from("sets").select("id").eq("workout_id", workoutId);
    expect(data).toHaveLength(1);
  });

  it("another user cannot read them", async () => {
    expect((await b.from("workouts").select("id").eq("id", workoutId)).data).toEqual([]);
    expect((await b.from("exercises").select("id").eq("id", exerciseId)).data).toEqual([]);
    expect((await b.from("sets").select("id").eq("workout_id", workoutId)).data).toEqual([]);
  });

  it("another user cannot update or delete them", async () => {
    await b.from("workouts").update({ notes: "hacked" }).eq("id", workoutId);
    await b.from("sets").delete().eq("workout_id", workoutId);
    const { data } = await a.from("workouts").select("notes, sets(id)").eq("id", workoutId).single();
    expect(data?.notes).toBe("rls-test");
    expect(data?.sets).toHaveLength(1);
  });

  it("another user cannot attach sets to someone else's workout", async () => {
    const own = await b.from("exercises").insert({ name: `B ${Date.now()}` }).select("id").single();
    const { error } = await b.from("sets").insert({ workout_id: workoutId, exercise_id: own.data!.id, weight: 1, reps: 1 });
    expect(error?.code).toBe("42501");
    await b.from("exercises").delete().eq("id", own.data!.id);
  });

  it("a user cannot create rows owned by someone else", async () => {
    const { data: me } = await a.auth.getUser();
    const { error } = await b.from("workouts").insert({ user_id: me.user!.id });
    expect(error?.code).toBe("42501");
  });

  it("anonymous visitors see nothing and cannot write", async () => {
    const { data } = await anon.from("workouts").select("id");
    expect(data).toEqual([]);
    const { error } = await anon.from("workouts").insert({});
    expect(error).not.toBeNull();
  });

  it("database rejects invalid sets", async () => {
    const bad = await a.from("sets").insert({ workout_id: workoutId, exercise_id: exerciseId, weight: -5, reps: 0 });
    expect(bad.error?.code).toBe("23514");
  });
});
