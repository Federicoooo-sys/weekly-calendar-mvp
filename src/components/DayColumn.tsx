import { strings } from "@/constants/strings";
import { categoryConfig } from "@/constants/categories";
import type { CalendarEvent } from "@/types";

interface DayColumnProps {
  dayLabel: string;
  dateLabel: string;
  isToday: boolean;
  events: CalendarEvent[];
}

export default function DayColumn({ dayLabel, dateLabel, isToday, events }: DayColumnProps) {
  return (
    <div
      className="rounded-lg p-3 min-h-[100px] md:min-h-[140px] transition-colors"
      style={{
        background: isToday ? "var(--color-bg-tertiary)" : "var(--color-bg-secondary)",
        border: isToday ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
      }}
    >
      {/* Day header */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: isToday ? "var(--color-accent)" : "var(--color-text-secondary)" }}
        >
          {dayLabel}
        </span>
        <span
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {dateLabel}
        </span>
        {isToday && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-auto"
            style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
          >
            {strings.today}
          </span>
        )}
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>
          {strings.noEvents}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-1.5">
              {/* Category color dot */}
              <span
                className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: categoryConfig[event.category].colorVar }}
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`text-xs leading-tight block ${event.status === "completed" ? "line-through" : ""}`}
                  style={{
                    color: event.status === "completed"
                      ? "var(--color-text-muted)"
                      : "var(--color-text-primary)",
                  }}
                >
                  {event.title}
                </span>
                {event.startTime && (
                  <span className="text-[10px] block" style={{ color: "var(--color-text-muted)" }}>
                    {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
