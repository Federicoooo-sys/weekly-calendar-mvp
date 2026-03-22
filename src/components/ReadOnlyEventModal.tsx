"use client";

import { usePreferences } from "@/hooks/usePreferences";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { formatTimeRange } from "@/lib/dates";
import { categoryConfig, CATEGORY_LABEL_KEYS } from "@/constants/categories";
import CommentThread from "./CommentThread";
import { useAuth } from "@/hooks/useAuth";
import type { CalendarEvent, DayOfWeek } from "@/types";

interface ReadOnlyEventModalProps {
  event: CalendarEvent;
  onClose: () => void;
}

export default function ReadOnlyEventModal({ event, onClose }: ReadOnlyEventModalProps) {
  const { t } = usePreferences();
  const { user } = useAuth();

  const DAY_LABELS: Record<DayOfWeek, string> = {
    mon: t.dayMonShort,
    tue: t.dayTueShort,
    wed: t.dayWedShort,
    thu: t.dayThuShort,
    fri: t.dayFriShort,
    sat: t.daySatShort,
    sun: t.daySunShort,
  };

  // Close on Escape
  useEscapeKey(onClose);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: "var(--color-overlay)" }} onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full md:max-w-md md:mx-4 rounded-t-2xl md:rounded-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-6 animate-slideUp md:animate-fadeIn"
        style={{
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          maxHeight: "90vh",
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
            {event.title}
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

        {/* Read-only badge */}
        <div
          className="flex items-center gap-1.5 mb-4 px-3 py-2 rounded-lg"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {t.inviteRequestReadOnly}
          </span>
        </div>

        {/* Event details */}
        <div className="space-y-3 mb-4">
          {/* Owner */}
          {event.ownerName && (
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {t.inviteRequestFrom.replace("{name}", event.ownerName)}
            </p>
          )}

          {/* Category */}
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-block"
            style={{
              background: categoryConfig[event.category].colorVar,
              color: "var(--color-bg-primary)",
            }}
          >
            {t[CATEGORY_LABEL_KEYS[event.category]]}
          </span>

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
            {event.startTime && (
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {t.inviteRequestTime}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {formatTimeRange(event.startTime, event.endTime)}
                </span>
              </div>
            )}
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
        </div>

        {/* Comment thread */}
        {event.visibility === "circle" && (
          <CommentThread
            eventId={event.id}
            eventOwnerId={event.ownerId}
            eventTitle={event.title}
          />
        )}

        {/* Close button */}
        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-lg text-sm font-medium cursor-pointer"
            style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
}
