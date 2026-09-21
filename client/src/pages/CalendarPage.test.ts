import { describe, expect, it } from "vitest";
import { getCalendarWeek } from "./CalendarPage";

describe("calendar week generation", () => {
  it("uses the current week and marks today inside the visible range", () => {
    const reference = new Date("2026-09-21T12:00:00Z");
    const week = getCalendarWeek(reference);

    expect(week.days).toHaveLength(5);
    expect(week.days[0].shortLabel).toBe("Mon 14");
    expect(week.days[4].shortLabel).toBe("Fri 18");
    expect(week.selectedDay).toBe(3);
    expect(week.rangeLabel).toContain("September 14");
    expect(week.rangeLabel).toContain("September 18");
  });

  it("keeps the selected day valid when today falls on a weekend", () => {
    const reference = new Date("2026-09-19T12:00:00Z");
    const week = getCalendarWeek(reference);

    expect(week.selectedDay).toBe(0);
  });
});
