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
        <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
          {t.notificationEmpty}
        </p>
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
