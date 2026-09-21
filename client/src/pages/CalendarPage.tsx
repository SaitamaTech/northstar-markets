import { CalendarDays, ChevronDown, Filter, Globe2, Star } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

export default function CalendarPage() {
  const [tab, setTab] = useState<"economic" | "earnings">("economic");
  const [selectedDay, setSelectedDay] = useState(1);
  const eventsQuery = trpc.market.events.useQuery(undefined, {
    staleTime: 60_000,
  });
  const days = ["Mon 02", "Tue 03", "Wed 04", "Thu 05", "Fri 06"];
  const exportCalendar = () => {
    const blob = new Blob(["Northstar Markets calendar export\nSeptember 02 - 06, 2026"], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "northstar-calendar.ics";
    link.click();
    URL.revokeObjectURL(url);
  };
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
              <strong>September 02 – 06, 2026</strong>
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
            {days.map((day, i) => (
              <button
                type="button"
                className={cn("day-pill", i === selectedDay && "active")}
                key={day}
                onClick={() => setSelectedDay(i)}
              >
                <span>{day.split(" ")[0]}</span>
                <b>{day.split(" ")[1]}</b>
                {i === 1 && <i />}
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
              {(eventsQuery.data ?? []).map(event => (
                <div
                  className="calendar-table-row"
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
                    <small>Macro data</small>
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
              {[
                ["Broadcom", "$1.21", "$13.0B", "Sep 04", "After close"],
                ["Adobe", "$4.53", "$5.37B", "Sep 05", "After close"],
                ["Oracle", "$1.48", "$13.2B", "Sep 09", "After close"],
                ["Lennar", "$3.92", "$9.1B", "Sep 12", "Before open"],
              ].map(row => (
                <div className="calendar-table-row earnings-row" key={row[0]}>
                  <span className="company-cell">
                    <span className="asset-mark asset-stock">
                      {row[0].slice(0, 2).toUpperCase()}
                    </span>
                    <b>{row[0]}</b>
                  </span>
                  <span className="mono">{row[1]}</span>
                  <span className="mono">{row[2]}</span>
                  <span>{row[3]}</span>
                  <span className="session-badge">{row[4]}</span>
                  <button type="button" className="icon-button subtle" onClick={() => notify(`Added ${row[0]} earnings to your watchlist.`, "success")}>
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
