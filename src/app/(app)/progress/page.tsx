import Link from "next/link";
import { ProgressChart } from "@/components/ProgressChart";
import { param } from "@/components/Notice";
import { formatDate } from "@/lib/dates";
import { formatNumber, summarizeByDate } from "@/lib/progress";
import { requireUser } from "@/lib/supabase/server";

export default async function ProgressPage({ searchParams }: PageProps<"/progress">) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const { data: exercises } = await supabase.from("exercises").select("id, name").order("name");

  if (!exercises?.length) {
    return (
      <>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="card text-muted">Log a few sets and your progress charts will show up here.</p>
      </>
    );
  }

  const selected = exercises.find((e) => e.id === param(sp, "exercise")) ?? exercises[0];
  const { data: rows } = await supabase
    .from("sets")
    .select("weight, reps, workouts!inner(performed_on)")
    .eq("exercise_id", selected.id);
  const points = summarizeByDate(
    (rows ?? []).map((r) => ({ weight: Number(r.weight), reps: r.reps, performed_on: r.workouts.performed_on })),
  );
  const bestWeight = Math.max(0, ...points.map((p) => p.topWeight));
  const bestE1rm = Math.max(0, ...points.map((p) => p.bestE1rm));

  return (
    <>
      <h1 className="text-2xl font-bold">Progress</h1>

      <nav aria-label="Exercises" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {exercises.map((e) => (
          <Link
            key={e.id}
            href={`/progress?exercise=${e.id}`}
            aria-current={e.id === selected.id ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
              e.id === selected.id ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface"
            }`}
          >
            {e.name}
          </Link>
        ))}
      </nav>

      <h2 className="text-lg font-semibold">{selected.name}</h2>
      {points.length === 0 ? (
        <p className="card text-muted">No sets logged for {selected.name} yet.</p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-2">
            {[
              ["Heaviest", `${formatNumber(bestWeight)} lb`],
              ["Best e1RM", `${formatNumber(bestE1rm)} lb`],
              ["Sessions", String(points.length)],
            ].map(([label, value]) => (
              <div key={label} className="card p-3">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="text-lg font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <ProgressChart points={points} />
          <section className="card">
            <h3 className="mb-2 font-semibold">Sessions</h3>
            <table className="w-full text-sm tabular-nums">
              <thead className="text-left text-muted">
                <tr>
                  <th className="py-1 font-medium">Date</th>
                  <th className="py-1 text-right font-medium">Top set</th>
                  <th className="py-1 text-right font-medium">e1RM</th>
                  <th className="py-1 text-right font-medium">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...points].reverse().map((p) => (
                  <tr key={p.date}>
                    <td className="py-1.5">{formatDate(p.date, { weekday: undefined })}</td>
                    <td className="py-1.5 text-right">{formatNumber(p.topWeight)}</td>
                    <td className="py-1.5 text-right">{formatNumber(p.bestE1rm)}</td>
                    <td className="py-1.5 text-right">{formatNumber(p.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
}
