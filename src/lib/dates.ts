import type { DayOfWeek, DayInfo, TimeSlot } from "@/types";
import { strings } from "@/constants/strings";

const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DAY_LABEL_KEYS: Record<DayOfWeek, keyof typeof strings> = {
  mon: "dayMonShort",
  tue: "dayTueShort",
  wed: "dayWedShort",
  thu: "dayThuShort",
  fri: "dayFriShort",
  sat: "daySatShort",
  sun: "daySunShort",
};

const DAY_LETTER_KEYS: Record<DayOfWeek, keyof typeof strings> = {
  mon: "dayMonLetter",
  tue: "dayTueLetter",
  wed: "dayWedLetter",
  thu: "dayThuLetter",
  fri: "dayFriLetter",
  sat: "daySatLetter",
  sun: "daySunLetter",
};

// ─── Week boundaries ───

/**
 * Returns the ISO date string (YYYY-MM-DD) of Monday for the current week.
 */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun, 1=Mon, ...
  const offset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + offset);
  return monday.toISOString().split("T")[0];
}

/**
 * Returns ordered DayOfWeek keys for a week starting on the given day.
 */
export function getOrderedDays(startDay: DayOfWeek = "mon"): DayOfWeek[] {
  const startIndex = DAY_ORDER.indexOf(startDay);
  return [...DAY_ORDER.slice(startIndex), ...DAY_ORDER.slice(0, startIndex)];
}

/**
 * Returns the full Date object for a given DayOfWeek within a week.
 */
export function getDateForDay(dayKey: DayOfWeek, weekStart: string): Date {
  const monday = new Date(weekStart + "T00:00:00");
  const dayIndex = DAY_ORDER.indexOf(dayKey);
  const date = new Date(monday);
  date.setDate(monday.getDate() + dayIndex);
  return date;
}

// ─── Day info ───

/**
 * Builds a DayInfo[] for the current week — one entry per day with
 * all the pre-computed labels and flags components need.
 * Call once in WeekView, pass individual DayInfo objects to children.
 */
export function getCurrentWeekDays(startDay: DayOfWeek = "mon"): DayInfo[] {
  const weekStart = getCurrentWeekStart();
  const days = getOrderedDays(startDay);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return days.map((dayKey) => {
    const date = getDateForDay(dayKey, weekStart);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    return {
      dayKey,
      date,
      dayLabel: strings[DAY_LABEL_KEYS[dayKey]],
      dayLetter: strings[DAY_LETTER_KEYS[dayKey]],
      dayNumber: date.getDate(),
      dateLabel: formatShortDate(date),
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
    };
  });
}

// ─── Date checks ───

/**
 * Checks whether a given DayOfWeek within a week is today.
 */
export function isToday(dayKey: DayOfWeek, weekStart: string): boolean {
  const dayDate = getDateForDay(dayKey, weekStart);
  const now = new Date();
  return (
    dayDate.getFullYear() === now.getFullYear() &&
    dayDate.getMonth() === now.getMonth() &&
    dayDate.getDate() === now.getDate()
  );
}

/**
 * Checks whether a given DayOfWeek within a week is in the past.
 */
export function isPast(dayKey: DayOfWeek, weekStart: string): boolean {
  const dayDate = getDateForDay(dayKey, weekStart);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return dayDate < now;
}

// ─── Formatting ───

/**
 * Formats a Date as "Mar 17" style short date.
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Formats a weekStart string as "Mar 16 – Mar 22".
 */
export function formatWeekRange(weekStart: string): string {
  const monday = new Date(weekStart + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${formatShortDate(monday)} – ${formatShortDate(sunday)}`;
}

/**
 * Formats "HH:mm" (24h) to "9:00 AM" style display string.
 */
export function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

/**
 * Formats a time range for display: "9:00 AM – 10:30 AM".
 * If endTime is omitted, returns just the start.
 */
export function formatTimeRange(startTime: string, endTime?: string): string {
  if (!endTime) return formatTime(startTime);
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

// ─── Time grid ───

/** Cached time slots — generated once. */
let cachedTimeSlots: TimeSlot[] | null = null;

/**
 * Returns 96 time slots (24 hours × 4 per hour) in 15-minute increments.
 * Cached after first call.
 */
export function getTimeSlots(): TimeSlot[] {
  if (cachedTimeSlots) return cachedTimeSlots;

  const slots: TimeSlot[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      slots.push({
        time,
        label: formatTime(time),
        hour,
        minute,
      });
    }
  }

  cachedTimeSlots = slots;
  return slots;
}

/**
 * Returns time slots for a specific hour range (inclusive start, exclusive end).
 * Useful for showing a focused portion of the day, e.g. 6:00–22:00.
 */
export function getTimeSlotsInRange(startHour: number, endHour: number): TimeSlot[] {
  return getTimeSlots().filter(
    (slot) => slot.hour >= startHour && slot.hour < endHour
  );
}

/**
 * Returns the nearest 15-minute slot for a given "HH:mm" time string.
 * Rounds down: "09:07" → "09:00", "09:08" → "09:15" would need rounding up.
 * We round down for simplicity — event placement snaps to the slot at or before.
 */
export function snapToSlot(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const snapped = Math.floor(minute / 15) * 15;
  return `${String(hour).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
}

/**
 * Calculates how many 15-minute slots an event spans.
 * Returns 1 if startTime or endTime is missing (point event = 1 slot).
 */
export function getSlotSpan(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 1;

  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const diff = endMinutes - startMinutes;

  return diff > 0 ? Math.ceil(diff / 15) : 1;
}
