"use client";

import { getStrings } from "@/constants/strings";
import { formatWeekRange } from "@/lib/dates";
import type { FeedItem } from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface ActivityFeedProps {
  items: FeedItem[];
  loading: boolean;
}

export default function ActivityFeed({ items, loading }: ActivityFeedProps) {
  const strings = getStrings();

  if (loading) return null;
  if (items.length === 0) {
    return (
      <div className="mt-6">
        <h3
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          {strings.feedTitle}
        </h3>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {strings.feedEmpty}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: "var(--color-text-muted)" }}
      >
        {strings.feedTitle}
      </h3>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl p-3"
            style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            {item.type === "summary_shared" && item.summary ? (
              <SummaryFeedItem item={item} />
            ) : (
              <JoinFeedItem item={item} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryFeedItem({ item }: { item: FeedItem }) {
  const strings = getStrings();
  const s = item.summary!;

  return (
    <>
      <div className="flex items-center gap-2 mb-1.5">
        {/* Avatar */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
          style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
        >
          {item.actorName[0]?.toUpperCase() || "?"}
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
          {item.actorName}
        </span>
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {strings.feedSummaryShared}
        </span>
        <span className="text-[10px] ml-auto" style={{ color: "var(--color-text-muted)" }}>
          {timeAgo(item.timestamp)}
        </span>
      </div>

      {/* Summary card */}
      <div
        className="rounded-lg p-2.5 mt-1"
        style={{ background: "var(--color-bg-tertiary)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
            {formatWeekRange(s.weekStart)}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{
              background: s.completionRate >= 70 ? "var(--color-success)" : s.completionRate >= 40 ? "var(--color-warning)" : "var(--color-disabled)",
              color: "var(--color-bg-primary)",
            }}
          >
            {s.completionRate}%
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          <span>{s.totalEvents} events</span>
          {s.completedEvents > 0 && (
            <span style={{ color: "var(--color-success)" }}>{s.completedEvents} ✓</span>
          )}
          {s.skippedEvents > 0 && (
            <span>{s.skippedEvents} ✗</span>
          )}
        </div>
        {s.reflectionNote && (
          <p
            className="text-xs mt-2 leading-relaxed italic"
            style={{ color: "var(--color-text-secondary)" }}
          >
            &ldquo;{s.reflectionNote}&rdquo;
          </p>
        )}
      </div>
    </>
  );
}

function JoinFeedItem({ item }: { item: FeedItem }) {
  const strings = getStrings();

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
        style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
      >
        {item.actorName[0]?.toUpperCase() || "?"}
      </div>
      <span className="text-xs" style={{ color: "var(--color-text-primary)" }}>
        <span className="font-medium">{item.actorName}</span>
        {" "}{strings.feedMemberJoined}
        {item.circleName && (
          <span style={{ color: "var(--color-text-muted)" }}> {item.circleName}</span>
        )}
      </span>
      <span className="text-[10px] ml-auto shrink-0" style={{ color: "var(--color-text-muted)" }}>
        {timeAgo(item.timestamp)}
      </span>
    </div>
  );
}
