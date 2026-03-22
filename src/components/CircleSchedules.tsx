"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { getCurrentWeekDays, formatWeekRange, getCurrentWeekStart, formatTimeRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase";
import { categoryConfig } from "@/constants/categories";
import EventFormModal, { type EventFormData } from "@/components/EventFormModal";
import { useWeekStorage } from "@/hooks/useWeekStorage";
import type { CalendarEvent, DayOfWeek, EventCategory, EventVisibility, CircleWithMembers } from "@/types";

interface MemberSchedule {
  userId: string;
  displayName: string;
  events: CalendarEvent[];
}

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

interface CircleSchedulesProps {
  circle: CircleWithMembers;
}

export default function CircleSchedules({ circle }: CircleSchedulesProps) {
  const { t } = usePreferences();
  const { user } = useAuth();
  const { addEvent } = useWeekStorage();

  const weekDays = getCurrentWeekDays("mon");
  const weekRange = formatWeekRange(getCurrentWeekStart());
  const weekStart = getCurrentWeekStart();

  const otherMembers = useMemo(() => {
    if (!user) return [];
    return circle.members.filter((m) => m.userId !== user.id);
  }, [circle, user]);

  // Member selection
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [comparing, setComparing] = useState(false);

  // Comparison data
  const [schedules, setSchedules] = useState<MemberSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  // Day focus
  const todayKey = weekDays.find((d) => d.isToday)?.dayKey ?? weekDays[0].dayKey;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayKey);

  // Group event creation
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  function toggleMember(userId: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else if (next.size < 4) next.add(userId);
      return next;
    });
  }

  const loadSchedules = useCallback(async () => {
    if (!user || selectedMemberIds.size === 0) return;

    setSchedulesLoading(true);
    try {
      const supabase = createClient();
      const memberIds = [...selectedMemberIds];

      const { data } = await supabase
        .from("events")
        .select("*")
        .in("user_id", memberIds)
        .eq("week_start", weekStart)
        .eq("visibility", "circle")
        .order("created_at", { ascending: true });

      const { data: myData } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .order("created_at", { ascending: true });

      const memberMap = new Map(circle.members.map((m) => [m.userId, m.displayName]));
      const grouped = new Map<string, CalendarEvent[]>();
      grouped.set(user.id, (myData || []).map(rowToSharedEvent));
      for (const id of memberIds) {
        if (!grouped.has(id)) grouped.set(id, []);
      }
      for (const row of data || []) {
        const userId = row.user_id as string;
        grouped.get(userId)?.push(rowToSharedEvent(row));
      }

      const result: MemberSchedule[] = [];
      result.push({ userId: user.id, displayName: t.participantYou, events: grouped.get(user.id) || [] });
      for (const id of memberIds) {
        result.push({ userId: id, displayName: memberMap.get(id) || "Member", events: grouped.get(id) || [] });
      }

      setSchedules(result);
    } finally {
      setSchedulesLoading(false);
    }
  }, [user, selectedMemberIds, circle.members, weekStart, t.participantYou]);

  function handleCompare() {
    setComparing(true);
    loadSchedules();
  }

  function handleBack() {
    setComparing(false);
    setSchedules([]);
  }

  const daySchedules = useMemo(() => {
    return schedules.map((s) => ({
      ...s,
      dayEvents: s.events
        .filter((e) => e.dayKey === selectedDay)
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")),
    }));
  }, [schedules, selectedDay]);

  async function handleCreateGroupEvent(data: EventFormData) {
    if (!user) return;
    await addEvent({
      title: data.title,
      dayKey: data.dayKey,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      category: data.category,
      note: data.note || undefined,
      visibility: "circle",
    });

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
      for (const memberId of selectedMemberIds) {
        await supabase.from("event_participants").insert({
          event_id: eventId, user_id: memberId, role: "invite", status: "invited", invited_by: user.id,
        });
        await supabase.from("notifications").insert({
          user_id: memberId, actor_id: user.id, type: "event_invite", target_id: eventId, target_label: data.title.trim(),
        });
      }
    }

    setShowCreateEvent(false);
    loadSchedules();
  }

  // ─── Member selection view ───
  if (!comparing) {
    return (
      <div>
        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>{weekRange}</p>

        {otherMembers.length === 0 ? (
          <div className="flex flex-col items-center text-center py-8">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
              style={{ background: "var(--color-bg-tertiary)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-muted)" }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {t.circleNoOtherMembers}
            </p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-0.5" style={{ color: "var(--color-text-muted)" }}>
              {t.coordinateSelectMembersHint}
            </p>

            {/* Member list — single card with dividers */}
            <div
              className="rounded-xl overflow-hidden mb-4"
              style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
            >
              {otherMembers.map((member, i) => {
                const isSelected = selectedMemberIds.has(member.userId);
                return (
                  <button
                    key={member.userId}
                    onClick={() => toggleMember(member.userId)}
                    className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer active:opacity-80"
                    style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : undefined }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors"
                      style={{
                        background: isSelected ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                        color: isSelected ? "var(--color-bg-primary)" : "var(--color-text-secondary)",
                      }}
                    >
                      {(member.displayName || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate flex-1 text-left" style={{ color: "var(--color-text-primary)" }}>
                      {member.displayName || "Member"}
                    </span>
                    {/* Checkbox indicator */}
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        background: isSelected ? "var(--color-accent)" : "transparent",
                        border: isSelected ? "none" : "1.5px solid var(--color-border)",
                      }}
                    >
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-bg-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="5,12 10,17 19,7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleCompare}
              disabled={selectedMemberIds.size === 0}
              className="w-full h-11 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
              style={{
                background: selectedMemberIds.size > 0 ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                color: selectedMemberIds.size > 0 ? "var(--color-bg-primary)" : "var(--color-disabled)",
                opacity: selectedMemberIds.size === 0 ? 0.5 : 1,
              }}
            >
              {selectedMemberIds.size > 0
                ? t.coordinateCompareCount.replace("{count}", String(selectedMemberIds.size))
                : t.coordinateCompare}
            </button>
          </>
        )}
      </div>
    );
  }

  // ─── Comparison view ───
  return (
    <div>
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer mb-3 active:opacity-70"
        style={{ color: "var(--color-accent)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        {t.coordinateBack}
      </button>

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
                boxShadow: isSelected ? "var(--shadow-card)" : "none",
              }}
            >
              <span
                className="text-[10px] font-medium uppercase leading-none"
                style={{
                  color: day.isToday ? "var(--color-accent)" : isSelected ? "var(--color-text-primary)" : "var(--color-text-muted)",
                }}
              >
                {day.dayLetter}
              </span>
              <span
                className="text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mt-0.5"
                style={{
                  background: day.isToday && isSelected ? "var(--color-accent)" : "transparent",
                  color: day.isToday && isSelected ? "var(--color-bg-primary)" : day.isToday ? "var(--color-accent)" : isSelected ? "var(--color-text-primary)" : "var(--color-text-muted)",
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
          {/* Mobile: horizontal scroll so columns are actually side by side */}
          <div className="md:hidden -mx-4 px-4 overflow-x-auto hide-scrollbar">
            <div className="flex gap-2" style={{ minWidth: `${daySchedules.length * 170}px` }}>
              {daySchedules.map((member) => (
                <div key={member.userId} className="flex-1" style={{ minWidth: "160px" }}>
                  <MemberColumn
                    displayName={member.displayName}
                    events={member.dayEvents}
                    isYou={member.userId === user?.id}
                    isOwner={member.userId === user?.id}
                    t={t}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: CSS grid side by side */}
          <div className="hidden md:grid gap-3" style={{ gridTemplateColumns: `repeat(${daySchedules.length}, 1fr)` }}>
            {daySchedules.map((member) => (
              <MemberColumn
                key={member.userId}
                displayName={member.displayName}
                events={member.dayEvents}
                isYou={member.userId === user?.id}
                isOwner={member.userId === user?.id}
                t={t}
              />
            ))}
          </div>

          <button
            onClick={() => setShowCreateEvent(true)}
            className="w-full mt-4 h-11 rounded-lg text-sm font-medium cursor-pointer flex items-center justify-center gap-2 active:opacity-80"
            style={{ background: "var(--color-bg-secondary)", color: "var(--color-accent)", border: "1px solid var(--color-border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t.coordinateCreateGroup}
          </button>
        </>
      )}

      {showCreateEvent && (
        <EventFormModal days={weekDays} initialDayKey={selectedDay} onSave={handleCreateGroupEvent} onClose={() => setShowCreateEvent(false)} />
      )}
    </div>
  );
}

function MemberColumn({ displayName, events, isYou, isOwner, t }: {
  displayName: string;
  events: CalendarEvent[];
  isYou: boolean;
  isOwner: boolean;
  t: Record<string, string>;
}) {
  // For your own column: private events show as "Busy" blocks
  const visibleEvents = events.map((event) => {
    if (isOwner && event.visibility !== "circle") {
      return { ...event, isPrivate: true };
    }
    return { ...event, isPrivate: false };
  });

  const sharedCount = visibleEvents.filter((e) => !e.isPrivate).length;
  const busyCount = visibleEvents.filter((e) => e.isPrivate).length;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--color-bg-secondary)", border: isYou ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)" }}
    >
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
          style={{ background: isYou ? "var(--color-accent)" : "var(--color-bg-tertiary)", color: isYou ? "var(--color-bg-primary)" : "var(--color-text-secondary)" }}
        >
          {(displayName || "?")[0].toUpperCase()}
        </div>
        <span className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{displayName}</span>
      </div>

      {/* Events */}
      <div className="px-2 py-2 space-y-1 min-h-[60px]">
        {visibleEvents.length === 0 ? (
          <div className="flex items-center justify-center py-3 gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-cat-health)" }} />
            <p className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>{t.coordinateFree}</p>
          </div>
        ) : (
          visibleEvents.map((event) => {
            const isDone = event.status === "completed" || event.status === "skipped";

            // Private events — show as "Busy" block
            if (event.isPrivate) {
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
                  style={{ background: "var(--color-bg-tertiary)", opacity: 0.6 }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--color-text-muted)" }} />
                  <span className="text-[10px] italic" style={{ color: "var(--color-text-muted)" }}>
                    {t.coordinatePrivateEvent}
                    {event.startTime && ` · ${formatTimeRange(event.startTime, event.endTime)}`}
                  </span>
                </div>
              );
            }

            return (
              <div key={event.id} className="flex items-start gap-1.5 rounded-lg px-2 py-1.5" style={{ opacity: isDone ? 0.5 : 1 }}>
                <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: categoryConfig[event.category].colorVar }} />
                <div className="min-w-0 flex-1">
                  <span className={`text-xs leading-snug block truncate ${isDone ? "line-through" : ""}`} style={{ color: "var(--color-text-primary)" }}>{event.title}</span>
                  {event.startTime && (
                    <span className="text-[10px] block" style={{ color: "var(--color-text-muted)" }}>{formatTimeRange(event.startTime, event.endTime)}</span>
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
