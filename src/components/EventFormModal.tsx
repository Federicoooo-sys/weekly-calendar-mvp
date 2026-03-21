"use client";

import { useState, useEffect, useRef } from "react";
import { getStrings } from "@/constants/strings";
import { categoryConfig, CATEGORY_LABEL_KEYS } from "@/constants/categories";
import { getTimeSlots } from "@/lib/dates";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { useCircle } from "@/hooks/useCircle";
import { useAuth } from "@/hooks/useAuth";
import ParticipantList from "./ParticipantList";
import InviteToEventModal from "./InviteToEventModal";
import CommentThread from "./CommentThread";
import type { CalendarEvent, DayInfo, DayOfWeek, EventCategory, EventStatus, EventVisibility } from "@/types";

const CATEGORIES: EventCategory[] = ["work", "personal", "health", "errand", "other"];

/** Time options for the select dropdowns — 15-min increments rendered once. */
const TIME_OPTIONS = getTimeSlots().map((slot) => ({
  value: slot.time,
  label: slot.label,
}));

export interface EventFormData {
  title: string;
  dayKey: DayOfWeek;
  startTime: string;
  endTime: string;
  category: EventCategory;
  note: string;
  status: EventStatus;
  visibility: EventVisibility;
}

interface EventFormModalProps {
  /** Days available to select from (current week) */
  days: DayInfo[];
  /** Pre-selected day when opening in add mode */
  initialDayKey: DayOfWeek;
  /** Existing event to edit — when provided, the form prefills and shows delete */
  event?: CalendarEvent;
  /** Called with the form data when the user saves */
  onSave: (data: EventFormData) => void;
  /** Called when the user confirms deletion (edit mode only) */
  onDelete?: (id: string) => void;
  /** Called when the modal is dismissed */
  onClose: () => void;
  /** Auto-focus the comment thread (used when opening from a notification) */
  openToThread?: boolean;
}

export default function EventFormModal({ days, initialDayKey, event, onSave, onDelete, onClose, openToThread }: EventFormModalProps) {
  const strings = getStrings();
  const isEditing = !!event;

  const [title, setTitle] = useState(event?.title ?? "");
  const [dayKey, setDayKey] = useState<DayOfWeek>(event?.dayKey ?? initialDayKey);
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const [endTime, setEndTime] = useState(event?.endTime ?? "");
  const [category, setCategory] = useState<EventCategory>(event?.category ?? "other");
  const [note, setNote] = useState(event?.note ?? "");
  const [status, setStatus] = useState<EventStatus>(event?.status ?? "planned");
  const [visibility, setVisibility] = useState<EventVisibility>(event?.visibility ?? "private");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { circles } = useCircle();

  // Participants — only loaded for circle-visible events in edit mode
  const showParticipants = isEditing && event?.visibility === "circle";
  const {
    participants,
    loading: participantsLoading,
    inviteUser,
    respond,
  } = useEventParticipants(showParticipants ? event?.id ?? null : null);

  // Eligible circle members for invite (exclude self and already-participating)
  const eligibleMembers = (() => {
    if (!showParticipants || !user) return [];
    const participantIds = new Set(participants.map((p) => p.userId));
    const members: { userId: string; displayName: string }[] = [];
    for (const circle of circles) {
      for (const m of circle.members) {
        if (m.userId !== user.id && !participantIds.has(m.userId) && !members.some((e) => e.userId === m.userId)) {
          members.push({ userId: m.userId, displayName: m.displayName });
        }
      }
    }
    return members;
  })();

  // Auto-focus the title input on mount
  useEffect(() => {
    const timer = setTimeout(() => titleRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Validation
  const titleValid = title.trim().length > 0;
  const timeValid = !startTime || !endTime || endTime > startTime;
  const canSave = titleValid && timeValid;

  function handleSave() {
    if (!canSave) return;
    onSave({ title, dayKey, startTime, endTime, category, note, status, visibility });
  }

  function handleDelete() {
    if (!event || !onDelete) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    onDelete(event.id);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && canSave && e.target instanceof HTMLInputElement) {
      handleSave();
    }
  }

  const inputClasses =
    "w-full h-11 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1";

  const selectClasses =
    "w-full h-11 rounded-lg px-3 text-sm appearance-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1";

  return (
    // Backdrop — handles dismiss on click outside the modal
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? strings.editEvent : strings.addEvent}
    >
      {/* Dim overlay — click to dismiss */}
      <div className="absolute inset-0" style={{ background: "var(--color-overlay)" }} onClick={onClose} />

      {/* Modal / Sheet container */}
      <div
        className="relative w-full md:max-w-md md:mx-4 rounded-t-2xl md:rounded-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-6 animate-slideUp md:animate-fadeIn"
        style={{
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle — mobile sheet affordance */}
        <div className="flex justify-center mb-3 md:hidden">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "var(--color-border)" }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {isEditing ? strings.editEvent : strings.addEvent}
          </h3>
          {/* Close button — 44px touch target via padding, 32px visual */}
          <button
            onClick={onClose}
            className="-mr-2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
            style={{ color: "var(--color-text-muted)" }}
            aria-label={strings.cancel}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 md:space-y-4" onKeyDown={handleKeyDown}>
          {/* Title */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {strings.fieldTitle}
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTitleTouched(true)}
              placeholder={strings.fieldTitlePlaceholder}
              className={inputClasses}
              style={{
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-primary)",
                border: titleTouched && !titleValid
                  ? "1px solid var(--color-danger)"
                  : "1px solid var(--color-border)",
              }}
            />
            {titleTouched && !titleValid && (
              <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>
                {strings.validationTitleRequired}
              </p>
            )}
          </div>

          {/* Day */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {strings.fieldDay}
            </label>
            <select
              value={dayKey}
              onChange={(e) => setDayKey(e.target.value as DayOfWeek)}
              className={selectClasses}
              style={{
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
              }}
            >
              {days.map((day) => (
                <option key={day.dayKey} value={day.dayKey}>
                  {day.dayLabel} — {day.dateLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Time row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {strings.fieldStartTime}
              </label>
              <select
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (endTime && e.target.value && endTime <= e.target.value) {
                    setEndTime("");
                  }
                }}
                className={selectClasses}
                style={{
                  background: "var(--color-bg-secondary)",
                  color: startTime ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <option value="">—</option>
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {strings.fieldEndTime}
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!startTime}
                className={selectClasses}
                style={{
                  background: "var(--color-bg-secondary)",
                  color: endTime ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                  opacity: startTime ? 1 : 0.5,
                }}
              >
                <option value="">—</option>
                {TIME_OPTIONS.filter((opt) => !startTime || opt.value > startTime).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time validation error */}
          {!timeValid && (
            <p className="text-xs" style={{ color: "var(--color-danger)" }}>
              {strings.validationEndTimeAfterStart}
            </p>
          )}

          {/* Category */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {strings.fieldCategory}
            </label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => {
                const isSelected = cat === category;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer transition-colors"
                    style={{
                      background: isSelected
                        ? categoryConfig[cat].colorVar
                        : "var(--color-bg-secondary)",
                      color: isSelected
                        ? "var(--color-bg-primary)"
                        : "var(--color-text-secondary)",
                      border: isSelected
                        ? "1px solid transparent"
                        : "1px solid var(--color-border)",
                    }}
                  >
                    {strings[CATEGORY_LABEL_KEYS[cat]]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status — edit mode only */}
          {isEditing && (
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {strings.fieldStatus}
              </label>
              <div className="flex gap-2">
                {(["planned", "completed", "skipped"] as EventStatus[]).map((s) => {
                  const isSelected = s === status;
                  const labelKey = s === "planned" ? "statusPlanned" : s === "completed" ? "statusCompleted" : "statusSkipped";
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className="px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer transition-colors"
                      style={{
                        background: isSelected
                          ? s === "completed" ? "var(--color-success)" : s === "skipped" ? "var(--color-disabled)" : "var(--color-accent)"
                          : "var(--color-bg-secondary)",
                        color: isSelected
                          ? "var(--color-bg-primary)"
                          : "var(--color-text-secondary)",
                        border: isSelected
                          ? "1px solid transparent"
                          : "1px solid var(--color-border)",
                      }}
                    >
                      {strings[labelKey]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visibility */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {strings.visibilityLabel}
            </label>
            <div className="flex gap-2">
              {(["private", "circle"] as EventVisibility[]).map((v) => {
                const isSelected = v === visibility;
                return (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer transition-colors"
                    style={{
                      background: isSelected
                        ? v === "circle" ? "var(--color-accent)" : "var(--color-bg-tertiary)"
                        : "var(--color-bg-secondary)",
                      color: isSelected
                        ? v === "circle" ? "var(--color-bg-primary)" : "var(--color-text-primary)"
                        : "var(--color-text-secondary)",
                      border: isSelected
                        ? "1px solid transparent"
                        : "1px solid var(--color-border)",
                    }}
                  >
                    {v === "private" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    )}
                    {v === "private" ? strings.visibilityPrivate : strings.visibilityCircle}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {strings.fieldNote}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={strings.fieldNotePlaceholder}
              rows={2}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
              style={{
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
              }}
            />
          </div>

          {/* Comment thread — edit mode only */}
          {isEditing && event && (
            <CommentThread
              eventId={event.id}
              eventOwnerId={user?.id}
              eventTitle={event.title}
              autoFocus={openToThread}
            />
          )}

          {/* Participants — only for circle events in edit mode */}
          {showParticipants && !participantsLoading && (
            <div>
              {participants.length > 0 && (
                <ParticipantList
                  participants={participants}
                  isOwner={true}
                  currentUserId={user?.id}
                  onAccept={async (pid, notifyUserId) => {
                    await respond(pid, "accepted", {
                      actorName: "",
                      eventTitle: event?.title || "",
                      notifyUserId,
                    });
                  }}
                  onDecline={async (pid, notifyUserId) => {
                    await respond(pid, "declined", {
                      actorName: "",
                      eventTitle: event?.title || "",
                      notifyUserId,
                    });
                  }}
                />
              )}
              {eligibleMembers.length > 0 && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="mt-2 text-xs font-medium px-3 py-2 rounded-lg cursor-pointer"
                  style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
                >
                  {strings.inviteToEvent}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions — layout differs between mobile and desktop */}
        <div className="mt-6 space-y-2">
          {/* Save + Cancel row — always at the bottom for thumb reach */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 md:flex-none h-11 px-4 rounded-lg text-sm font-medium cursor-pointer"
              style={{
                color: "var(--color-text-secondary)",
                background: "var(--color-bg-secondary)",
              }}
            >
              {strings.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-[2] md:flex-none h-11 px-5 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
              style={{
                background: canSave ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                color: canSave ? "var(--color-bg-primary)" : "var(--color-disabled)",
              }}
            >
              {strings.save}
            </button>
          </div>

          {/* Delete — separate row, visually de-emphasized */}
          {isEditing && onDelete && (
            <button
              onClick={handleDelete}
              className="w-full h-10 rounded-lg text-sm font-medium cursor-pointer transition-colors"
              style={{
                color: confirmingDelete ? "var(--color-bg-primary)" : "var(--color-text-muted)",
                background: confirmingDelete ? "var(--color-danger)" : "transparent",
              }}
            >
              {confirmingDelete ? strings.confirmDelete : strings.delete}
            </button>
          )}
        </div>

        {/* Invite to event modal */}
        {showInviteModal && event && (
          <InviteToEventModal
            eventTitle={event.title}
            eligibleMembers={eligibleMembers}
            participants={participants}
            onInvite={async (userId) => inviteUser(userId, event.title)}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </div>
    </div>
  );
}
