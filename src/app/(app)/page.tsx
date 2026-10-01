import Link from "next/link";
import { createWorkout } from "@/app/actions";
import { LocalDateInput } from "@/components/LocalDateInput";
import { Notice, param } from "@/components/Notice";
import { formatDate } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";

export default async function WorkoutsPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("id, performed_on, notes, sets(exercises(name))")
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <Notice error={param(sp, "error") ?? error?.message} />

      <form action={createWorkout} className="card flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Start a workout</h2>
        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
          <label htmlFor="performed_on" className="text-sm font-medium text-muted">Date</label>
          <LocalDateInput id="performed_on" name="performed_on" className="input" />
          <label htmlFor="notes" className="text-sm font-medium text-muted">Notes</label>
          <input id="notes" name="notes" placeholder="Push day, felt strong…" maxLength={1000} className="input" />
        </div>
        <button className="btn">Start workout</button>
      </form>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted">History</h2>
        {workouts?.length === 0 && (
          <p className="card text-muted">No workouts yet. Start your first one above.</p>
        )}
        <ul className="flex flex-col gap-2">
          {workouts?.map((w) => {
            const names = [...new Set(w.sets.map((s) => s.exercises?.name).filter(Boolean))];
            return (
              <li key={w.id}>
                <Link href={`/workouts/${w.id}`} className="card block active:opacity-80">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{formatDate(w.performed_on)}</span>
                    <span className="shrink-0 text-sm text-muted">
                      {w.sets.length} {w.sets.length === 1 ? "set" : "sets"}
                    </span>
                  </div>
                  {names.length > 0 && <p className="mt-1 truncate text-sm">{names.join(" · ")}</p>}
                  {w.notes && <p className="mt-1 truncate text-sm text-muted">{w.notes}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
