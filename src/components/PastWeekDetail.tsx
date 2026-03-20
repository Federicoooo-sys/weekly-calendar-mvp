"use client";

import { getStrings } from "@/constants/strings";
import { categoryConfig, CATEGORY_LABEL_KEYS } from "@/constants/categories";
import { formatWeekRange, formatTimeRange } from "@/lib/dates";
import { getPastWeekDays, type WeekSummary } from "@/lib/history";
import type { Week, CalendarEvent } from "@/types";

interface PastWeekDetailProps {
  week: Week;
  summary: WeekSummary;
  onBack: () => void;
}

export default function PastWeekDetail({ week, summary, onBack }: PastWeekDetailProps) {
  const strings = getStrings();
  const dateRange = formatWeekRange(week.weekStart);
  const days = getPastWeekDays(week);
  const daysWithEvents = days.filter((d) => d.events.length > 0);

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer -ml-1"
          style={{ color: "var(--color-text-secondary)" }}
          aria-label={strings.historyBack}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="10,3 5,8 10,13" />
          </svg>
        </button>
        <div>
          <h2
            className="text-lg font-semibold md:text-xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            {dateRange}
          </h2>
        </div>
      </div>

      {/* Read-only badge */}
      <p
        className="text-[11px] mb-5 ml-11"
        style={{ color: "var(--color-text-muted)" }}
      >
        {strings.historyReadOnly}
      </p>

      {/* Summary stats */}
      {summary.total > 0 && <SummaryBar summary={summary} />}

      {/* Day-by-day events */}
      {daysWithEvents.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {strings.historyNoEventsWeek}
          </p>
        </div>
      ) : (
        <div className="space-y-5 mt-5">
          {daysWithEvents.map((day) => (
            <div key={day.dayKey}>
              {/* Day header */}
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {day.dayLabel}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {day.dateLabel}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-1.5">
                {day.events.map((event) => (
                  <ReadOnlyEventRow key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryBar({ summary }: { summary: WeekSummary }) {
  const strings = getStrings();
  return (
    <div
      className="rounded-xl px-4 py-3 ml-0"
      style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
    >
      {/* Completion rate — prominent */}
      <div className="mb-2">
        <span
          className="text-sm font-semibold"
          style={{
            color: summary.completionRate >= 70
              ? "var(--color-success)"
              : summary.completionRate >= 40
                ? "var(--color-warning)"
                : "var(--color-text-muted)",
          }}
        >
          {strings.historySummaryRate.replace("{rate}", String(summary.completionRate))}
        </span>
      </div>

      {/* Stat pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatPill
          label={strings.historySummaryTotal.replace("{count}", String(summary.total))}
          color="var(--color-text-secondary)"
        />
        {summary.completed > 0 && (
          <StatPill
            label={strings.historySummaryCompleted.replace("{count}", String(summary.completed))}
            color="var(--color-success)"
          />
        )}
        {summary.skipped > 0 && (
          <StatPill
            label={strings.historySummarySkipped.replace("{count}", String(summary.skipped))}
            color="var(--color-text-muted)"
          />
        )}
        {summary.unresolved > 0 && (
          <StatPill
            label={strings.historySummaryUnresolved.replace("{count}", String(summary.unresolved))}
            color="var(--color-warning)"
          />
        )}
      </div>
    </div>
  );
}

function StatPill({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs font-medium" style={{ color }}>
      {label}
    </span>
  );
}

function ReadOnlyEventRow({ event }: { event: CalendarEvent }) {
  const strings = getStrings();
  const isCompleted = event.status === "completed";
  const isSkipped = event.status === "skipped";
  const isDimmed = isCompleted || isSkipped;

  return (
    <div
      className="flex items-start gap-3 rounded-lg px-3 py-2.5"
      style={{
        background: "var(--color-bg-secondary)",
        opacity: isDimmed ? 0.7 : 1,
      }}
    >
      {/* Status indicator — static, not clickable */}
      <div
        className="w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
        style={{
          border: isCompleted
            ? "none"
            : `2px solid ${isSkipped ? "var(--color-text-muted)" : categoryConfig[event.category].colorVar}`,
          background: isCompleted ? "var(--color-success)" : "transparent",
        }}
      >
        {isCompleted && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--color-bg-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2.5,6 5,8.5 9.5,3.5" />
          </svg>
        )}
        {isSkipped && (
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2.5" y1="2.5" x2="7.5" y2="7.5" />
            <line x1="7.5" y1="2.5" x2="2.5" y2="7.5" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Title */}
        <span
          className={`text-sm leading-snug block ${isDimmed ? "line-through" : ""}`}
          style={{
            color: isDimmed ? "var(--color-text-muted)" : "var(--color-text-primary)",
          }}
        >
          {event.title}
        </span>

        {/* Time + category */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {event.startTime && (
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {formatTimeRange(event.startTime, event.endTime)}
            </span>
          )}
          <span
            className="text-xs"
            style={{ color: categoryConfig[event.category].colorVar }}
          >
            {event.startTime ? "· " : ""}{strings[CATEGORY_LABEL_KEYS[event.category]]}
          </span>
        </div>

        {/* Note */}
        {event.note && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
            {event.note}
          </p>
        )}
      </div>
    </div>
  );
}
