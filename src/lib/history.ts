import type { Week, CalendarEvent, EventCategory, EventVisibility, DayOfWeek } from "@/types";
import { isValidEvent } from "@/hooks/useWeekStorage";
import { getCurrentWeekStart, getOrderedDays, getDateForDay, formatShortDate } from "./dates";
import { getStrings, type LocaleStrings } from "@/constants/strings";
import { createClient } from "./supabase";

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

/** Maps a Supabase row to our CalendarEvent type. */
function rowToEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    dayKey: row.day_key as DayOfWeek,
    startTime: (row.start_time as string) || undefined,
    endTime: (row.end_time as string) || undefined,
    category: row.category as EventCategory,
    status: row.status as CalendarEvent["status"],
    visibility: (row.visibility as EventVisibility) || "private",
    note: (row.note as string) || undefined,
    createdAt: row.created_at as string,
  };
}

/**
 * Fetches all past weeks (before the current week) from Supabase.
 * Returns them sorted most-recent-first.
 */
export async function getPastWeeks(userId: string): Promise<Week[]> {
  const currentWeekStart = getCurrentWeekStart();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .lt("week_start", currentWeekStart)
    .order("week_start", { ascending: false })
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  // Group events by week_start
  const weekMap = new Map<string, CalendarEvent[]>();
  for (const row of data) {
    const event = rowToEvent(row);
    if (!isValidEvent(event)) continue;
    const ws = row.week_start as string;
    if (!weekMap.has(ws)) weekMap.set(ws, []);
    weekMap.get(ws)!.push(event);
  }

  // Convert to Week[] sorted most-recent-first
  const weeks: Week[] = [];
  for (const [weekStart, events] of weekMap) {
    weeks.push({ weekStart, events });
  }
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
