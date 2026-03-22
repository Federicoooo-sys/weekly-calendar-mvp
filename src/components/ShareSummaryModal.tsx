"use client";

import { useState, useEffect } from "react";
import { getStrings } from "@/constants/strings";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { formatWeekRange } from "@/lib/dates";
import type { WeekSummary } from "@/lib/history";
import type { CircleWithMembers } from "@/types";

interface ShareSummaryModalProps {
  weekStart: string;
  summary: WeekSummary;
  circles: CircleWithMembers[];
  alreadySharedCircleIds: string[];
  onShare: (circleId: string, reflectionNote?: string) => Promise<{ error: string | null }>;
  onClose: () => void;
}

export default function ShareSummaryModal({
  weekStart,
  summary,
  circles,
  alreadySharedCircleIds,
  onShare,
  onClose,
}: ShareSummaryModalProps) {
  const strings = getStrings();
  const [selectedCircleId, setSelectedCircleId] = useState("");
  const [reflectionNote, setReflectionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableCircles = circles.filter(
    (c) => !alreadySharedCircleIds.includes(c.id)
  );

  // Auto-select first available circle
  useEffect(() => {
    if (availableCircles.length > 0 && !selectedCircleId) {
      setSelectedCircleId(availableCircles[0].id);
    }
  }, [availableCircles, selectedCircleId]);

  // Close on Escape
  useEscapeKey(onClose);

  async function handleShare() {
    if (!selectedCircleId || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await onShare(selectedCircleId, reflectionNote || undefined);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      onClose();
    }
  }

  const weekRange = formatWeekRange(weekStart);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" style={{ background: "var(--color-overlay)" }} onClick={onClose} />

      <div
        className="relative w-full md:max-w-sm md:mx-4 rounded-t-2xl md:rounded-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-6 animate-slideUp md:animate-fadeIn"
        style={{
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Drag handle — mobile */}
        <div className="flex justify-center mb-3 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {strings.shareWithCircle}
          </h3>
          <button
            onClick={onClose}
            className="-mr-2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
            style={{ color: "var(--color-text-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        {/* Summary preview */}
        <div
          className="p-3 rounded-lg mb-4"
          style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            {weekRange}
          </p>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span>{strings.historySummaryTotal.replace("{count}", String(summary.total))}</span>
            {summary.completed > 0 && (
              <span style={{ color: "var(--color-success)" }}>{summary.completed} ✓</span>
            )}
            {summary.skipped > 0 && (
              <span>{summary.skipped} ✗</span>
            )}
            <span
              className="font-medium px-1.5 py-0.5 rounded-full text-[10px]"
              style={{
                background: summary.completionRate >= 70 ? "var(--color-success)" : summary.completionRate >= 40 ? "var(--color-warning)" : "var(--color-disabled)",
                color: "var(--color-bg-primary)",
              }}
            >
              {summary.completionRate}%
            </span>
          </div>
        </div>

        {/* Circle selector */}
        {availableCircles.length === 0 ? (
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            {strings.shareAlreadyShared}
          </p>
        ) : (
          <>
            {availableCircles.length > 1 && (
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  {strings.shareSelectCircle}
                </label>
                <select
                  value={selectedCircleId}
                  onChange={(e) => setSelectedCircleId(e.target.value)}
                  className="w-full h-10 rounded-lg px-3 text-sm outline-none appearance-none cursor-pointer"
                  style={{
                    background: "var(--color-bg-secondary)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {availableCircles.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Reflection note */}
            <div className="mb-4">
              <textarea
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                placeholder={strings.shareReflectionPlaceholder}
                maxLength={500}
                rows={2}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                style={{
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              />
            </div>

            {error && (
              <p className="text-xs mb-3" style={{ color: "var(--color-danger)" }}>{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-lg text-sm font-medium cursor-pointer"
                style={{ color: "var(--color-text-secondary)", background: "var(--color-bg-secondary)" }}
              >
                {strings.cancel}
              </button>
              <button
                onClick={handleShare}
                disabled={submitting || !selectedCircleId}
                className="flex-1 h-10 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-bg-primary)",
                  opacity: submitting || !selectedCircleId ? 0.5 : 1,
                }}
              >
                {strings.shareButton}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
