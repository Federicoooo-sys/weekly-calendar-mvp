"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCircle } from "@/hooks/useCircle";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { getCurrentWeekDays, formatWeekRange, getCurrentWeekStart, formatTimeRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase";
import { categoryConfig, CATEGORY_LABEL_KEYS } from "@/constants/categories";
import EventFormModal, { type EventFormData } from "@/components/EventFormModal";
import { useWeekStorage } from "@/hooks/useWeekStorage";
import type { CalendarEvent, DayOfWeek, EventCategory, EventVisibility, CircleWithMembers } from "@/types";

/** A member's shared events for the current week. */
interface MemberSchedule {
  userId: string;
  displayName: string;
  events: CalendarEvent[];
}

type Step = "selectCircle" | "selectMembers" | "compare";

/** Maps a DB row to a shared CalendarEvent (no notes — privacy). */
function rowToSharedEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    dayKey: row.day_key as DayOfWeek,
    startTime: (row.start_time as string) || undefined,
    endTime: (row.end_time as string) || undefined,
    category: row.category as EventCategory,
    status: row.status as CalendarEvent["status"],
    visibility: (row.visibility as EventVisibility) || "circle",
    createdAt: row.created_at as string,
  };
}

export default function CoordinatePage() {
  const { t } = usePreferences();
  const { user } = useAuth();
  const { circles, loading: circlesLoading } = useCircle();
  const { addEvent } = useWeekStorage();

  const weekDays = getCurrentWeekDays("mon");
  const weekRange = formatWeekRange(getCurrentWeekStart());
  const weekStart = getCurrentWeekStart();

  // Step state
  const [selectedCircle, setSelectedCircle] = useState<CircleWithMembers | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>("selectCircle");

  // Comparison data
  const [schedules, setSchedules] = useState<MemberSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  // Day focus
  const todayKey = weekDays.find((d) => d.isToday)?.dayKey ?? weekDays[0].dayKey;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayKey);

  // Group event creation
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Auto-select circle if user has only one
  useEffect(() => {
    if (!circlesLoading && circles.length === 1 && !selectedCircle) {
      setSelectedCircle(circles[0]);
      setStep("selectMembers");
    }
  }, [circlesLoading, circles, selectedCircle]);

  // Other members in selected circle (exclude self)
  const otherMembers = useMemo(() => {
    if (!selectedCircle || !user) return [];
    return selectedCircle.members.filter((m) => m.userId !== user.id);
  }, [selectedCircle, user]);

  function toggleMember(userId: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else if (next.size < 4) {
        next.add(userId);
      }
      return next;
    });
  }

  // Load schedules for selected members
  const loadSchedules = useCallback(async () => {
    if (!user || selectedMemberIds.size === 0 || !selectedCircle) return;

    setSchedulesLoading(true);
    const supabase = createClient();
    const memberIds = [...selectedMemberIds];

    // Load shared events for all selected members in one query
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("user_id", memberIds)
      .eq("week_start", weekStart)
      .eq("visibility", "circle")
      .order("created_at", { ascending: true });

    // Also load current user's own events (for the comparison)
    const { data: myData } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .order("created_at", { ascending: true });

    // Build member name map
    const memberMap = new Map(
      selectedCircle.members.map((m) => [m.userId, m.displayName])
    );

    // Group events by user
    const grouped = new Map<string, CalendarEvent[]>();
    // Add current user first
    grouped.set(user.id, (myData || []).map(rowToSharedEvent));

    for (const id of memberIds) {
      if (!grouped.has(id)) grouped.set(id, []);
    }
    for (const row of data || []) {
      const userId = row.user_id as string;
      const events = grouped.get(userId);
      if (events) {
        events.push(rowToSharedEvent(row));
      }
    }

    const result: MemberSchedule[] = [];
    // Current user first
    result.push({
      userId: user.id,
      displayName: t.participantYou,
      events: grouped.get(user.id) || [],
    });
    // Then selected members
    for (const id of memberIds) {
      result.push({
        userId: id,
        displayName: memberMap.get(id) || "Member",
        events: grouped.get(id) || [],
      });
    }

    setSchedules(result);
    setSchedulesLoading(false);
  }, [user, selectedMemberIds, selectedCircle, weekStart, t.participantYou]);

  function handleCompare() {
    setStep("compare");
    loadSchedules();
  }

  function handleBack() {
    if (step === "compare") {
      setStep("selectMembers");
      setSchedules([]);
    } else if (step === "selectMembers") {
      setStep("selectCircle");
      setSelectedCircle(null);
      setSelectedMemberIds(new Set());
    }
  }

  // Events for the selected day, per member
  const daySchedules = useMemo(() => {
    return schedules.map((s) => ({
      ...s,
      dayEvents: s.events
        .filter((e) => e.dayKey === selectedDay)
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")),
    }));
  }, [schedules, selectedDay]);

  // Handle group event creation
  async function handleCreateGroupEvent(data: EventFormData) {
    if (!user || !selectedCircle) return;

    // Create the event
    await addEvent({
      title: data.title,
      dayKey: data.dayKey,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      category: data.category,
      note: data.note || undefined,
      visibility: "circle",
    });

    // Find the event we just created to get its ID
    const supabase = createClient();
    const { data: latestEvents } = await supabase
      .from("events")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .eq("title", data.title.trim())
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestEvents && latestEvents.length > 0) {
      const eventId = latestEvents[0].id;

      // Invite all selected members
      for (const memberId of selectedMemberIds) {
        // Create participant row
        await supabase.from("event_participants").insert({
          event_id: eventId,
          user_id: memberId,
          role: "invite",
          status: "invited",
          invited_by: user.id,
        });

        // Send notification
        await supabase.from("notifications").insert({
          user_id: memberId,
          actor_id: user.id,
          type: "event_invite",
          target_id: eventId,
          target_label: data.title.trim(),
        });
      }
    }

    setShowCreateEvent(false);
    // Reload to show the new event
    loadSchedules();
  }

  // Loading state
  if (circlesLoading) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-3xl">
        <div className="flex justify-center py-12">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl">
      {/* Back link */}
      <div className="mb-4">
        {step === "selectCircle" ? (
          <Link
            href="/circle"
            className="inline-flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            {t.navCircle}
          </Link>
        ) : (
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
            style={{ color: "var(--color-accent)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            {t.coordinateBack}
          </button>
        )}
      </div>

      {/* Header */}
      <div className="mb-5">
        <h2
          className="text-lg font-semibold md:text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t.coordinateTitle}
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          {weekRange}
        </p>
      </div>

      {/* No circles */}
      {circles.length === 0 && (
        <div
          className="text-center py-10 rounded-xl"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {t.coordinateNoCircles}
          </p>
        </div>
      )}

      {/* ─── Step 1: Select circle ─── */}
      {step === "selectCircle" && circles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
            {t.coordinateSelectCircle}
          </p>
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => {
                setSelectedCircle(circle);
                setSelectedMemberIds(new Set());
                setStep("selectMembers");
              }}
              className="w-full text-left p-4 rounded-xl cursor-pointer transition-colors hover:opacity-90"
              style={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {circle.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {circle.members.length} {t.circleMembers.toLowerCase()}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* ─── Step 2: Select members ─── */}
      {step === "selectMembers" && selectedCircle && (
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
            {t.coordinateSelectMembers}
          </p>
          <p className="text-[10px] mb-3" style={{ color: "var(--color-text-muted)" }}>
            {t.coordinateSelectMembersHint}
          </p>

          <div className="space-y-1.5 mb-4">
            {otherMembers.map((member) => {
              const isSelected = selectedMemberIds.has(member.userId);
              return (
                <button
                  key={member.userId}
                  onClick={() => toggleMember(member.userId)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: isSelected ? "var(--color-bg-tertiary)" : "var(--color-bg-secondary)",
                    border: isSelected
                      ? "1.5px solid var(--color-accent)"
                      : "1px solid var(--color-border)",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{
                      background: isSelected ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                      color: isSelected ? "var(--color-bg-primary)" : "var(--color-text-secondary)",
                    }}
                  >
                    {(member.displayName || "?")[0].toUpperCase()}
                  </div>
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {member.displayName || "Member"}
                  </span>
                  {/* Checkmark */}
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0">
                      <polyline points="5,12 10,17 19,7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {otherMembers.length === 0 && (
            <p className="text-sm py-6 text-center" style={{ color: "var(--color-text-muted)" }}>
              {t.circleNoOtherMembers}
            </p>
          )}

          {otherMembers.length > 0 && (
            <button
              onClick={handleCompare}
              disabled={selectedMemberIds.size === 0}
              className="w-full h-11 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
              style={{
                background: selectedMemberIds.size > 0 ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                color: selectedMemberIds.size > 0 ? "var(--color-bg-primary)" : "var(--color-disabled)",
              }}
            >
              {t.coordinateCompare}
            </button>
          )}
        </div>
      )}

      {/* ─── Step 3: Compare schedules ─── */}
      {step === "compare" && (
        <div>
          {/* Day selector strip */}
          <div
            className="flex justify-between items-center rounded-xl px-1 py-1 mb-4"
            style={{ background: "var(--color-bg-secondary)" }}
          >
            {weekDays.map((day) => {
              const isSelected = day.dayKey === selectedDay;
              return (
                <button
                  key={day.dayKey}
                  onClick={() => setSelectedDay(day.dayKey)}
                  className="flex flex-col items-center justify-center rounded-lg py-1.5 px-0 flex-1 min-w-0 transition-colors"
                  style={{
                    background: isSelected ? "var(--color-bg-primary)" : "transparent",
                    boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <span
                    className="text-[10px] font-medium uppercase leading-none"
                    style={{
                      color: day.isToday
                        ? "var(--color-accent)"
                        : isSelected
                          ? "var(--color-text-primary)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {day.dayLetter}
                  </span>
                  <span
                    className="text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mt-0.5"
                    style={{
                      background: day.isToday && isSelected
                        ? "var(--color-accent)"
                        : "transparent",
                      color: day.isToday && isSelected
                        ? "var(--color-bg-primary)"
                        : day.isToday
                          ? "var(--color-accent)"
                          : isSelected
                            ? "var(--color-text-primary)"
                            : "var(--color-text-muted)",
                    }}
                  >
                    {day.dayNumber}
                  </span>
                </button>
              );
            })}
          </div>

          {schedulesLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
            </div>
          ) : (
            <>
              {/* Comparison grid */}
              {/* Desktop: side by side columns */}
              <div className="hidden md:grid gap-3" style={{ gridTemplateColumns: `repeat(${daySchedules.length}, 1fr)` }}>
                {daySchedules.map((member) => (
                  <MemberColumn
                    key={member.userId}
                    displayName={member.displayName}
                    events={member.dayEvents}
                    isYou={member.userId === user?.id}
                    t={t}
                  />
                ))}
              </div>

              {/* Mobile: stacked cards */}
              <div className="md:hidden space-y-3">
                {daySchedules.map((member) => (
                  <MemberColumn
                    key={member.userId}
                    displayName={member.displayName}
                    events={member.dayEvents}
                    isYou={member.userId === user?.id}
                    t={t}
                  />
                ))}
              </div>

              {/* Create group event button */}
              <button
                onClick={() => setShowCreateEvent(true)}
                className="w-full mt-4 h-11 rounded-lg text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-accent)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t.coordinateCreateGroup}
              </button>
            </>
          )}
        </div>
      )}

      {/* Group event creation modal */}
      {showCreateEvent && (
        <EventFormModal
          days={weekDays}
          initialDayKey={selectedDay}
          onSave={handleCreateGroupEvent}
          onClose={() => setShowCreateEvent(false)}
        />
      )}
    </div>
  );
}

/** A single member's events for one day — used in both desktop and mobile layouts. */
function MemberColumn({
  displayName,
  events,
  isYou,
  t,
}: {
  displayName: string;
  events: CalendarEvent[];
  isYou: boolean;
  t: Record<string, string>;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--color-bg-secondary)",
        border: isYou ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
      }}
    >
      {/* Member header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
          style={{
            background: isYou ? "var(--color-accent)" : "var(--color-bg-tertiary)",
            color: isYou ? "var(--color-bg-primary)" : "var(--color-text-secondary)",
          }}
        >
          {(displayName || "?")[0].toUpperCase()}
        </div>
        <span
          className="text-xs font-medium truncate"
          style={{ color: "var(--color-text-primary)" }}
        >
          {displayName}
        </span>
        <span className="text-[10px] ml-auto shrink-0" style={{ color: "var(--color-text-muted)" }}>
          {events.length}
        </span>
      </div>

      {/* Events */}
      <div className="px-2 py-1.5 space-y-1 min-h-[60px]">
        {events.length === 0 ? (
          <p className="text-[10px] text-center py-3" style={{ color: "var(--color-text-muted)" }}>
            {t.coordinateNoSharedEvents}
          </p>
        ) : (
          events.map((event) => {
            const isDone = event.status === "completed" || event.status === "skipped";
            return (
              <div
                key={event.id}
                className="flex items-start gap-1.5 rounded-lg px-2 py-1.5"
                style={{ opacity: isDone ? 0.5 : 1 }}
              >
                {/* Category dot */}
                <div
                  className="w-2 h-2 rounded-full shrink-0 mt-1"
                  style={{ background: categoryConfig[event.category].colorVar }}
                />
                <div className="min-w-0">
                  <span
                    className={`text-xs leading-snug block truncate ${isDone ? "line-through" : ""}`}
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {event.title}
                  </span>
                  {event.startTime && (
                    <span className="text-[10px] block" style={{ color: "var(--color-text-muted)" }}>
                      {formatTimeRange(event.startTime, event.endTime)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
