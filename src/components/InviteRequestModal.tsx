"use client";

import { useState, useEffect } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { createClient } from "@/lib/supabase";
import { fetchDisplayName } from "@/lib/profiles";
import { useAuth } from "@/hooks/useAuth";
import { formatTimeRange, getCurrentWeekStart } from "@/lib/dates";
import { categoryConfig, CATEGORY_LABEL_KEYS } from "@/constants/categories";
import type { CalendarEvent, DayOfWeek, EventCategory, EventVisibility } from "@/types";

interface EventDetails {
  id: string;
  title: string;
  dayKey: DayOfWeek;
  startTime?: string;
  endTime?: string;
  category: EventCategory;
  note?: string;
  visibility: EventVisibility;
  ownerName: string;
}

interface InviteRequestModalProps {
  eventId: string;
  onClose: () => void;
  /** Called after accept/decline to refresh data */
  onResponded?: () => void;
}

/** Detects time overlap between two events. Both must have startTime. */
function hasTimeOverlap(
  aStart: string,
  aEnd: string | undefined,
  bStart: string,
  bEnd: string | undefined,
): boolean {
  const aEndTime = aEnd || addMinutes(aStart, 60);
  const bEndTime = bEnd || addMinutes(bStart, 60);
  return aStart < bEndTime && bStart < aEndTime;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function InviteRequestModal({ eventId, onClose, onResponded }: InviteRequestModalProps) {
  const { t } = usePreferences();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [result, setResult] = useState<"accepted" | "declined" | null>(null);

  // Fetch event details + owner profile + check conflicts
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      const supabase = createClient();

      // Fetch the event
      const { data: eventRow } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (cancelled || !eventRow) {
        if (!cancelled) setLoading(false);
        return;
      }

      // Fetch owner profile
      const ownerName = await fetchDisplayName(eventRow.user_id);

      const details: EventDetails = {
        id: eventRow.id,
        title: eventRow.title,
        dayKey: eventRow.day_key as DayOfWeek,
        startTime: eventRow.start_time || undefined,
        endTime: eventRow.end_time || undefined,
        category: eventRow.category as EventCategory,
        note: eventRow.note || undefined,
        visibility: (eventRow.visibility as EventVisibility) || "private",
        ownerName: ownerName || "Someone",
      };

      if (cancelled) return;
      setEvent(details);

      // Check conflicts — load user's own events for the same day/week
      const weekStart = getCurrentWeekStart();
      const { data: myEvents } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user!.id)
        .eq("week_start", weekStart)
        .eq("day_key", details.dayKey);

      if (cancelled) return;

      if (myEvents && details.startTime) {
        const overlapping = myEvents.filter((e) =>
          e.start_time && hasTimeOverlap(details.startTime!, details.endTime, e.start_time, e.end_time || undefined)
        );
        setConflicts(overlapping.map((e) => ({
          id: e.id,
          title: e.title,
          dayKey: e.day_key as DayOfWeek,
          startTime: e.start_time || undefined,
          endTime: e.end_time || undefined,
          category: e.category as EventCategory,
          status: e.status,
          visibility: (e.visibility as EventVisibility) || "private",
          createdAt: e.created_at,
        })));
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user, eventId]);

  async function handleRespond(response: "accepted" | "declined") {
    if (!user || responding) return;
    setResponding(true);

    const supabase = createClient();

    // Find the participant record
    const { data: participant } = await supabase
      .from("event_participants")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (!participant) {
      setResponding(false);
      return;
    }

    // Update status
    await supabase
      .from("event_participants")
      .update({ status: response, updated_at: new Date().toISOString() })
      .eq("id", participant.id);

    setResult(response);
    setResponding(false);
    onResponded?.();
  }

  // Close on Escape
  useEscapeKey(onClose);

  const DAY_LABELS: Record<DayOfWeek, string> = {
    mon: t.dayMonShort,
    tue: t.dayTueShort,
    wed: t.dayWedShort,
    thu: t.dayThuShort,
    fri: t.dayFriShort,
    sat: t.daySatShort,
    sun: t.daySunShort,
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t.inviteRequestTitle}
    >
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: "var(--color-overlay)" }} onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full md:max-w-sm md:mx-4 rounded-t-2xl md:rounded-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-6 animate-slideUp md:animate-fadeIn"
        style={{
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle — mobile */}
        <div className="flex justify-center mb-3 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {t.inviteRequestTitle}
          </h3>
          <button
            onClick={onClose}
            className="-mr-2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
            style={{ color: "var(--color-text-muted)" }}
            aria-label={t.cancel}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
          </div>
        ) : !event ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
            {t.errorGeneric}
          </p>
        ) : result ? (
          /* Success state */
          <div className="text-center py-6 space-y-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: result === "accepted" ? "var(--color-success)" : "var(--color-bg-tertiary)",
              }}
            >
              {result === "accepted" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-bg-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5,12 10,17 19,7" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="5" x2="15" y2="15" />
                  <line x1="15" y1="5" x2="5" y2="15" />
                </svg>
              )}
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {result === "accepted" ? t.inviteRequestAccepted : t.inviteRequestDeclined}
            </p>
            <button
              onClick={onClose}
              className="mt-2 h-10 px-6 rounded-lg text-sm font-medium cursor-pointer"
              style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}
            >
              {t.done}
            </button>
          </div>
        ) : (
          /* Event details */
          <div className="space-y-4">
            {/* From */}
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {t.inviteRequestFrom.replace("{name}", event.ownerName)}
            </p>

            {/* Event title + category pill */}
            <div>
              <h4 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
                {event.title}
              </h4>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: categoryConfig[event.category].colorVar,
                  color: "var(--color-bg-primary)",
                }}
              >
                {t[CATEGORY_LABEL_KEYS[event.category]]}
              </span>
            </div>

            {/* Day + Time */}
            <div
              className="rounded-xl p-3 space-y-2"
              style={{ background: "var(--color-bg-secondary)" }}
            >
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {t.inviteRequestDay}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {DAY_LABELS[event.dayKey]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {t.inviteRequestTime}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {event.startTime ? formatTimeRange(event.startTime, event.endTime) : t.inviteRequestNoTime}
                </span>
              </div>
            </div>

            {/* Note */}
            {event.note && (
              <div
                className="rounded-xl p-3"
                style={{ background: "var(--color-bg-secondary)" }}
              >
                <span className="text-xs block mb-1" style={{ color: "var(--color-text-muted)" }}>
                  {t.inviteRequestNote}
                </span>
                <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                  {event.note}
                </p>
              </div>
            )}

            {/* Conflict detection */}
            <div
              className="rounded-xl p-3"
              style={{
                background: conflicts.length > 0 ? "var(--color-bg-warning, var(--color-bg-secondary))" : "var(--color-bg-secondary)",
              }}
            >
              {conflicts.length > 0 ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>
                      {t.inviteRequestConflict}
                    </span>
                  </div>
                  {conflicts.map((c) => (
                    <p key={c.id} className="text-xs ml-5" style={{ color: "var(--color-text-secondary)" }}>
                      {t.inviteRequestConflictWith.replace("{event}", c.title)}
                      {c.startTime && (
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {" "}({formatTimeRange(c.startTime, c.endTime)})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="5,12 10,17 19,7" />
                  </svg>
                  <span className="text-xs" style={{ color: "var(--color-success)" }}>
                    {t.inviteRequestNoConflict}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleRespond("declined")}
                disabled={responding}
                className="flex-1 h-11 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
                style={{
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                  opacity: responding ? 0.5 : 1,
                }}
              >
                {t.decline}
              </button>
              <button
                onClick={() => handleRespond("accepted")}
                disabled={responding}
                className="flex-[2] h-11 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-bg-primary)",
                  opacity: responding ? 0.5 : 1,
                }}
              >
                {responding ? "..." : t.accept}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
