"use client";

import { useState, useEffect, useRef } from "react";
import { getStrings } from "@/constants/strings";
import { categoryConfig, CATEGORY_LABEL_KEYS } from "@/constants/categories";
import { useComments } from "@/hooks/useComments";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { useAuth } from "@/hooks/useAuth";
import ReactionBar from "./ReactionBar";
import ParticipantList from "./ParticipantList";
import InviteToEventModal from "./InviteToEventModal";
import type { CalendarEvent, DayInfo } from "@/types";

interface EligibleMember {
  userId: string;
  displayName: string;
}

interface SharedEventDetailProps {
  event: CalendarEvent;
  /** The user_id who owns this event — needed for notifications */
  eventOwnerId?: string;
  /** Circle members eligible for invite — only passed when viewer is the owner */
  eligibleMembers?: EligibleMember[];
  days: DayInfo[];
  onClose: () => void;
}

export default function SharedEventDetail({ event, eventOwnerId, eligibleMembers, days, onClose }: SharedEventDetailProps) {
  const strings = getStrings();
  const { user } = useAuth();
  const { comments, loading: commentsLoading, addComment, deleteComment } = useComments(event.id, {
    ownerId: eventOwnerId,
    title: event.title,
  });
  const {
    participants,
    myParticipation,
    accepted,
    loading: participantsLoading,
    inviteUser,
    requestToJoin,
    respond,
  } = useEventParticipants(event.id);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [askToJoinState, setAskToJoinState] = useState<"idle" | "sending" | "sent">("idle");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.id === eventOwnerId;

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Scroll to bottom when comments change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  async function handleSend() {
    if (!newComment.trim() || sending) return;
    setSending(true);
    await addComment(newComment);
    setNewComment("");
    setSending(false);
  }

  const day = days.find((d) => d.dayKey === event.dayKey);
  const catConfig = categoryConfig[event.category];
  const timeDisplay = event.startTime
    ? event.endTime
      ? `${event.startTime} – ${event.endTime}`
      : event.startTime
    : strings.allDay;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "var(--color-overlay)" }} onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full md:max-w-md md:mx-4 rounded-t-2xl md:rounded-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-6 animate-slideUp md:animate-fadeIn flex flex-col"
        style={{
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          maxHeight: "85vh",
        }}
      >
        {/* Drag handle — mobile */}
        <div className="flex justify-center mb-3 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-semibold mb-1 truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {event.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category pill */}
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: catConfig.colorVar, color: "var(--color-bg-primary)" }}
              >
                {strings[CATEGORY_LABEL_KEYS[event.category]]}
              </span>
              {/* Day + time */}
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {day?.dayLabel} · {timeDisplay}
              </span>
              {/* Status */}
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: event.status === "completed"
                    ? "var(--color-success)"
                    : event.status === "skipped"
                      ? "var(--color-disabled)"
                      : "var(--color-accent)",
                  color: "var(--color-bg-primary)",
                }}
              >
                {event.status === "completed" ? strings.statusCompleted : event.status === "skipped" ? strings.statusSkipped : strings.statusPlanned}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="-mr-2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer shrink-0"
            style={{ color: "var(--color-text-muted)" }}
            aria-label={strings.cancel}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        {/* Reactions + coordination actions row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <ReactionBar eventId={event.id} eventOwnerId={eventOwnerId} eventTitle={event.title} />
          </div>
          <div className="flex gap-1.5 shrink-0">
            {/* Ask to join — only for non-owners who haven't already requested/been invited */}
            {!isOwner && !myParticipation && (
              <button
                onClick={async () => {
                  if (askToJoinState !== "idle" || !eventOwnerId) return;
                  setAskToJoinState("sending");
                  await requestToJoin(eventOwnerId, event.title);
                  setAskToJoinState("sent");
                }}
                disabled={askToJoinState !== "idle"}
                className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg cursor-pointer transition-opacity"
                style={{
                  background: askToJoinState === "sent" ? "var(--color-bg-tertiary)" : "var(--color-accent)",
                  color: askToJoinState === "sent" ? "var(--color-text-muted)" : "var(--color-bg-primary)",
                  opacity: askToJoinState === "sending" ? 0.5 : 1,
                }}
              >
                {askToJoinState === "sent" ? strings.askToJoinSent : strings.askToJoin}
              </button>
            )}
            {/* Invite — only for event owner */}
            {isOwner && (
              <button
                onClick={() => setShowInvite(true)}
                className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg cursor-pointer"
                style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
              >
                {strings.inviteToEvent}
              </button>
            )}
          </div>
        </div>

        {/* Participants — show if any exist */}
        {!participantsLoading && participants.length > 0 && (
          <div className="mb-3">
            <ParticipantList
              participants={participants}
              isOwner={isOwner}
              currentUserId={user?.id}
              onAccept={async (pid, notifyUserId) => {
                await respond(pid, "accepted", {
                  actorName: "",
                  eventTitle: event.title,
                  notifyUserId,
                });
              }}
              onDecline={async (pid, notifyUserId) => {
                await respond(pid, "declined", {
                  actorName: "",
                  eventTitle: event.title,
                  notifyUserId,
                });
              }}
            />
          </div>
        )}

        {/* Separator */}
        <div className="mb-3" style={{ borderTop: "1px solid var(--color-border)" }} />

        {/* Invite modal */}
        {showInvite && eligibleMembers && (
          <InviteToEventModal
            eventTitle={event.title}
            eligibleMembers={eligibleMembers}
            participants={participants}
            onInvite={async (userId) => inviteUser(userId, event.title)}
            onClose={() => setShowInvite(false)}
          />
        )}

        {/* Comments section */}
        <div className="flex-1 overflow-y-auto min-h-0 mb-3">
          {commentsLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--color-text-muted)" }}>
              {strings.commentEmpty}
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const isOwn = comment.userId === user?.id;
                return (
                  <div key={comment.id} className="flex gap-2">
                    {/* Avatar */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5"
                      style={{
                        background: isOwn ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                        color: isOwn ? "var(--color-bg-primary)" : "var(--color-text-secondary)",
                      }}
                    >
                      {(comment.displayName || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {comment.displayName || "User"}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5 break-words" style={{ color: "var(--color-text-secondary)" }}>
                        {comment.content}
                      </p>
                      {isOwn && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-[10px] mt-1 cursor-pointer"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {strings.delete}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={strings.commentPlaceholder}
            maxLength={500}
            className="flex-1 h-10 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            style={{
              background: "var(--color-bg-secondary)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!newComment.trim() || sending}
            className="h-10 px-4 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-bg-primary)",
              opacity: !newComment.trim() || sending ? 0.5 : 1,
            }}
          >
            {strings.commentSend}
          </button>
        </div>
      </div>
    </div>
  );
}
