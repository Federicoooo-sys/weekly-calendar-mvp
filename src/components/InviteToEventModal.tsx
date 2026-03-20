"use client";

import { useState, useEffect } from "react";
import { getStrings } from "@/constants/strings";
import type { EventParticipant } from "@/types";

interface InviteMember {
  userId: string;
  displayName: string;
}

interface InviteToEventModalProps {
  eventTitle: string;
  /** Circle members eligible for invitation (excludes event owner and already-invited) */
  eligibleMembers: InviteMember[];
  /** Existing participants — used to show already-invited state */
  participants: EventParticipant[];
  onInvite: (userId: string) => Promise<{ error: string | null }>;
  onClose: () => void;
}

export default function InviteToEventModal({
  eventTitle,
  eligibleMembers,
  participants,
  onInvite,
  onClose,
}: InviteToEventModalProps) {
  const strings = getStrings();
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleInvite(userId: string) {
    if (sending) return;
    setSending(userId);
    const result = await onInvite(userId);
    if (!result.error) {
      setSent((prev) => new Set(prev).add(userId));
    }
    setSending(null);
  }

  // Determine which members are already participating
  const participantUserIds = new Set(participants.map((p) => p.userId));

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" style={{ background: "var(--color-overlay)" }} onClick={onClose} />

      <div
        className="relative w-full md:max-w-sm md:mx-4 rounded-t-2xl md:rounded-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-6 animate-slideUp md:animate-fadeIn"
        style={{
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          maxHeight: "70vh",
        }}
      >
        {/* Drag handle — mobile */}
        <div className="flex justify-center mb-3 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {strings.inviteToEventTitle}
            </h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
              {eventTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="-mr-2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer shrink-0"
            style={{ color: "var(--color-text-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        {/* Member list */}
        {eligibleMembers.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            {strings.inviteNoEligible}
          </p>
        ) : (
          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: "50vh" }}>
            {eligibleMembers.map((member) => {
              const alreadyParticipant = participantUserIds.has(member.userId);
              const justSent = sent.has(member.userId);
              const isSending = sending === member.userId;
              const isDisabled = alreadyParticipant || justSent || isSending;

              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
                  style={{ background: "var(--color-bg-secondary)" }}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
                  >
                    {(member.displayName || "?")[0].toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                    {member.displayName || "Member"}
                  </span>
                  <button
                    onClick={() => handleInvite(member.userId)}
                    disabled={isDisabled}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-opacity shrink-0"
                    style={{
                      background: isDisabled ? "var(--color-bg-tertiary)" : "var(--color-accent)",
                      color: isDisabled ? "var(--color-text-muted)" : "var(--color-bg-primary)",
                      opacity: isSending ? 0.5 : 1,
                    }}
                  >
                    {alreadyParticipant
                      ? strings.inviteAlready
                      : justSent
                        ? strings.inviteSent
                        : strings.inviteToEvent}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
