import { CalendarDays, ChevronDown, Filter, Globe2, Star } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { getUpcomingEarnings } from "@shared/market-data";

export function getCalendarWeek(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const mondayOffset = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - mondayOffset);

  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

    return {
      date,
      key: date.toISOString(),
      shortLabel: `${date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3)} ${String(date.getDate()).padStart(2, "0")}`,
      fullLabel: date.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }),
    };
  });

  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const selectedDay = isWeekend ? 4 : Math.min((today.getDay() + 6) % 7, 4);
  const rangeLabel = `${days[0].date.toLocaleDateString("en-US", { month: "long", day: "2-digit" })} – ${days[days.length - 1].date.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })}`;

  return {
    days,
    selectedDay,
    rangeLabel,
  };
}

export default function CalendarPage() {
  const [tab, setTab] = useState<"economic" | "earnings">("economic");
  const calendar = getCalendarWeek();
  const earnings = getUpcomingEarnings();
  const [selectedDay, setSelectedDay] = useState(calendar.selectedDay);
  const eventsQuery = trpc.market.events.useQuery(undefined, {
    staleTime: 60_000,
  });
  const exportCalendar = () => {
    const blob = new Blob([`Northstar Markets calendar export\n${calendar.rangeLabel}\n${(eventsQuery.data ?? []).slice(0, 5).map((event) => `- ${event.event} (${event.time})`).join("\n")}`], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "northstar-calendar.ics";
    link.click();
    URL.revokeObjectURL(url);
  };
  const visibleEvents = (eventsQuery.data ?? []).slice(0, 5).map((event, index) => ({
    ...event,
    dateLabel: calendar.days[index]?.shortLabel ?? event.date ?? "Today",
  }));
  return (
    <AppShell>
      <div className="page-shell feature-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span>/</span>
              <strong>Calendar</strong>
            </div>
            <h1>Event calendar</h1>
            <p>
              Stay ahead of the catalysts that can move price, liquidity, and
              expectations.
            </p>
          </div>
          <div className="heading-actions">
            <button type="button" className="button button-secondary button-sm" onClick={exportCalendar}>
              <CalendarDays size={14} /> Add to calendar
            </button>
          </div>
        </div>
        <div className="calendar-tabs">
          <button
            type="button"
            className={cn(tab === "economic" && "active")}
            onClick={() => setTab("economic")}
          >
            Economic events
          </button>
          <button
            type="button"
            className={cn(tab === "earnings" && "active")}
            onClick={() => setTab("earnings")}
          >
            Earnings
          </button>
        </div>
        <section className="section-card calendar-card">
          <div className="calendar-toolbar">
            <div className="date-nav">
              <button type="button" onClick={() => notify("Previous week is not available from the current calendar feed.")}>‹</button>
              <strong>{calendar.rangeLabel}</strong>
              <button type="button" onClick={() => notify("Next week is not available from the current calendar feed.")}>›</button>
            </div>
            <div className="calendar-filters">
              <button type="button" className="select-button" onClick={() => notify("Country filter: All countries") }>
                <Globe2 size={14} /> All countries <ChevronDown size={13} />
              </button>
              <button type="button" className="select-button" onClick={() => notify("Importance filter: All levels") }>
                <Filter size={14} /> Importance <ChevronDown size={13} />
              </button>
            </div>
          </div>
          <div className="day-strip">
            {calendar.days.map((day, i) => (
              <button
                type="button"
                className={cn("day-pill", i === selectedDay && "active")}
                key={day.key}
                onClick={() => setSelectedDay(i)}
              >
                <span>{day.shortLabel.split(" ")[0]}</span>
                <b>{day.shortLabel.split(" ")[1]}</b>
                {day.date.toDateString() === new Date().toDateString() && <i />}
              </button>
            ))}
          </div>
          {tab === "economic" ? (
            <div className="calendar-table">
              <div className="calendar-table-head">
                <span>Time</span>
                <span>Country</span>
                <span>Event</span>
                <span>Importance</span>
                <span>Actual</span>
                <span>Forecast</span>
                <span>Previous</span>
                <span />
              </div>
              {visibleEvents.map((event, index) => (
                <div
                  className={cn("calendar-table-row", index === selectedDay && "selected-row")}
                  key={`${event.time}-${event.event}`}
                >
                  <span className="event-time">
                    {event.time}
                    <small>ET</small>
                  </span>
                  <span className="event-country">
                    <span className="flag-chip">{event.flag}</span>
                    {event.country}
                  </span>
                  <span className="calendar-event-name">
                    <b>{event.event}</b>
                    <small>{event.dateLabel}</small>
                  </span>
                  <span>
                    <i
                      className={cn(
                        "importance-dot",
                        `importance-${event.importance}`
                      )}
                    />
                    {event.importance}
                  </span>
                  <span className="mono">{event.actual}</span>
                  <span className="mono">{event.forecast}</span>
                  <span className="mono muted">{event.previous}</span>
                  <button type="button" className="icon-button subtle" onClick={() => notify(`Added ${event.event} to your watchlist.`, "success")}>
                    <Star size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="calendar-table">
              <div className="calendar-table-head earnings-head">
                <span>Company</span>
                <span>EPS est.</span>
                <span>Revenue est.</span>
                <span>Date</span>
                <span>Session</span>
                <span />
              </div>
              {earnings.map(row => (
                <div className="calendar-table-row earnings-row" key={row.company}>
                  <span className="company-cell">
                    <span className="asset-mark asset-stock">
                      {row.company.slice(0, 2).toUpperCase()}
                    </span>
                    <b>{row.company}</b>
                  </span>
                  <span className="mono">{row.eps}</span>
                  <span className="mono">{row.revenue}</span>
                  <span>{row.dateLabel}</span>
                  <span className="session-badge">{row.session}</span>
                  <button type="button" className="icon-button subtle" onClick={() => notify(`Added ${row.company} earnings to your watchlist.`, "success")}>
                    <Star size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
