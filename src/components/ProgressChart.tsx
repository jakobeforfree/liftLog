import type { SessionPoint } from "@/lib/progress";
import { formatDate } from "@/lib/dates";
import { formatNumber } from "@/lib/progress";

const W = 320;
const H = 180;
const PAD = { top: 12, right: 12, bottom: 24, left: 36 };

/** Line chart of estimated 1RM (solid) and top-set weight (dashed) per session. */
export function ProgressChart({ points }: { points: SessionPoint[] }) {
  const values = points.flatMap((p) => [p.bestE1rm, p.topWeight]);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi === lo) {
    lo -= 5;
    hi += 5;
  }
  const padY = (hi - lo) * 0.1;
  lo = Math.max(0, lo - padY);
  hi += padY;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - lo) / (hi - lo)) * innerH;
  const path = (key: "bestE1rm" | "topWeight") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const ticks = [lo, (lo + hi) / 2, hi];

  return (
    <figure className="card">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Estimated 1RM from ${formatNumber(points[0].bestE1rm)} to ${formatNumber(points.at(-1)!.bestE1rm)} lb over ${points.length} sessions`}
        className="w-full"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
              {Math.round(t)}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={H - 6} fontSize="10" fill="var(--muted)">
          {formatDate(points[0].date, { weekday: undefined, year: undefined })}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="10" fill="var(--muted)">
            {formatDate(points.at(-1)!.date, { weekday: undefined, year: undefined })}
          </text>
        )}
        <path d={path("topWeight")} fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={path("bestE1rm")} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.date} cx={x(i)} cy={y(p.bestE1rm)} r="3.5" fill="var(--accent)">
            <title>{`${p.date}: e1RM ${formatNumber(p.bestE1rm)}, top set ${formatNumber(p.topWeight)}`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="mt-2 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-accent" /> Est. 1RM
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 border-t-2 border-dashed border-muted" /> Top set weight
        </span>
      </figcaption>
    </figure>
  );
}
