"use client";

import { useEffect, useRef, useState } from "react";
import { getStrings, type LocaleStrings } from "@/constants/strings";
import { formatTime } from "@/lib/dates";
import { categoryConfig } from "@/constants/categories";
import GridEvent, { SLOT_HEIGHT, layoutEvents } from "./GridEvent";
import type { DayInfo, DayOfWeek, CalendarEvent } from "@/types";

/** Visible hour range for the grid */
const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const GRID_HEIGHT = TOTAL_HOURS * 4 * SLOT_HEIGHT;

/** Width of the time gutter on the left */
const GUTTER_WIDTH = 52;

interface WeekGridProps {
  days: DayInfo[];
  eventsByDay: Record<string, CalendarEvent[]>;
  onAddEvent: (dayKey: DayOfWeek) => void;
  onEventClick: (event: CalendarEvent) => void;
  onStatusToggle: (event: CalendarEvent) => void;
}

/** Returns the pixel offset of the current time from START_HOUR, or null if outside range. */
function getCurrentTimeOffset(): number | null {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = START_HOUR * 60;
  const endMinutes = END_HOUR * 60;
  if (totalMinutes < startMinutes || totalMinutes > endMinutes) return null;
  return ((totalMinutes - startMinutes) / 15) * SLOT_HEIGHT;
}

export default function WeekGrid({ days, eventsByDay, onAddEvent, onEventClick, onStatusToggle }: WeekGridProps) {
  const strings = getStrings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [timeOffset, setTimeOffset] = useState<number | null>(getCurrentTimeOffset);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const currentHour = now.getHours();
    const scrollToHour = Math.max(currentHour - 1, START_HOUR);
    const scrollTop = (scrollToHour - START_HOUR) * 4 * SLOT_HEIGHT;
    scrollRef.current.scrollTop = scrollTop;
  }, []);

  // Update the current-time indicator every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOffset(getCurrentTimeOffset());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
      {/* ─── Sticky day header row ─── */}
      <div
        className="flex sticky top-0 z-30"
        style={{ background: "var(--color-bg-secondary)", borderBottom: "1px solid var(--color-border)" }}
      >
        {/* Gutter spacer */}
        <div
          className="shrink-0"
          style={{ width: GUTTER_WIDTH, borderRight: "1px solid var(--color-border)" }}
        />

        {/* Day headers */}
        {days.map((day) => (
          <div
            key={day.dayKey}
            className="flex-1 min-w-0 text-center py-2 px-1 relative group"
            style={{
              borderRight: "1px solid var(--color-border)",
              opacity: day.isPast && !day.isToday ? 0.6 : 1,
            }}
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-wide block"
              style={{ color: day.isToday ? "var(--color-accent)" : "var(--color-text-secondary)" }}
            >
              {day.dayLabel}
            </span>
            <span
              className={`text-[11px] block ${day.isToday ? "font-semibold" : ""}`}
              style={{ color: day.isToday ? "var(--color-accent)" : "var(--color-text-muted)" }}
            >
              {day.dateLabel}
            </span>
          </div>
        ))}
      </div>

      {/* ─── All-day / untimed events row ─── */}
      <AllDayRow days={days} eventsByDay={eventsByDay} onEventClick={onEventClick} onStatusToggle={onStatusToggle} />

      {/* ─── Scrollable time grid ─── */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        <div className="flex" style={{ height: GRID_HEIGHT }}>
          {/* Time gutter */}
          <div className="shrink-0 relative" style={{ width: GUTTER_WIDTH }}>
            {Array.from({ length: TOTAL_HOURS }, (_, i) => {
              const hour = START_HOUR + i;
              const time = `${String(hour).padStart(2, "0")}:00`;
              const isCurrentHour = timeOffset !== null
                && timeOffset >= i * 4 * SLOT_HEIGHT
                && timeOffset < (i + 1) * 4 * SLOT_HEIGHT;
              return (
                <div
                  key={hour}
                  className={`absolute right-2 text-[10px] leading-none ${isCurrentHour ? "font-semibold" : ""}`}
                  style={{
                    top: i * 4 * SLOT_HEIGHT - 5,
                    color: isCurrentHour ? "var(--color-accent)" : "var(--color-text-muted)",
                  }}
                >
                  {formatTime(time)}
                </div>
              );
            })}
          </div>

          {/* Day columns with gridlines */}
          {days.map((day) => {
            const timedEvents = (eventsByDay[day.dayKey] || []).filter((e) => e.startTime);
            const layouted = layoutEvents(timedEvents, START_HOUR);

            return (
              <div
                key={day.dayKey}
                onClick={() => onAddEvent(day.dayKey)}
                className="flex-1 min-w-0 relative cursor-pointer"
                style={{
                  borderRight: "1px solid var(--color-border)",
                  background: day.isToday ? "var(--color-bg-tertiary)" : "transparent",
                  opacity: day.isPast && !day.isToday ? 0.6 : 1,
                }}
              >
                {/* Hour gridlines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0"
                    style={{
                      top: i * 4 * SLOT_HEIGHT,
                      borderTop: "1px solid var(--color-border)",
                    }}
                  />
                ))}

                {/* Half-hour gridlines (lighter) */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={`half-${i}`}
                    className="absolute left-0 right-0"
                    style={{
                      top: i * 4 * SLOT_HEIGHT + 2 * SLOT_HEIGHT,
                      borderTop: "1px dashed var(--color-border)",
                      opacity: 0.4,
                    }}
                  />
                ))}

                {/* Events */}
                {layouted.map(({ event, columnCount, columnIndex }) => (
                  <GridEvent
                    key={event.id}
                    event={event}
                    startHour={START_HOUR}
                    columnCount={columnCount}
                    columnIndex={columnIndex}
                    onClick={onEventClick}
                    onStatusToggle={onStatusToggle}
                  />
                ))}

                {/* Current time indicator */}
                {day.isToday && timeOffset !== null && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: timeOffset }}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-2 h-2 rounded-full -ml-1"
                        style={{ background: "var(--color-accent)" }}
                      />
                      <div
                        className="flex-1 h-px"
                        style={{ background: "var(--color-accent)" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Renders the untimed events row above the time grid */
function AllDayRow({
  days,
  eventsByDay,
  onEventClick,
  onStatusToggle,
}: {
  days: DayInfo[];
  eventsByDay: Record<string, CalendarEvent[]>;
  onEventClick: (event: CalendarEvent) => void;
  onStatusToggle: (event: CalendarEvent) => void;
}) {
  const strings = getStrings();
  const hasAnyUntimed = days.some((day) =>
    (eventsByDay[day.dayKey] || []).some((e) => !e.startTime)
  );

  if (!hasAnyUntimed) return null;

  return (
    <div
      className="flex overflow-y-auto"
      style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-secondary)", maxHeight: 120 }}
    >
      {/* Gutter label */}
      <div
        className="shrink-0 flex items-start pt-1.5 justify-end pr-2"
        style={{ width: GUTTER_WIDTH, borderRight: "1px solid var(--color-border)" }}
      >
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {strings.allDay}
        </span>
      </div>

      {/* Untimed events per day */}
      {days.map((day) => {
        const untimedEvents = (eventsByDay[day.dayKey] || []).filter((e) => !e.startTime);
        return (
          <div
            key={day.dayKey}
            className="flex-1 min-w-0 px-1 py-1 space-y-0.5"
            style={{
              borderRight: "1px solid var(--color-border)",
              background: day.isToday ? "var(--color-bg-tertiary)" : "transparent",
            }}
          >
            {untimedEvents.map((event) => {
              const isDone = event.status === "completed" || event.status === "skipped";
              return (
                <div
                  key={event.id}
                  onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                  className="flex items-center gap-1 rounded px-1 py-0.5 cursor-pointer hover:opacity-100 transition-opacity"
                  style={{
                    background: categoryConfig[event.category].colorVar,
                    opacity: isDone ? 0.5 : 0.85,
                  }}
                >
                  <span
                    className={`text-[10px] font-medium truncate ${isDone ? "line-through" : ""}`}
                    style={{ color: "var(--color-bg-primary)" }}
                  >
                    {event.title}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
