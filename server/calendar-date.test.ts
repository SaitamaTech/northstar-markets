import { describe, expect, it } from "vitest";
import { getCalendarWeek } from "../client/src/pages/CalendarPage";

describe("calendar week generation", () => {
  it("uses the current week and marks today inside the visible range", () => {
    const reference = new Date(2026, 8, 21, 12);
    const week = getCalendarWeek(reference);

    expect(week.days).toHaveLength(5);
    expect(week.days[0].shortLabel).toBe("Mon 21");
    expect(week.days[4].shortLabel).toBe("Fri 25");
    expect(week.selectedDay).toBe(0);
    expect(week.rangeLabel).toContain("September 21");
    expect(week.rangeLabel).toContain("September 25");
  });

  it("keeps the selected day valid when today falls on a weekend", () => {
    const reference = new Date(2026, 8, 19, 12);
    const week = getCalendarWeek(reference);

    expect(week.selectedDay).toBe(4);
  });
});
