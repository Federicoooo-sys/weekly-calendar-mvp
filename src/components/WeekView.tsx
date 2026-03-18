"use client";

import { useMemo, useState } from "react";
import { getCurrentWeekDays, getCurrentWeekStart, formatWeekRange } from "@/lib/dates";
import { useWeekStorage } from "@/hooks/useWeekStorage";
import WeekGrid from "./WeekGrid";
import MobileWeekView from "./MobileWeekView";
import EventFormModal, { type EventFormData } from "./EventFormModal";
import { strings } from "@/constants/strings";
import type { CalendarEvent, DayOfWeek } from "@/types";

/** Modal can be in add mode (just a dayKey) or edit mode (an existing event). */
type ModalState =
  | { mode: "add"; dayKey: DayOfWeek }
  | { mode: "edit"; event: CalendarEvent }
  | null;

export default function WeekView() {
  const { week, addEvent, updateEvent, deleteEvent } = useWeekStorage();
  const weekDays = getCurrentWeekDays("mon");
  const weekRange = formatWeekRange(getCurrentWeekStart());

  const [modalState, setModalState] = useState<ModalState>(null);

  // Group events by day — computed once, shared by both layouts
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const day of weekDays) {
      grouped[day.dayKey] = week.events.filter((e) => e.dayKey === day.dayKey);
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
      });
    } else {
      addEvent({
        title: data.title,
        dayKey: data.dayKey,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        category: data.category,
        note: data.note || undefined,
      });
    }
    setModalState(null);
  }

  function handleDelete(id: string) {
    deleteEvent(id);
    setModalState(null);
  }

  function handleCloseModal() {
    setModalState(null);
  }

  return (
    <div>
      {/* Week header — title and date range on one line */}
      <div className="flex items-baseline gap-2 mb-4">
        <h2
          className="text-lg font-semibold md:text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          {strings.weekPageTitle}
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
          · {totalEvents} {totalEvents === 1 ? strings.eventCount.replace("{count}", "1") : strings.eventCountPlural.replace("{count}", String(totalEvents))}
        </span>
      </div>

      {/* Desktop: time grid calendar */}
      <div className="hidden md:block">
        <WeekGrid days={weekDays} eventsByDay={eventsByDay} onAddEvent={handleAddEvent} onEventClick={handleEditEvent} />
      </div>

      {/* Mobile: week strip + day timeline */}
      <div className="md:hidden">
        <MobileWeekView days={weekDays} eventsByDay={eventsByDay} onAddEvent={handleAddEvent} onEventClick={handleEditEvent} />
      </div>

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
