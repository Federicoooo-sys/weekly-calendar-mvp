"use client";

import { useMemo, useState } from "react";
import { getCurrentWeekDays, getCurrentWeekStart, formatWeekRange } from "@/lib/dates";
import { useWeekStorage } from "@/hooks/useWeekStorage";
import WeekGrid from "./WeekGrid";
import MobileWeekView from "./MobileWeekView";
import EventFormModal, { type EventFormData } from "./EventFormModal";
import { usePreferences } from "@/hooks/usePreferences";
import type { CalendarEvent, DayOfWeek } from "@/types";

/** Modal can be in add mode (just a dayKey) or edit mode (an existing event). */
type ModalState =
  | { mode: "add"; dayKey: DayOfWeek }
  | { mode: "edit"; event: CalendarEvent }
  | null;

export default function WeekView() {
  const { t } = usePreferences();
  const { week, loading, error, addEvent, updateEvent, deleteEvent } = useWeekStorage();
  const weekDays = getCurrentWeekDays("mon");
  const weekRange = formatWeekRange(getCurrentWeekStart());

  const [modalState, setModalState] = useState<ModalState>(null);

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

      {/* Desktop: time grid calendar */}
      <div className="hidden md:block">
        <WeekGrid days={weekDays} eventsByDay={eventsByDay} onAddEvent={handleAddEvent} onEventClick={handleEditEvent} onStatusToggle={handleStatusToggle} />
      </div>

      {/* Mobile: week strip + day timeline */}
      <div className="md:hidden">
        <MobileWeekView days={weekDays} eventsByDay={eventsByDay} onAddEvent={handleAddEvent} onEventClick={handleEditEvent} onStatusToggle={handleStatusToggle} />
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
        />
      )}
    </div>
  );
}
