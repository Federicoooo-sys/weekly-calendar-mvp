"use client";

import { useState, useMemo } from "react";
import PageShell from "@/components/PageShell";
import PastWeekDetail from "@/components/PastWeekDetail";
import { getStrings } from "@/constants/strings";
import { categoryConfig, CATEGORY_LABEL_KEYS } from "@/constants/categories";
import { formatWeekRange } from "@/lib/dates";
import { getPastWeeks, getWeekSummary, type WeekSummary } from "@/lib/history";
import type { Week, EventCategory } from "@/types";

export default function HistoryPage() {
  const strings = getStrings();
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

  const pastWeeks = useMemo(() => getPastWeeks(), []);
  const summaries = useMemo(
    () => new Map(pastWeeks.map((w) => [w.weekStart, getWeekSummary(w)])),
    [pastWeeks],
  );

  if (selectedWeek) {
    return (
      <PastWeekDetail
        week={selectedWeek}
        summary={summaries.get(selectedWeek.weekStart)!}
        onBack={() => setSelectedWeek(null)}
      />
    );
  }

  return (
    <PageShell title={strings.historyPageTitle}>
      {pastWeeks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {pastWeeks.map((week) => (
            <WeekCard
              key={week.weekStart}
              week={week}
              summary={summaries.get(week.weekStart)!}
              onClick={() => setSelectedWeek(week)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function EmptyState() {
  const strings = getStrings();
  return (
    <div className="mt-8 flex flex-col items-center text-center max-w-sm mx-auto">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--color-bg-tertiary)" }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-text-muted)" }}
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        {strings.historyNoWeeks}
      </p>
    </div>
  );
}

function WeekCard({
  week,
  summary,
  onClick,
}: {
  week: Week;
  summary: WeekSummary;
  onClick: () => void;
}) {
  const strings = getStrings();
  const dateRange = formatWeekRange(week.weekStart);

  // Top categories (non-zero, sorted by count, max 3)
  const topCategories = (Object.entries(summary.byCategory) as [EventCategory, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl px-4 py-3.5 cursor-pointer transition-colors active:scale-[0.99]"
      style={{
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Row 1: date range + completion rate */}
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {dateRange}
        </span>
        {summary.total > 0 && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: summary.completionRate >= 70
                ? "var(--color-cat-health)"
                : summary.completionRate >= 40
                  ? "var(--color-cat-errand)"
                  : "var(--color-text-muted)",
              color: "var(--color-bg-primary)",
            }}
          >
            {summary.completionRate}%
          </span>
        )}
      </div>

      {/* Row 2: event stats */}
      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {strings.historySummaryTotal.replace("{count}", String(summary.total))}
        </span>
        {summary.completed > 0 && (
          <span className="text-xs" style={{ color: "var(--color-cat-health)" }}>
            {summary.completed} ✓
          </span>
        )}
        {summary.skipped > 0 && (
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {summary.skipped} ✗
          </span>
        )}
        {summary.unresolved > 0 && (
          <span className="text-xs" style={{ color: "var(--color-cat-errand)" }}>
            {summary.unresolved} —
          </span>
        )}
      </div>

      {/* Row 3: category dots */}
      {topCategories.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          {topCategories.map(([cat, count]) => (
            <span key={cat} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: categoryConfig[cat].colorVar }}
              />
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                {strings[CATEGORY_LABEL_KEYS[cat]]} ({count})
              </span>
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
