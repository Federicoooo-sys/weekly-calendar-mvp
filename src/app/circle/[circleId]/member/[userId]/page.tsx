"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSharedEvents } from "@/hooks/useSharedEvents";
import { usePreferences } from "@/hooks/usePreferences";
import { getCurrentWeekDays, formatWeekRange, getCurrentWeekStart } from "@/lib/dates";
import { categoryConfig } from "@/constants/categories";
import SharedEventDetail from "@/components/SharedEventDetail";
import type { CalendarEvent } from "@/types";

export default function SharedWeekPage() {
  const params = useParams();
  const circleId = params.circleId as string;
  const userId = params.userId as string;
  const { t } = usePreferences();
  const { events, memberName, loading } = useSharedEvents(userId);

  const weekDays = getCurrentWeekDays("mon");
  const weekRange = formatWeekRange(getCurrentWeekStart());

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const day of weekDays) grouped[day.dayKey] = [];
    for (const event of events) {
      if (grouped[event.dayKey]) grouped[event.dayKey].push(event);
    }
    return grouped;
  }, [events, weekDays]);

  if (loading) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-md">
        <div className="flex justify-center py-12">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-lg">
      <div className="mb-6">
        <Link
          href={`/circle/${circleId}`}
          className="inline-flex items-center gap-1 text-xs font-medium mb-3"
          style={{ color: "var(--color-accent)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          {t.sharedBack}
        </Link>

        <h2 className="text-lg font-semibold md:text-xl" style={{ color: "var(--color-text-primary)" }}>
          {t.sharedWeekTitle.replace("{name}", memberName || "Member")}
        </h2>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{weekRange}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-muted)" }}>
            {t.sharedEventsOnly}
          </span>
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "var(--color-bg-tertiary)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--color-text-muted)" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t.sharedNoEvents}</p>
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-4">
          {weekDays.map((day) => {
            const dayEvents = eventsByDay[day.dayKey] || [];
            if (dayEvents.length === 0) return null;
            return (
              <div key={day.dayKey}>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: day.isToday ? "var(--color-accent)" : "var(--color-text-muted)" }}>
                    {day.dayLabel}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{day.dateLabel}</span>
                </div>
                <div className="space-y-2">
                  {dayEvents.map((event) => {
                    const catConfig = categoryConfig[event.category];
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left p-3 rounded-xl cursor-pointer transition-transform active:scale-[0.98]"
                        style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: catConfig.colorVar }} />
                          <span
                            className="text-sm font-medium truncate"
                            style={{
                              color: "var(--color-text-primary)",
                              textDecoration: event.status === "skipped" ? "line-through" : undefined,
                              opacity: event.status === "skipped" ? 0.5 : 1,
                            }}
                          >
                            {event.title}
                          </span>
                          {event.status === "completed" && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-success)", flexShrink: 0 }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        {event.startTime && (
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedEvent && (
        <SharedEventDetail
          event={selectedEvent}
          eventOwnerId={userId}
          days={weekDays}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
