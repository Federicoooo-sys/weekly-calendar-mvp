/**
 * Core domain types for the weekly planner.
 *
 * Named CalendarEvent (not Event) to avoid collision with the DOM Event global.
 * All types are plain serializable interfaces — no classes, no methods.
 * This makes them safe for localStorage, JSON, and future API payloads.
 */

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type EventCategory = "work" | "personal" | "health" | "errand" | "other";

export type EventStatus = "planned" | "completed" | "skipped";

export interface CalendarEvent {
  id: string;
  title: string;
  dayKey: DayOfWeek;
  /** "HH:mm" format, e.g. "09:00". Optional — not all events have a fixed time. */
  startTime?: string;
  /** "HH:mm" format. Optional — omit for point-in-time or untimed events. */
  endTime?: string;
  category: EventCategory;
  status: EventStatus;
  /** ISO 8601 timestamp. Set once at creation. */
  createdAt: string;
}

export interface Week {
  /** ISO date string of Monday, e.g. "2026-03-16". Uniquely identifies a week. */
  weekStart: string;
  events: CalendarEvent[];
}

/** Pre-computed info for a single day in the current week. */
export interface DayInfo {
  dayKey: DayOfWeek;
  /** Full date for this day */
  date: Date;
  /** Short display label, e.g. "Mon" */
  dayLabel: string;
  /** Single letter label, e.g. "M" — for mobile week strip */
  dayLetter: string;
  /** Day of month number, e.g. 17 */
  dayNumber: number;
  /** Short date label, e.g. "Mar 17" */
  dateLabel: string;
  /** Whether this day is today */
  isToday: boolean;
  /** Whether this day is in the past */
  isPast: boolean;
}

/** A 15-minute time slot for the time grid. */
export interface TimeSlot {
  /** "HH:mm" format, e.g. "09:15" */
  time: string;
  /** Display label, e.g. "9:15 AM" */
  label: string;
  /** Hour (0–23) */
  hour: number;
  /** Minute (0, 15, 30, 45) */
  minute: number;
}

export interface UserPreferences {
  /** Which day starts the week. Default: "mon". */
  weekStartDay: DayOfWeek;
  /** Active theme. Only "light" is implemented on Day 1. */
  theme: "light" | "dark" | "blue";
  /** Active language. Only "en" is implemented on Day 1. */
  language: "en" | "zh";
}
