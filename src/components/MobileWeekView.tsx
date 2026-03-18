"use client";

import { useState, useEffect } from "react";
import { getStrings } from "@/constants/strings";
import { categoryConfig, CATEGORY_LABEL_KEYS } from "@/constants/categories";
import { formatTimeRange, formatTime } from "@/lib/dates";
import type { DayInfo, CalendarEvent, DayOfWeek } from "@/types";

interface MobileWeekViewProps {
  days: DayInfo[];
  eventsByDay: Record<string, CalendarEvent[]>;
  onAddEvent: (dayKey: DayOfWeek) => void;
  onEventClick: (event: CalendarEvent) => void;
  onStatusToggle: (event: CalendarEvent) => void;
}

/** Returns a formatted current time string, e.g. "9:42 AM". */
function getCurrentTimeLabel(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return formatTime(`${hh}:${mm}`);
}

export default function MobileWeekView({ days, eventsByDay, onAddEvent, onEventClick, onStatusToggle }: MobileWeekViewProps) {
  const strings = getStrings();
  // Default to today, or Monday if today isn't in the current week
  const todayKey = days.find((d) => d.isToday)?.dayKey ?? days[0].dayKey;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayKey);
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeLabel);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeLabel());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const activeDay = days.find((d) => d.dayKey === selectedDay)!;
  const dayEvents = eventsByDay[selectedDay] || [];

  // Split into timed (sorted by startTime) and untimed
  const timedEvents = dayEvents
    .filter((e) => e.startTime)
    .sort((a, b) => a.startTime!.localeCompare(b.startTime!));
  const untimedEvents = dayEvents.filter((e) => !e.startTime);

  return (
    <div>
      {/* ─── Week strip ─── */}
      <div
        className="flex justify-between items-center rounded-xl px-1 py-1 mb-4"
        style={{ background: "var(--color-bg-secondary)" }}
      >
        {days.map((day) => {
          const isSelected = day.dayKey === selectedDay;
          const eventCount = (eventsByDay[day.dayKey] || []).length;

          return (
            <button
              key={day.dayKey}
              onClick={() => setSelectedDay(day.dayKey)}
              className="flex flex-col items-center justify-center rounded-lg py-1.5 px-0 flex-1 min-w-0 transition-colors"
              style={{
                background: isSelected ? "var(--color-bg-primary)" : "transparent",
                boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                opacity: day.isPast && !day.isToday && !isSelected ? 0.5 : 1,
              }}
            >
              {/* Day letter */}
              <span
                className="text-[10px] font-medium uppercase leading-none"
                style={{
                  color: day.isToday
                    ? "var(--color-accent)"
                    : isSelected
                      ? "var(--color-text-primary)"
                      : "var(--color-text-muted)",
                }}
              >
                {day.dayLetter}
              </span>

              {/* Day number */}
              <span
                className="text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mt-0.5"
                style={{
                  background: day.isToday && isSelected
                    ? "var(--color-accent)"
                    : "transparent",
                  color: day.isToday && isSelected
                    ? "var(--color-bg-primary)"
                    : day.isToday
                      ? "var(--color-accent)"
                      : isSelected
                        ? "var(--color-text-primary)"
                        : day.isPast
                          ? "var(--color-text-muted)"
                          : "var(--color-text-secondary)",
                }}
              >
                {day.dayNumber}
              </span>

              {/* Event count dot */}
              <div className="h-1.5 flex items-center">
                {eventCount > 0 && (
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{
                      background: isSelected
                        ? "var(--color-accent)"
                        : "var(--color-text-muted)",
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Selected day header ─── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {activeDay.dayLabel}
          </h3>
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {activeDay.dateLabel}
          </span>
          {activeDay.isToday && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
            >
              {currentTime}
            </span>
          )}
        </div>

        {/* Add button — 36px for comfortable thumb target */}
        <button
          onClick={() => onAddEvent(selectedDay)}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:scale-95"
          style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
          aria-label={strings.addEvent}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="8" y1="3" x2="8" y2="13" />
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
        </button>
      </div>

      {/* ─── Day timeline ─── */}
      {dayEvents.length === 0 ? (
        <button
          onClick={() => onAddEvent(selectedDay)}
          className="w-full py-10 text-center cursor-pointer rounded-xl transition-colors active:scale-[0.99]"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--color-text-muted)" }}>
            {strings.noEvents}
          </p>
          <p className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
            + {strings.addEvent}
          </p>
        </button>
      ) : (
        <div className="space-y-2">
          {/* Timed events */}
          {timedEvents.map((event) => (
            <MobileEventCard key={event.id} event={event} onClick={onEventClick} onStatusToggle={onStatusToggle} />
          ))}

          {/* Untimed events — separated only when both sections exist */}
          {untimedEvents.length > 0 && timedEvents.length > 0 && (
            <div className="py-0.5">
              <div style={{ borderTop: "1px dashed var(--color-border)" }} />
            </div>
          )}
          {untimedEvents.map((event) => (
            <MobileEventCard key={event.id} event={event} onClick={onEventClick} onStatusToggle={onStatusToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileEventCard({ event, onClick, onStatusToggle }: { event: CalendarEvent; onClick: (event: CalendarEvent) => void; onStatusToggle: (event: CalendarEvent) => void }) {
  const strings = getStrings();
  const isCompleted = event.status === "completed";
  const isSkipped = event.status === "skipped";
  const isDimmed = isCompleted || isSkipped;

  return (
    <div
      onClick={() => onClick(event)}
      className="flex items-start gap-3 rounded-xl px-3.5 py-3 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        opacity: isDimmed ? 0.65 : 1,
      }}
    >
      {/* Status toggle circle */}
      <button
        onClick={(e) => { e.stopPropagation(); onStatusToggle(event); }}
        className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center cursor-pointer transition-colors"
        style={{
          border: isCompleted
            ? "none"
            : `2px solid ${isSkipped ? "var(--color-text-muted)" : categoryConfig[event.category].colorVar}`,
          background: isCompleted ? "var(--color-cat-health)" : "transparent",
        }}
        aria-label={isCompleted ? strings.statusPlanned : strings.statusCompleted}
      >
        {isCompleted && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-bg-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2.5,6 5,8.5 9.5,3.5" />
          </svg>
        )}
        {isSkipped && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2.5" y1="2.5" x2="7.5" y2="7.5" />
            <line x1="7.5" y1="2.5" x2="2.5" y2="7.5" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        {/* Title */}
        <span
          className="text-sm leading-snug block"
          style={{
            color: isDimmed ? "var(--color-text-muted)" : "var(--color-text-primary)",
            textDecoration: isDimmed ? "line-through" : "none",
          }}
        >
          {event.title}
        </span>

        {/* Time + category */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {event.startTime && (
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {formatTimeRange(event.startTime, event.endTime)}
            </span>
          )}
          <span
            className="text-xs"
            style={{ color: categoryConfig[event.category].colorVar }}
          >
            {event.startTime ? "· " : ""}{strings[CATEGORY_LABEL_KEYS[event.category]]}
          </span>
        </div>

        {/* Note preview — single line, truncated */}
        {event.note && (
          <p
            className="text-xs mt-1 truncate"
            style={{ color: "var(--color-text-muted)" }}
          >
            {event.note}
          </p>
        )}
      </div>
    </div>
  );
}
