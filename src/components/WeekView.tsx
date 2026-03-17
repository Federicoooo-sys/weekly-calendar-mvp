"use client";

import { useMemo } from "react";
import { getCurrentWeekDays, getCurrentWeekStart, formatWeekRange } from "@/lib/dates";
import { getMockWeek } from "@/data/mock";
import WeekGrid from "./WeekGrid";
import MobileWeekView from "./MobileWeekView";
import { strings } from "@/constants/strings";
import type { CalendarEvent } from "@/types";

export default function WeekView() {
  const week = getMockWeek();
  const weekDays = getCurrentWeekDays("mon");
  const weekRange = formatWeekRange(getCurrentWeekStart());

  // Group events by day — computed once, shared by both layouts
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const day of weekDays) {
      grouped[day.dayKey] = week.events.filter((e) => e.dayKey === day.dayKey);
    }
    return grouped;
  }, [week.events, weekDays]);

  const totalEvents = week.events.length;

  return (
    <div>
      {/* Week header — title and date range on one line */}
      <div className="flex items-baseline gap-2 mb-4">
        <h2
          className="text-lg font-semibold md:text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          {strings.weekPageTitle}
        </h2>
        <span
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {weekRange}
        </span>
        <span
          className="text-xs hidden md:inline"
          style={{ color: "var(--color-text-muted)" }}
        >
          · {totalEvents} {totalEvents === 1 ? strings.eventCount.replace("{count}", "1") : strings.eventCountPlural.replace("{count}", String(totalEvents))}
        </span>
      </div>

      {/* Desktop: time grid calendar */}
      <div className="hidden md:block">
        <WeekGrid days={weekDays} eventsByDay={eventsByDay} />
      </div>

      {/* Mobile: week strip + day timeline */}
      <div className="md:hidden">
        <MobileWeekView days={weekDays} eventsByDay={eventsByDay} />
      </div>
    </div>
  );
}
