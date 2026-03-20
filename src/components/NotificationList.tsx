"use client";

import { getStrings } from "@/constants/strings";
import type { Notification } from "@/types";

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

function formatNotification(n: Notification, strings: ReturnType<typeof getStrings>): string {
  const name = n.actorName || "Someone";
  switch (n.type) {
    case "comment":
      return strings.notificationComment
        .replace("{name}", name)
        .replace("{event}", n.targetLabel);
    case "reaction":
      return strings.notificationReaction
        .replace("{name}", name)
        .replace("{emoji}", "")
        .replace("{event}", n.targetLabel);
    case "member_joined":
      return strings.notificationMemberJoined
        .replace("{name}", name)
        .replace("{circle}", n.targetLabel);
    case "summary_shared":
      return strings.notificationSummaryShared.replace("{name}", name);
    case "event_invite":
      return strings.notificationEventInvite
        .replace("{name}", name)
        .replace("{event}", n.targetLabel);
    case "join_request":
      return strings.notificationJoinRequest
        .replace("{name}", name)
        .replace("{event}", n.targetLabel);
    case "participant_response": {
      const isAccepted = n.targetLabel.startsWith("Accepted:");
      const eventName = n.targetLabel.replace(/^(Accepted|Declined): /, "");
      return (isAccepted ? strings.notificationParticipantAccepted : strings.notificationParticipantDeclined)
        .replace("{name}", name)
        .replace("{event}", eventName);
    }
    default:
      return "";
  }
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
}

export default function NotificationList({ notifications, onMarkAllRead }: NotificationListProps) {
  const strings = getStrings();
  const unread = notifications.filter((n) => !n.read);

  if (notifications.length === 0) return null;

  return (
    <div
      className="rounded-xl mb-4 overflow-hidden"
      style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <h3 className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {strings.notificationsTitle}
          {unread.length > 0 && (
            <span
              className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
            >
              {unread.length}
            </span>
          )}
        </h3>
        {unread.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[10px] font-medium cursor-pointer"
            style={{ color: "var(--color-accent)" }}
          >
            {strings.notificationMarkAllRead}
          </button>
        )}
      </div>

      {/* Notification items */}
      <div>
        {notifications.slice(0, 8).map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-2.5 px-4 py-2.5"
            style={{
              borderTop: "1px solid var(--color-border)",
              background: n.read ? "transparent" : "var(--color-bg-tertiary)",
            }}
          >
            {/* Unread dot */}
            <div className="pt-1.5 shrink-0">
              {!n.read ? (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
              ) : (
                <div className="w-1.5 h-1.5" />
              )}
            </div>
            {/* Avatar */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
              style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
            >
              {(n.actorName || "?")[0].toUpperCase()}
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
                {formatNotification(n, strings)}
              </p>
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                {timeAgo(n.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
