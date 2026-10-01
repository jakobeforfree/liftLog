import Link from "next/link";
import { createExercise, deleteExercise } from "@/app/actions";
import { Notice, param } from "@/components/Notice";
import { requireUser } from "@/lib/supabase/server";

export default async function ExercisesPage({ searchParams }: PageProps<"/exercises">) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name, sets(count)")
    .order("name");

  return (
    <>
      <h1 className="text-2xl font-bold">Exercises</h1>
      <Notice error={param(sp, "error") ?? error?.message} />

      <form action={createExercise} className="card flex gap-2">
        <label htmlFor="name" className="sr-only">Exercise name</label>
        <input id="name" name="name" required maxLength={80} placeholder="New exercise, e.g. Squat" className="input" />
        <button className="btn shrink-0">Add</button>
      </form>

      {exercises?.length === 0 && (
        <p className="card text-muted">
          No saved exercises yet. Add one here, or just type a new name when logging a set.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {exercises?.map((e) => {
          const count = e.sets[0]?.count ?? 0;
          return (
            <li key={e.id} className="card flex items-center gap-3">
              <Link href={`/progress?exercise=${e.id}`} className="flex-1">
                <span className="font-semibold">{e.name}</span>
                <span className="block text-sm text-muted">
                  {count} {count === 1 ? "set" : "sets"} logged
                </span>
              </Link>
              <details className="relative">
                <summary aria-label={`Delete ${e.name}`} className="cursor-pointer list-none rounded-lg px-2 py-1 text-sm text-muted">
                  Delete
                </summary>
                <form action={deleteExercise} className="absolute right-0 z-10 mt-1 w-56 rounded-xl border border-border bg-surface p-3 shadow-lg">
                  <input type="hidden" name="exercise_id" value={e.id} />
                  <p className="mb-2 text-sm">
                    {count > 0 ? `This also deletes ${count} logged ${count === 1 ? "set" : "sets"}.` : "Delete this exercise?"}
                  </p>
                  <button className="btn-ghost w-full border-danger text-danger">Confirm delete</button>
                </form>
              </details>
            </li>
          );
        })}
      </ul>
    </>
  );
}
