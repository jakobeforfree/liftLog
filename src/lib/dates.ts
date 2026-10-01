/** Formats a Postgres `date` (YYYY-MM-DD) without shifting it through the local time zone. */
export function formatDate(isoDate: string, opts: Intl.DateTimeFormatOptions = {}) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  });
}
