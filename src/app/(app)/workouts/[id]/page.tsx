import Link from "next/link";
import { notFound } from "next/navigation";
import { addSet, deleteSet, deleteWorkout } from "@/app/actions";
import { Notice, param } from "@/components/Notice";
import { formatDate } from "@/lib/dates";
import { estimate1rm, formatNumber } from "@/lib/progress";
import { requireUser } from "@/lib/supabase/server";

export default async function WorkoutPage({ params, searchParams }: PageProps<"/workouts/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser();

  const [{ data: workout }, { data: exercises }] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, performed_on, notes, sets(id, weight, reps, created_at, exercise_id, exercises(name))")
      .eq("id", id)
      .order("created_at", { referencedTable: "sets", ascending: true })
      .maybeSingle(),
    supabase.from("exercises").select("id, name").order("name"),
  ]);
  if (!workout) notFound();

  // Group sets by exercise, in the order each exercise was first logged.
  const groups = new Map<string, { name: string; sets: typeof workout.sets }>();
  for (const s of workout.sets) {
    const g = groups.get(s.exercise_id) ?? { name: s.exercises?.name ?? "Exercise", sets: [] };
    g.sets.push(s);
    groups.set(s.exercise_id, g);
  }
  // Prefill the form from the last set so repeating a set is one tap.
  const last = workout.sets.at(-1);

  return (
    <>
      <div>
        <Link href="/" className="text-sm text-muted">← All workouts</Link>
        <h1 className="mt-1 text-2xl font-bold">{formatDate(workout.performed_on, { weekday: "long" })}</h1>
        {workout.notes && <p className="text-muted">{workout.notes}</p>}
      </div>

      <Notice error={param(sp, "error")} />

      {/* key resets the uncontrolled inputs to the new defaults after each save */}
      <form key={workout.sets.length} action={addSet} className="card flex flex-col gap-3">
        <input type="hidden" name="workout_id" value={workout.id} />
        <div>
          <label htmlFor="exercise_name" className="label">Exercise</label>
          <input
            id="exercise_name"
            name="exercise_name"
            list="exercise-list"
            required
            maxLength={80}
            autoComplete="off"
            placeholder="e.g. Bench Press"
            defaultValue={last?.exercises?.name ?? ""}
            className="input"
          />
          <datalist id="exercise-list">
            {exercises?.map((e) => <option key={e.id} value={e.name} />)}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="weight" className="label">Weight (lb)</label>
            <input
              id="weight"
              name="weight"
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              max={9999}
              required
              defaultValue={last ? formatNumber(Number(last.weight)) : ""}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="reps" className="label">Reps</label>
            <input
              id="reps"
              name="reps"
              type="number"
              inputMode="numeric"
              step={1}
              min={1}
              max={1000}
              required
              defaultValue={last?.reps ?? ""}
              className="input"
            />
          </div>
        </div>
        <button className="btn">Add set</button>
      </form>

      {groups.size === 0 ? (
        <p className="card text-muted">No sets yet. Add your first set above.</p>
      ) : (
        [...groups.entries()].map(([exerciseId, g]) => (
          <section key={exerciseId} className="card" aria-label={g.name}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-semibold">{g.name}</h2>
              <Link href={`/progress?exercise=${exerciseId}`} className="text-sm text-accent">Progress →</Link>
            </div>
            <ol className="flex flex-col divide-y divide-border">
              {g.sets.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 py-2">
                  <span className="w-6 text-sm text-muted">{i + 1}</span>
                  <span className="flex-1 font-mono tabular-nums">
                    {formatNumber(Number(s.weight))} lb × {s.reps}
                  </span>
                  <span className="text-xs text-muted">e1RM {formatNumber(estimate1rm(Number(s.weight), s.reps))}</span>
                  <form action={deleteSet}>
                    <input type="hidden" name="workout_id" value={workout.id} />
                    <input type="hidden" name="set_id" value={s.id} />
                    <button aria-label={`Delete set ${i + 1}`} className="grid size-9 place-items-center rounded-lg text-muted active:bg-border">
                      ×
                    </button>
                  </form>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-muted">Delete this workout</summary>
        <form action={deleteWorkout} className="mt-2">
          <input type="hidden" name="workout_id" value={workout.id} />
          <button className="btn-ghost w-full border-danger text-danger">Yes, delete workout and its sets</button>
        </form>
      </details>
    </>
  );
}
