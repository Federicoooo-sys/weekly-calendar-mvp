"use client";

import { useMemo } from "react";
import { getStrings } from "@/constants/strings";
import { timeAgo, isToday } from "@/lib/time";
import type { Notification } from "@/types";

function formatNotification(n: Notification, strings: ReturnType<typeof getStrings>): string {
  const name = n.actorName || "Someone";
  switch (n.type) {
    case "comment":
      return strings.notificationComment.replace("{name}", name).replace("{event}", n.targetLabel);
    case "reaction":
      return strings.notificationReaction.replace("{name}", name).replace("{event}", n.targetLabel);
    case "member_joined":
      return strings.notificationMemberJoined.replace("{name}", name).replace("{circle}", n.targetLabel);
    case "summary_shared":
      return strings.notificationSummaryShared.replace("{name}", name);
    case "event_invite":
      return strings.notificationEventInvite.replace("{name}", name).replace("{event}", n.targetLabel);
    case "join_request":
      return strings.notificationJoinRequest.replace("{name}", name).replace("{event}", n.targetLabel);
    case "participant_response": {
      const isAccepted = n.targetLabel.startsWith("Accepted:");
      const eventName = n.targetLabel.replace(/^(Accepted|Declined): /, "");
      return (isAccepted ? strings.notificationParticipantAccepted : strings.notificationParticipantDeclined)
        .replace("{name}", name).replace("{event}", eventName);
    }
    case "chat_group":
      return strings.notificationChatGroup.replace("{name}", name).replace("{circle}", n.targetLabel);
    case "chat_dm":
      return strings.notificationChatDm.replace("{name}", name).replace("{message}", n.targetLabel);
    default:
      return "";
  }
}

/** Small icon indicating notification type — overlaid on avatar corner. */
function TypeIcon({ type }: { type: Notification["type"] }) {
  const iconProps = {
    width: 10, height: 10, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "comment":
      return <svg {...iconProps}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "chat_group":
    case "chat_dm":
      return <svg {...iconProps}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
    case "event_invite":
    case "join_request":
      return <svg {...iconProps}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case "participant_response":
      return <svg {...iconProps}><polyline points="5,12 10,17 19,7" /></svg>;
    case "reaction":
      return <svg {...iconProps}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>;
    case "member_joined":
      return <svg {...iconProps}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>;
    default:
      return <svg {...iconProps}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
  }
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export default function NotificationList({ notifications, onMarkAllRead, onNotificationClick }: NotificationListProps) {
  const strings = getStrings();
  const unread = notifications.filter((n) => !n.read);

  // Split into today / earlier
  const { today, earlier } = useMemo(() => {
    const t: Notification[] = [];
    const e: Notification[] = [];
    for (const n of notifications) {
      if (isToday(n.createdAt)) t.push(n);
      else e.push(n);
    }
    return { today: t, earlier: e };
  }, [notifications]);

  if (notifications.length === 0) return null;

  return (
    <div>
      {/* Mark all read header */}
      {unread.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
            {strings.notificationUnread.replace("{count}", String(unread.length))}
          </span>
          <button
            onClick={onMarkAllRead}
            className="text-xs font-medium cursor-pointer"
            style={{ color: "var(--color-accent)" }}
          >
            {strings.notificationMarkAllRead}
          </button>
        </div>
      )}

      {/* Today section */}
      {today.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1" style={{ color: "var(--color-text-muted)" }}>
            {strings.notificationToday}
          </p>
          <div
            className="rounded-xl overflow-hidden mb-3"
            style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            {today.map((n, i) => (
              <NotificationRow key={n.id} n={n} strings={strings} isFirst={i === 0} onClick={onNotificationClick} />
            ))}
          </div>
        </>
      )}

      {/* Earlier section */}
      {earlier.length > 0 && (
        <>
          {today.length > 0 && (
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1" style={{ color: "var(--color-text-muted)" }}>
              {strings.notificationEarlier}
            </p>
          )}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            {earlier.map((n, i) => (
              <NotificationRow key={n.id} n={n} strings={strings} isFirst={i === 0} onClick={onNotificationClick} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationRow({
  n, strings, isFirst, onClick,
}: {
  n: Notification;
  strings: ReturnType<typeof getStrings>;
  isFirst: boolean;
  onClick?: (n: Notification) => void;
}) {
  const clickable = !!onClick && !!n.targetId;
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5${clickable ? " cursor-pointer active:opacity-80" : ""}`}
      style={{
        borderTop: isFirst ? undefined : "1px solid var(--color-border)",
        background: n.read ? "transparent" : "var(--color-bg-tertiary)",
      }}
      onClick={() => { if (clickable) onClick!(n); }}
    >
      {/* Avatar with type badge */}
      <div className="relative shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ background: n.read ? "var(--color-bg-tertiary)" : "var(--color-accent)", color: n.read ? "var(--color-text-secondary)" : "var(--color-bg-primary)" }}
        >
          {(n.actorName || "?")[0].toUpperCase()}
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-muted)" }}
        >
          <TypeIcon type={n.type} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs leading-snug truncate ${n.read ? "" : "font-medium"}`}
          style={{ color: "var(--color-text-primary)" }}
        >
          {formatNotification(n, strings)}
        </p>
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {timeAgo(n.createdAt)}
        </span>
      </div>

      {/* Clickable chevron hint */}
      {clickable && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0" style={{ color: "var(--color-text-muted)" }}>
          <polyline points="9,6 15,12 9,18" />
        </svg>
      )}
    </div>
  );
}
