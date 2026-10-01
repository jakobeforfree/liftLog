export function Notice({ error, message }: { error?: string; message?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
        {error}
      </p>
    );
  if (message)
    return (
      <p role="status" className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
        {message}
      </p>
    );
  return null;
}

/** Reads a single string value from Next's searchParams object. */
export function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}
