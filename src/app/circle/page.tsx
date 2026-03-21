"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCircle } from "@/hooks/useCircle";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { useNotifications } from "@/hooks/useNotifications";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { createClient } from "@/lib/supabase";
import NotificationList from "@/components/NotificationList";
import ActivityFeed from "@/components/ActivityFeed";
import InviteRequestModal from "@/components/InviteRequestModal";
import Link from "next/link";
import type { Notification } from "@/types";

export default function CirclePage() {
  const { t } = usePreferences();
  const { user } = useAuth();
  const router = useRouter();
  const { circles, loading, createCircle, joinCircle, generateInvite, leaveCircle, deleteCircle } = useCircle();
  const circleIds = useMemo(() => circles.map((c) => c.id), [circles]);
  const { notifications, markAllRead, reload } = useNotifications();
  const { items: feedItems, loading: feedLoading } = useActivityFeed(circleIds);

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

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Per-circle state for invite codes and confirm actions
  const [inviteCodes, setInviteCodes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleCreate() {
    if (!circleName.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await createCircle(circleName);
    if (result.error) setError(result.error);
    else {
      setCircleName("");
      setShowCreate(false);
    }
    setSubmitting(false);
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await joinCircle(joinCode);
    if (result.error) setError(result.error);
    else {
      setJoinCode("");
      setShowJoin(false);
    }
    setSubmitting(false);
  }

  async function handleGenerateInvite(circleId: string) {
    const result = await generateInvite(circleId);
    if (result.code) {
      setInviteCodes((prev) => ({ ...prev, [circleId]: result.code! }));
    }
  }

  async function handleCopy(code: string, circleId: string) {
    await navigator.clipboard.writeText(code);
    setCopied(circleId);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleLeave(circleId: string) {
    if (confirmLeave !== circleId) {
      setConfirmLeave(circleId);
      return;
    }
    await leaveCircle(circleId);
    setConfirmLeave(null);
  }

  async function handleDelete(circleId: string) {
    if (confirmDelete !== circleId) {
      setConfirmDelete(circleId);
      return;
    }
    await deleteCircle(circleId);
    setConfirmDelete(null);
  }

  const inputStyle = {
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
  };

  if (loading) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-md">
        <h2
          className="text-lg font-semibold mb-6 md:text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t.circlePageTitle}
        </h2>
        <div className="flex justify-center py-12">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: "var(--color-accent)" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-md">
      <h2
        className="text-lg font-semibold mb-6 md:text-xl"
        style={{ color: "var(--color-text-primary)" }}
      >
        {t.circlePageTitle}
      </h2>

      {/* Notifications */}
      <NotificationList notifications={notifications} onMarkAllRead={markAllRead} onNotificationClick={handleNotificationClick} />

      {/* Error display */}
      {error && (
        <div
          className="text-xs px-3 py-2 rounded-lg mb-4"
          style={{ color: "var(--color-danger)", background: "var(--color-bg-secondary)" }}
        >
          {error}
        </div>
      )}

      {/* No circles — show create/join CTAs */}
      {circles.length === 0 && !showCreate && !showJoin && (
        <div className="space-y-3">
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(null); }}
            className="w-full p-4 rounded-xl text-left cursor-pointer transition-colors"
            style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              {t.circleCreateTitle}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {t.circleCreateDescription}
            </p>
          </button>

          <div className="text-center">
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t.circleOr}</span>
          </div>

          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(null); }}
            className="w-full p-4 rounded-xl text-left cursor-pointer transition-colors"
            style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              {t.circleJoinTitle}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {t.circleJoinDescription}
            </p>
          </button>
        </div>
      )}

      {/* Create circle form */}
      {showCreate && (
        <div
          className="p-4 rounded-xl mb-4"
          style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text-primary)" }}>
            {t.circleCreateTitle}
          </p>
          <input
            type="text"
            value={circleName}
            onChange={(e) => setCircleName(e.target.value)}
            placeholder={t.circleNamePlaceholder}
            maxLength={60}
            className="w-full h-11 rounded-lg px-3 text-sm outline-none mb-3 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCreate(false); setError(null); }}
              className="flex-1 h-10 rounded-lg text-sm font-medium cursor-pointer"
              style={{ color: "var(--color-text-secondary)", background: "var(--color-bg-tertiary)" }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting || !circleName.trim()}
              className="flex-1 h-10 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
              style={{
                background: "var(--color-accent)",
                color: "var(--color-bg-primary)",
                opacity: submitting || !circleName.trim() ? 0.5 : 1,
              }}
            >
              {t.circleCreate}
            </button>
          </div>
        </div>
      )}

      {/* Join circle form */}
      {showJoin && (
        <div
          className="p-4 rounded-xl mb-4"
          style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text-primary)" }}>
            {t.circleJoinTitle}
          </p>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder={t.circleJoinPlaceholder}
            className="w-full h-11 rounded-lg px-3 text-sm outline-none mb-3 font-mono tracking-wider focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowJoin(false); setError(null); }}
              className="flex-1 h-10 rounded-lg text-sm font-medium cursor-pointer"
              style={{ color: "var(--color-text-secondary)", background: "var(--color-bg-tertiary)" }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleJoin}
              disabled={submitting || !joinCode.trim()}
              className="flex-1 h-10 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
              style={{
                background: "var(--color-accent)",
                color: "var(--color-bg-primary)",
                opacity: submitting || !joinCode.trim() ? 0.5 : 1,
              }}
            >
              {t.circleJoin}
            </button>
          </div>
        </div>
      )}

      {/* Circle list */}
      {circles.map((circle) => {
        const isOwner = circle.ownerId === user?.id;
        const otherMembers = circle.members.filter((m) => m.userId !== user?.id);
        const code = inviteCodes[circle.id];

        return (
          <div
            key={circle.id}
            className="rounded-xl overflow-hidden mb-4"
            style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            {/* Circle header */}
            <div className="p-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {circle.name}
                </h3>
                {isOwner && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-muted)" }}
                  >
                    {t.circleOwner}
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {circle.members.length} {t.circleMembers.toLowerCase()}
              </p>
            </div>

            {/* Members */}
            <div className="px-4 pb-3">
              {otherMembers.length === 0 ? (
                <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>
                  {t.circleNoOtherMembers}
                </p>
              ) : (
                <div className="space-y-1">
                  {otherMembers.map((member) => (
                    <Link
                      key={member.userId}
                      href={`/circle/${member.userId}`}
                      className="flex items-center gap-3 py-2 px-3 -mx-1 rounded-lg transition-colors hover:opacity-80"
                    >
                      {/* Avatar initial */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
                      >
                        {(member.displayName || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                          {member.displayName || "Member"}
                        </p>
                      </div>
                      {/* Arrow */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
                        <polyline points="9,18 15,12 9,6" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: invite, leave/delete */}
            <div
              className="px-4 py-3 space-y-2"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              {/* Generate invite */}
              {!code ? (
                <button
                  onClick={() => handleGenerateInvite(circle.id)}
                  className="w-full h-9 rounded-lg text-xs font-medium cursor-pointer"
                  style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
                >
                  {t.circleGenerateCode}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 text-xs font-mono tracking-wider px-3 py-2 rounded-lg text-center"
                    style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }}
                  >
                    {code}
                  </code>
                  <button
                    onClick={() => handleCopy(code, circle.id)}
                    className="h-9 px-3 rounded-lg text-xs font-medium cursor-pointer shrink-0"
                    style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
                  >
                    {copied === circle.id ? t.circleCopied : t.circleInviteTitle}
                  </button>
                </div>
              )}

              {/* Leave or delete */}
              {isOwner ? (
                <button
                  onClick={() => handleDelete(circle.id)}
                  className="w-full h-9 rounded-lg text-xs font-medium cursor-pointer"
                  style={{
                    color: confirmDelete === circle.id ? "var(--color-bg-primary)" : "var(--color-text-muted)",
                    background: confirmDelete === circle.id ? "var(--color-danger)" : "transparent",
                  }}
                >
                  {confirmDelete === circle.id ? t.circleDeleteConfirm : t.circleDeleteCircle}
                </button>
              ) : (
                <button
                  onClick={() => handleLeave(circle.id)}
                  className="w-full h-9 rounded-lg text-xs font-medium cursor-pointer"
                  style={{
                    color: confirmLeave === circle.id ? "var(--color-bg-primary)" : "var(--color-text-muted)",
                    background: confirmLeave === circle.id ? "var(--color-danger)" : "transparent",
                  }}
                >
                  {confirmLeave === circle.id ? t.circleLeaveConfirm : t.circleLeave}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add circle buttons when user already has circles */}
      {circles.length > 0 && !showCreate && !showJoin && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => { setShowCreate(true); setError(null); }}
            className="flex-1 h-10 rounded-lg text-xs font-medium cursor-pointer"
            style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            {t.circleCreateTitle}
          </button>
          <button
            onClick={() => { setShowJoin(true); setError(null); }}
            className="flex-1 h-10 rounded-lg text-xs font-medium cursor-pointer"
            style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            {t.circleJoinTitle}
          </button>
        </div>
      )}

      {/* Activity feed */}
      {circles.length > 0 && (
        <ActivityFeed items={feedItems} loading={feedLoading} />
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
