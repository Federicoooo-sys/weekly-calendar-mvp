/**
 * Sharing & privacy rules for future social/accountability features.
 *
 * This file encodes the product rules that will govern how data flows
 * between users. No backend or auth logic yet — just the rules themselves,
 * documented and typed so they can be implemented consistently later.
 *
 * Core philosophy: privacy-first, intentional sharing only.
 */

import type { ShareScope, CalendarEvent } from "@/types";

// ─── Product rules (encoded as constants) ───────────────────────────────

/**
 * The default share scope for any user who hasn't explicitly changed it.
 * Nothing is shared unless the user opts in.
 */
export const DEFAULT_SHARE_SCOPE: ShareScope = "private";

/**
 * Maximum number of circles a user can create or belong to.
 * Keeps the feature simple and focused on close relationships.
 */
export const MAX_CIRCLES_PER_USER = 5;

/**
 * Maximum members per circle. This is a small-group feature,
 * not a public community.
 */
export const MAX_MEMBERS_PER_CIRCLE = 12;

/**
 * Only completed weeks (past weeks) can be shared.
 * The current week is always private — no live broadcasting.
 */
export function canShareWeek(weekStart: string): boolean {
  const weekMonday = new Date(weekStart);
  const now = new Date();
  // Week is shareable if its Monday is strictly before the current week's Monday
  const currentMonday = getMonday(now);
  return weekMonday < currentMonday;
}

// ─── Visibility helpers ─────────────────────────────────────────────────

/**
 * Given a share scope, determines what event fields are visible to others.
 * Returns a sanitized version of events appropriate for the scope.
 */
export function filterEventsForScope(
  events: CalendarEvent[],
  scope: ShareScope,
): Partial<CalendarEvent>[] | null {
  if (scope === "private") return null;

  if (scope === "summary") {
    // Summary scope: only aggregate stats, no individual events
    return null;
  }

  // Details scope: titles and statuses, but strip notes (personal context)
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    dayKey: e.dayKey,
    startTime: e.startTime,
    endTime: e.endTime,
    category: e.category,
    status: e.status,
    // note intentionally omitted — private by default
    createdAt: e.createdAt,
  }));
}

// ─── Rule documentation ─────────────────────────────────────────────────

/**
 * Sharing rules (for reference by future implementors):
 *
 * 1. PRIVATE BY DEFAULT
 *    - New users start with ShareScope "private"
 *    - No data leaves the device unless the user explicitly shares
 *    - Changing share scope requires intentional action (not a toggle buried in settings)
 *
 * 2. INTENTIONAL SHARING
 *    - Only past (completed) weeks can be shared — never the current week
 *    - Sharing creates a snapshot — later edits don't update the shared version
 *    - The user chooses which circle to share with each time
 *    - Sharing is per-week, not a blanket "always share" setting
 *
 * 3. DATA MINIMIZATION
 *    - "summary" scope: only stats (total, completed, skipped, by-category)
 *    - "details" scope: event titles + statuses, but NOT notes
 *    - Notes are always private — they often contain personal context
 *
 * 4. CIRCLE BOUNDARIES
 *    - Circles are invite-only, not discoverable
 *    - Members can leave at any time
 *    - Only the owner can invite new members
 *    - Removing a member removes their access to all shared data in that circle
 *
 * 5. RESPONSES
 *    - Responses (encouragement, emoji) are lightweight and optional
 *    - No threaded conversations — this is not a messaging app
 *    - Responses are visible only within the circle
 */

// ─── Internal helpers ───────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
