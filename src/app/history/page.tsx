"use client";

import { useState, useMemo, useEffect } from "react";
import PageShell from "@/components/PageShell";
import PastWeekDetail from "@/components/PastWeekDetail";
import ShareSummaryModal from "@/components/ShareSummaryModal";
import { getStrings } from "@/constants/strings";
import { categoryConfig, CATEGORY_LABEL_KEYS } from "@/constants/categories";
import { formatWeekRange } from "@/lib/dates";
import { getPastWeeks, getWeekSummary, type WeekSummary } from "@/lib/history";
import { useAuth } from "@/hooks/useAuth";
import { useCircle } from "@/hooks/useCircle";
import { useWeeklyShares } from "@/hooks/useWeeklyShares";
import type { Week, EventCategory } from "@/types";

export default function HistoryPage() {
  const strings = getStrings();
  const { user } = useAuth();
  const { circles } = useCircle();
  const circleIds = useMemo(() => circles.map((c) => c.id), [circles]);
  const { shareWeek, isShared } = useWeeklyShares(circleIds);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [shareTarget, setShareTarget] = useState<{ weekStart: string; summary: WeekSummary } | null>(null);
  const [pastWeeks, setPastWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPastWeeks([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getPastWeeks(user.id).then((weeks) => {
      if (!cancelled) {
        setPastWeeks(weeks);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [user]);

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
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
        </div>
      ) : pastWeeks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {pastWeeks.map((week) => {
            const summary = summaries.get(week.weekStart)!;
            return (
              <WeekCard
                key={week.weekStart}
                week={week}
                summary={summary}
                onClick={() => setSelectedWeek(week)}
                hasCircles={circles.length > 0}
                onShare={() => setShareTarget({ weekStart: week.weekStart, summary })}
              />
            );
          })}
        </div>
      )}

      {/* Share summary modal */}
      {shareTarget && (
        <ShareSummaryModal
          weekStart={shareTarget.weekStart}
          summary={shareTarget.summary}
          circles={circles}
          alreadySharedCircleIds={
            circles.filter((c) => isShared(shareTarget.weekStart, c.id)).map((c) => c.id)
          }
          onShare={async (circleId, reflectionNote) => {
            const circle = circles.find((c) => c.id === circleId);
            return shareWeek({
              circleId,
              weekStart: shareTarget.weekStart,
              summary: shareTarget.summary,
              reflectionNote,
              circleMemberIds: circle?.members.map((m) => m.userId) || [],
            });
          }}
          onClose={() => setShareTarget(null)}
        />
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
  hasCircles,
  onShare,
}: {
  week: Week;
  summary: WeekSummary;
  onClick: () => void;
  hasCircles: boolean;
  onShare: () => void;
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
                ? "var(--color-success)"
                : summary.completionRate >= 40
                  ? "var(--color-warning)"
                  : "var(--color-disabled)",
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
          <span className="text-xs" style={{ color: "var(--color-success)" }}>
            {summary.completed} ✓
          </span>
        )}
        {summary.skipped > 0 && (
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {summary.skipped} ✗
          </span>
        )}
        {summary.unresolved > 0 && (
          <span className="text-xs" style={{ color: "var(--color-warning)" }}>
            {summary.unresolved} —
          </span>
        )}
      </div>

      {/* Row 3: category dots + share */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
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
        {hasCircles && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="text-[10px] font-medium px-2 py-1 rounded-md cursor-pointer shrink-0"
            style={{ color: "var(--color-accent)", background: "var(--color-bg-tertiary)" }}
          >
            {strings.shareButton}
          </button>
        )}
      </div>
    </button>
  );
}
