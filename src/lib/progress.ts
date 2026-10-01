export type SetRow = { performed_on: string; weight: number; reps: number };

export type SessionPoint = {
  date: string;
  topWeight: number;
  bestE1rm: number;
  volume: number;
  sets: number;
};

/** Epley estimated one-rep max. A single rep is the weight itself. */
export function estimate1rm(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/** Groups sets of one exercise by day, oldest first. */
export function summarizeByDate(rows: SetRow[]): SessionPoint[] {
  const byDate = new Map<string, SessionPoint>();
  for (const r of rows) {
    const weight = Number(r.weight);
    const p = byDate.get(r.performed_on) ?? {
      date: r.performed_on,
      topWeight: 0,
      bestE1rm: 0,
      volume: 0,
      sets: 0,
    };
    p.topWeight = Math.max(p.topWeight, weight);
    p.bestE1rm = Math.max(p.bestE1rm, estimate1rm(weight, r.reps));
    p.volume += weight * r.reps;
    p.sets += 1;
    byDate.set(r.performed_on, p);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}
