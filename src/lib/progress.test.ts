import { describe, expect, it } from "vitest";
import { estimate1rm, formatNumber, summarizeByDate } from "./progress";

describe("estimate1rm", () => {
  it("returns the weight for a single rep", () => {
    expect(estimate1rm(200, 1)).toBe(200);
  });
  it("uses the Epley formula for multiple reps", () => {
    expect(estimate1rm(100, 10)).toBe(133.3);
  });
});

describe("summarizeByDate", () => {
  it("groups sets per day and sorts oldest first", () => {
    const out = summarizeByDate([
      { performed_on: "2026-02-03", weight: 135, reps: 5 },
      { performed_on: "2026-01-01", weight: 100, reps: 10 },
      { performed_on: "2026-02-03", weight: 145, reps: 3 },
    ]);
    expect(out.map((p) => p.date)).toEqual(["2026-01-01", "2026-02-03"]);
    expect(out[1]).toMatchObject({ topWeight: 145, volume: 135 * 5 + 145 * 3, sets: 2 });
    expect(out[1].bestE1rm).toBe(159.5);
  });
  it("handles numeric strings from Postgres numeric columns", () => {
    const out = summarizeByDate([{ performed_on: "2026-01-01", weight: "52.5" as unknown as number, reps: 2 }]);
    expect(out[0].topWeight).toBe(52.5);
    expect(out[0].volume).toBe(105);
  });
  it("returns an empty list for no sets", () => {
    expect(summarizeByDate([])).toEqual([]);
  });
});

describe("formatNumber", () => {
  it("drops trailing zeros", () => {
    expect(formatNumber(100)).toBe("100");
    expect(formatNumber(52.5)).toBe("52.5");
    expect(formatNumber(133.33)).toBe("133.3");
  });
});
