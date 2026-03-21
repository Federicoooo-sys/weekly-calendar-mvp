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

export type EventVisibility = "private" | "circle";

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
  /** Controls who can see this event. Default: "private". */
  visibility: EventVisibility;
  /** Optional short note for context, e.g. "bring laptop" */
  note?: string;
  /** ISO 8601 timestamp. Set once at creation. */
  createdAt: string;
  /** True if this event was created by someone else and user is a participant. */
  isInvited?: boolean;
  /** The user_id of the event creator. Present on invited events. */
  ownerId?: string;
  /** Display name of the event owner. Present on invited events. */
  ownerName?: string;
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
  theme: "light" | "dark" | "blue" | "lavender" | "mist" | "cosmic";
  /** Active language. Only "en" is implemented on Day 1. */
  language: "en" | "zh";
}

// ─── Social architecture (future-facing) ───────────────────────────────
//
// These types prepare for private accountability/sharing features.
// They are not consumed by any UI or storage logic yet.
// Design assumptions:
//   - Private by default. Nothing is shared unless the user explicitly opts in.
//   - Small circles (family, close friends) — not public social.
//   - The single-user experience remains primary; social is additive.

/** A user identity — minimal for now, expanded when auth is added. */
export interface UserProfile {
  id: string;
  /** Display name chosen by the user */
  displayName: string;
  /** Optional avatar URL */
  avatarUrl?: string;
  /** ISO 8601 timestamp */
  createdAt: string;
}

/**
 * A private group of people who can optionally share weekly summaries.
 * Think "family group" or "accountability partners" — not a public feed.
 */
export interface Circle {
  id: string;
  name: string;
  /** The user who created the circle */
  ownerId: string;
  /** ISO 8601 timestamp */
  createdAt: string;
}

/** A user's membership in a circle. */
export interface CircleMembership {
  circleId: string;
  userId: string;
  /** "owner" created the circle; "member" was invited and accepted */
  role: "owner" | "member";
  /** ISO 8601 timestamp of when they joined */
  joinedAt: string;
}

/**
 * Controls what others in a circle can see.
 * "private" = nothing shared (default).
 * "summary" = weekly summary stats only (completion rate, category breakdown).
 * "details" = summary + individual event titles and statuses.
 */
export type ShareScope = "private" | "summary" | "details";

/**
 * A snapshot of a weekly summary shared with a circle.
 * Created only when the user explicitly shares — never automatic.
 */
export interface WeeklySummaryShare {
  id: string;
  /** The user sharing their week */
  userId: string;
  /** The circle receiving the share */
  circleId: string;
  /** ISO date string of Monday for the shared week */
  weekStart: string;
  /** What level of detail was shared */
  scope: ShareScope;
  /** Optional reflection note the user writes when sharing */
  reflectionNote?: string;
  /** ISO 8601 timestamp of when the share was created */
  sharedAt: string;
}

/**
 * A lightweight response to a shared summary — e.g., encouragement or emoji.
 * Placeholder type only. Not implemented yet.
 */
export interface SocialResponse {
  id: string;
  /** The shared summary being responded to */
  shareId: string;
  /** Who responded */
  userId: string;
  /** Simple emoji or short text — keep it lightweight */
  content: string;
  /** ISO 8601 timestamp */
  createdAt: string;
}

/** An invite to join a specific circle. */
export interface CircleInvite {
  id: string;
  circleId: string;
  invitedBy: string;
  code: string;
  claimedBy?: string;
  claimedAt?: string;
  createdAt: string;
}

/** A comment on a shared event. */
export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  content: string;
  createdAt: string;
  /** Joined from profiles — only available on read */
  displayName?: string;
}

/** Circle with its members — used in the circle page UI. */
export interface CircleWithMembers extends Circle {
  /** Persistent join code set by the owner. */
  joinCode?: string;
  members: (CircleMembership & { displayName: string })[];
}

/** A reaction on a shared event. */
export interface Reaction {
  id: string;
  eventId: string;
  userId: string;
  emoji: "👍" | "❤️" | "👏" | "🔥";
  createdAt: string;
  displayName?: string;
}

/** Allowed reaction emojis. */
export const REACTION_EMOJIS = ["👍", "❤️", "👏", "🔥"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/** Participation role — how the participant row was created. */
export type ParticipantRole = "invite" | "request";

/** Participation status — lifecycle of an invite or join request. */
export type ParticipantStatus = "invited" | "requested" | "accepted" | "declined";

/** A participant row for an event — covers invites, join requests, and accepted participants. */
export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  invitedBy?: string;
  createdAt: string;
  updatedAt: string;
  /** Joined from profiles */
  displayName?: string;
}

/** An in-app notification. */
export type NotificationType = "comment" | "reaction" | "member_joined" | "summary_shared" | "event_invite" | "join_request" | "participant_response";
export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: NotificationType;
  targetId?: string;
  targetLabel: string;
  read: boolean;
  createdAt: string;
  /** Joined from profiles */
  actorName?: string;
}

/** A shared weekly summary snapshot. */
export interface SharedWeeklySummary {
  id: string;
  userId: string;
  circleId: string;
  weekStart: string;
  reflectionNote?: string;
  totalEvents: number;
  completedEvents: number;
  skippedEvents: number;
  completionRate: number;
  sharedAt: string;
  /** Joined from profiles */
  displayName?: string;
}

/** A unified feed item for the activity feed. */
export interface FeedItem {
  id: string;
  type: "summary_shared" | "member_joined";
  actorName: string;
  timestamp: string;
  /** For summary_shared */
  summary?: SharedWeeklySummary;
  /** For member_joined */
  circleName?: string;
}
