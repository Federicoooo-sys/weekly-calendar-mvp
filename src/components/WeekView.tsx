"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentWeekDays, getCurrentWeekStart, formatWeekRange } from "@/lib/dates";
import { useWeekStorage } from "@/hooks/useWeekStorage";
import WeekGrid from "./WeekGrid";
import MobileWeekView from "./MobileWeekView";
import EventFormModal, { type EventFormData } from "./EventFormModal";
import { usePreferences } from "@/hooks/usePreferences";
import { useEventParticipantAvatars, type ParticipantAvatar } from "@/hooks/useEventParticipantAvatars";
import type { CalendarEvent, DayOfWeek } from "@/types";

/** Modal can be in add mode (just a dayKey) or edit mode (an existing event). */
type ModalState =
  | { mode: "add"; dayKey: DayOfWeek }
  | { mode: "edit"; event: CalendarEvent; openToThread?: boolean }
  | null;

export default function WeekView() {
  const { t } = usePreferences();
  const { week, loading, error, addEvent, updateEvent, deleteEvent } = useWeekStorage();
  const weekDays = getCurrentWeekDays("mon");
  const weekRange = formatWeekRange(getCurrentWeekStart());
  const searchParams = useSearchParams();
  const router = useRouter();

  const [modalState, setModalState] = useState<ModalState>(null);

  // Open event from URL param (e.g. ?event=<id> from notification click)
  useEffect(() => {
    const eventId = searchParams.get("event");
    if (!eventId || loading || week.events.length === 0) return;

    const event = week.events.find((e) => e.id === eventId);
    if (event) {
      setModalState({ mode: "edit", event, openToThread: true });
      // Clear the param so it doesn't re-trigger
      router.replace("/", { scroll: false });
    }
  }, [searchParams, week.events, loading, router]);

  // Group events by day in a single pass — O(n) instead of O(n*7)
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const day of weekDays) {
      grouped[day.dayKey] = [];
    }
    for (const event of week.events) {
      if (grouped[event.dayKey]) {
        grouped[event.dayKey].push(event);
      }
    }
    return grouped;
  }, [week.events, weekDays]);

  const totalEvents = week.events.length;

  // Load participant avatars for circle events
  const circleEventIds = useMemo(
    () => week.events.filter((e) => e.visibility === "circle").map((e) => e.id),
    [week.events]
  );
  const participantAvatars = useEventParticipantAvatars(circleEventIds);

  function handleAddEvent(dayKey: DayOfWeek) {
    setModalState({ mode: "add", dayKey });
  }

  function handleEditEvent(event: CalendarEvent) {
    setModalState({ mode: "edit", event });
  }

  function handleSave(data: EventFormData) {
    if (modalState?.mode === "edit") {
      updateEvent(modalState.event.id, {
        title: data.title.trim(),
        dayKey: data.dayKey,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        category: data.category,
        note: data.note?.trim() || undefined,
        status: data.status,
        visibility: data.visibility,
      });
    } else {
      addEvent({
        title: data.title,
        dayKey: data.dayKey,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        category: data.category,
        note: data.note || undefined,
        visibility: data.visibility,
      });
    }
    setModalState(null);
  }

  function handleDelete(id: string) {
    deleteEvent(id);
    setModalState(null);
  }

  function handleStatusToggle(event: CalendarEvent) {
    const newStatus = event.status === "completed" ? "planned" : "completed";
    updateEvent(event.id, { status: newStatus });
  }

  function handleCloseModal() {
    setModalState(null);
  }

  const todayKey = weekDays.find((d) => d.isToday)?.dayKey ?? weekDays[0].dayKey;

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div
          className="mb-4 px-3 py-2 rounded-lg text-sm"
          style={{ background: "var(--color-bg-tertiary)", color: "var(--color-danger)" }}
        >
          {t.errorLoadFailed}
        </div>
      )}

      {/* Week header — title and date range on one line */}
      <div className="flex items-baseline gap-2 mb-4">
        <h2
          className="text-lg font-semibold md:text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t.weekPageTitle}
        </h2>
        <span
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {weekRange}
        </span>
        <span
          className="text-xs hidden md:inline"
          style={{ color: "var(--color-text-muted)" }}
        >
          · {totalEvents} {totalEvents === 1 ? t.eventCount.replace("{count}", "1") : t.eventCountPlural.replace("{count}", String(totalEvents))}
        </span>
      </div>

      {/* First-time empty week hint */}
      {totalEvents === 0 && !loading && (
        <div
          className="text-center py-8 mb-2 rounded-xl"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--color-bg-tertiary)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            {t.emptyWeekTitle}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t.emptyWeekHint}
          </p>
        </div>
      )}

      {/* Desktop: time grid calendar */}
      <div className="hidden md:block">
        <WeekGrid days={weekDays} eventsByDay={eventsByDay} onAddEvent={handleAddEvent} onEventClick={handleEditEvent} onStatusToggle={handleStatusToggle} participantAvatars={participantAvatars} />
      </div>

      {/* Mobile: week strip + day timeline */}
      <div className="md:hidden">
        <MobileWeekView days={weekDays} eventsByDay={eventsByDay} onAddEvent={handleAddEvent} onEventClick={handleEditEvent} onStatusToggle={handleStatusToggle} participantAvatars={participantAvatars} />
      </div>

      {/* Floating add button — bottom-right, above bottom nav on mobile */}
      <button
        onClick={() => handleAddEvent(todayKey)}
        className="fixed right-5 bottom-20 md:bottom-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform active:scale-90 hover:scale-105"
        style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
        aria-label={t.addEvent}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Add/Edit event modal */}
      {modalState && (
        <EventFormModal
          days={weekDays}
          initialDayKey={modalState.mode === "add" ? modalState.dayKey : modalState.event.dayKey}
          event={modalState.mode === "edit" ? modalState.event : undefined}
          onSave={handleSave}
          onDelete={modalState.mode === "edit" ? handleDelete : undefined}
          onClose={handleCloseModal}
          openToThread={modalState.mode === "edit" ? modalState.openToThread : undefined}
        />
      )}
    </div>
  );
}
