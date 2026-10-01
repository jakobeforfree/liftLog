"use client";

import { useEffect, useRef } from "react";

/** A date input that defaults to today in the viewer's own time zone (the server only knows UTC). */
export function LocalDateInput(props: { id: string; name: string; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current && !ref.current.value) {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      ref.current.value = d.toISOString().slice(0, 10);
    }
  }, []);
  return <input ref={ref} type="date" required {...props} />;
}
