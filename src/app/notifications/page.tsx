"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/hooks/usePreferences";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationList from "@/components/NotificationList";
import InviteRequestModal from "@/components/InviteRequestModal";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const { t } = usePreferences();
  const router = useRouter();
  const { notifications, loading, markAllRead, reload } = useNotifications();
  const [inviteEventId, setInviteEventId] = useState<string | null>(null);

  function handleNotificationClick(n: Notification) {
    // Open invite request modal for event invites
    if (n.targetId && n.type === "event_invite") {
      setInviteEventId(n.targetId);
      return;
    }
    // Chat notifications — route to circle chat tab
    if (n.targetId && n.type === "chat_group") {
      router.push(`/circle/${n.targetId}?tab=chat`);
      return;
    }
    if (n.targetId && n.type === "chat_dm" && n.actorId) {
      router.push(`/circle/${n.targetId}?tab=chat&dm=${n.actorId}`);
      return;
    }
    // Navigate to week page with event ID to open thread
    if (n.targetId && (n.type === "comment" || n.type === "reaction" || n.type === "join_request" || n.type === "participant_response")) {
      router.push(`/?event=${n.targetId}`);
    }
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-md">
      <h2
        className="text-lg font-semibold mb-6 md:text-xl"
        style={{ color: "var(--color-text-primary)" }}
      >
        {t.notificationsTitle}
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: "var(--color-accent)" }}
          />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center text-center py-12">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: "var(--color-bg-tertiary)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-muted)" }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {t.notificationEmpty}
          </p>
        </div>
      ) : (
        <NotificationList
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onNotificationClick={handleNotificationClick}
        />
      )}

      {/* Invite request modal */}
      {inviteEventId && (
        <InviteRequestModal
          eventId={inviteEventId}
          onClose={() => setInviteEventId(null)}
          onResponded={() => reload()}
        />
      )}
    </div>
  );
}
