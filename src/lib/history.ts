import type { Week, CalendarEvent, EventCategory, DayOfWeek } from "@/types";
import { isValidEvent } from "@/hooks/useWeekStorage";
import { getCurrentWeekStart, getOrderedDays, getDateForDay, formatShortDate } from "./dates";
import { getStrings, type LocaleStrings } from "@/constants/strings";

const STORAGE_PREFIX = "weekplanner_week_";

const DAY_FULL_KEYS: Record<DayOfWeek, keyof LocaleStrings> = {
  mon: "dayMon",
  tue: "dayTue",
  wed: "dayWed",
  thu: "dayThu",
  fri: "dayFri",
  sat: "daySat",
  sun: "daySun",
};

export interface WeekSummary {
  weekStart: string;
  total: number;
  completed: number;
  skipped: number;
  unresolved: number;
  completionRate: number;
  byCategory: Record<EventCategory, number>;
}

export interface PastWeekDay {
  dayKey: DayOfWeek;
  dayLabel: string;
  dateLabel: string;
  events: CalendarEvent[];
}

/**
 * Scans localStorage for all past weeks (before the current week).
 * Returns them sorted most-recent-first.
 */
export function getPastWeeks(): Week[] {
  const currentWeekStart = getCurrentWeekStart();
  const weeks: Week[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;

      const weekStart = key.slice(STORAGE_PREFIX.length);
      if (weekStart >= currentWeekStart) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.events)) {
          weeks.push({ weekStart, events: parsed.events.filter(isValidEvent) });
        }
      } catch {
        // Skip corrupted entries
      }
    }
  } catch {
    // localStorage unavailable
  }

  // Most recent first
  weeks.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  return weeks;
}

/**
 * Computes summary metrics for a single week's events.
 */
export function getWeekSummary(week: Week): WeekSummary {
  const events = week.events;
  const total = events.length;
  const completed = events.filter((e) => e.status === "completed").length;
  const skipped = events.filter((e) => e.status === "skipped").length;
  const unresolved = events.filter((e) => e.status === "planned").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const byCategory: Record<EventCategory, number> = {
    work: 0,
    personal: 0,
    health: 0,
    errand: 0,
    other: 0,
  };
  for (const event of events) {
    byCategory[event.category]++;
  }

  return { weekStart: week.weekStart, total, completed, skipped, unresolved, completionRate, byCategory };
}

/**
 * Builds a day-by-day breakdown of a past week's events for the detail view.
 * Returns all 7 days (Mon–Sun) with their events sorted by time.
 */
export function getPastWeekDays(week: Week): PastWeekDay[] {
  const days = getOrderedDays("mon");

  const s = getStrings();
  return days.map((dayKey) => {
    const date = getDateForDay(dayKey, week.weekStart);
    const dayEvents = week.events
      .filter((e) => e.dayKey === dayKey)
      .sort((a, b) => {
        // Timed events first, sorted by start time
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        if (a.startTime) return -1;
        if (b.startTime) return 1;
        return 0;
      });

    return {
      dayKey,
      dayLabel: s[DAY_FULL_KEYS[dayKey]],
      dateLabel: formatShortDate(date),
      events: dayEvents,
    };
  });
}
