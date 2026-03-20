import type { CalendarEvent, Week, UserPreferences } from "@/types";
import { getCurrentWeekStart } from "@/lib/dates";

/**
 * Mock events — a realistic week of data for development.
 * IDs use a simple "evt-N" pattern. In production these would be UUIDs.
 */
const mockEvents: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Team standup",
    dayKey: "mon",
    startTime: "09:30",
    endTime: "09:45",
    category: "work",
    status: "completed",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-2",
    title: "Grocery shopping",
    dayKey: "mon",
    category: "errand",
    status: "completed",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-3",
    title: "Write project proposal",
    dayKey: "tue",
    startTime: "10:00",
    endTime: "12:00",
    category: "work",
    status: "planned",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-4",
    title: "Morning run",
    dayKey: "tue",
    startTime: "07:00",
    endTime: "07:45",
    category: "health",
    status: "planned",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-5",
    title: "Dentist appointment",
    dayKey: "wed",
    startTime: "14:00",
    endTime: "15:00",
    category: "personal",
    status: "planned",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-6",
    title: "Code review",
    dayKey: "wed",
    startTime: "11:00",
    endTime: "11:30",
    category: "work",
    status: "planned",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-12",
    title: "Design sync",
    dayKey: "wed",
    startTime: "11:00",
    endTime: "11:45",
    category: "work",
    status: "planned",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-7",
    title: "Pick up dry cleaning",
    dayKey: "thu",
    category: "errand",
    status: "planned",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-8",
    title: "Yoga class",
    dayKey: "thu",
    startTime: "18:00",
    endTime: "19:00",
    category: "health",
    status: "planned",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-9",
    title: "Sprint planning",
    dayKey: "fri",
    startTime: "10:00",
    endTime: "11:00",
    category: "work",
    status: "planned",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-10",
    title: "Dinner with friends",
    dayKey: "sat",
    startTime: "19:00",
    category: "personal",
    status: "planned",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
  {
    id: "evt-11",
    title: "Meal prep for next week",
    dayKey: "sun",
    category: "personal",
    status: "planned",
    visibility: "private",
    createdAt: "2026-03-16T08:00:00Z",
  },
];

export function getMockWeek(): Week {
  return {
    weekStart: getCurrentWeekStart(),
    events: mockEvents,
  };
}

export const defaultPreferences: UserPreferences = {
  weekStartDay: "mon",
  theme: "light",
  language: "en",
};
