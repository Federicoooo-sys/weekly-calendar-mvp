"use client";

import { getStrings } from "@/constants/strings";
import type { EventParticipant } from "@/types";

const STATUS_LABELS: Record<string, "participantInvited" | "participantRequested" | "participantAccepted" | "participantDeclined"> = {
  invited: "participantInvited",
  requested: "participantRequested",
  accepted: "participantAccepted",
  declined: "participantDeclined",
};

interface ParticipantListProps {
  participants: EventParticipant[];
  /** Is the current user the event owner? Determines if accept/decline buttons show. */
  isOwner: boolean;
  /** Current user ID — to show "You" label */
  currentUserId?: string;
  onAccept?: (participantId: string, notifyUserId: string) => void;
  onDecline?: (participantId: string, notifyUserId: string) => void;
}

export default function ParticipantList({
  participants,
  isOwner,
  currentUserId,
  onAccept,
  onDecline,
}: ParticipantListProps) {
  const strings = getStrings();

  if (participants.length === 0) return null;

  // Sort: accepted first, then pending (invited/requested), then declined
  const sorted = [...participants].sort((a, b) => {
    const order = { accepted: 0, invited: 1, requested: 1, declined: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <div>
      <p
        className="text-[10px] font-semibold uppercase tracking-wide mb-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        {strings.participantsLabel}
      </p>
      <div className="space-y-1.5">
        {sorted.map((p) => {
          const isYou = p.userId === currentUserId;
          const isPending = p.status === "invited" || p.status === "requested";
          // Owner can respond to requests; participant can respond to invites
          const canRespond =
            isPending &&
            ((isOwner && p.role === "request") || (!isOwner && isYou && p.role === "invite"));

          return (
            <div
              key={p.id}
              className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg"
              style={{ background: "var(--color-bg-secondary)" }}
            >
              {/* Avatar */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                style={{
                  background: p.status === "accepted" ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                  color: p.status === "accepted" ? "var(--color-bg-primary)" : "var(--color-text-secondary)",
                }}
              >
                {(p.displayName || "?")[0].toUpperCase()}
              </div>

              {/* Name */}
              <span className="flex-1 text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                {p.displayName || "Member"}
                {isYou && (
                  <span style={{ color: "var(--color-text-muted)" }}> ({strings.participantYou})</span>
                )}
              </span>

              {/* Status or action buttons */}
              {canRespond ? (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => onAccept?.(p.id, p.role === "request" ? p.userId : (p.invitedBy || ""))}
                    className="text-[10px] font-medium px-2 py-1 rounded-md cursor-pointer"
                    style={{ background: "var(--color-success)", color: "var(--color-bg-primary)" }}
                  >
                    {strings.accept}
                  </button>
                  <button
                    onClick={() => onDecline?.(p.id, p.role === "request" ? p.userId : (p.invitedBy || ""))}
                    className="text-[10px] font-medium px-2 py-1 rounded-md cursor-pointer"
                    style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-muted)" }}
                  >
                    {strings.decline}
                  </button>
                </div>
              ) : (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: p.status === "accepted"
                      ? "var(--color-success)"
                      : p.status === "declined"
                        ? "var(--color-bg-tertiary)"
                        : "var(--color-warning)",
                    color: p.status === "declined"
                      ? "var(--color-text-muted)"
                      : "var(--color-bg-primary)",
                  }}
                >
                  {strings[STATUS_LABELS[p.status] || "participantInvited"]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
