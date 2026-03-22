"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { getStrings } from "@/constants/strings";
import type { CircleWithMembers, ChatMessage } from "@/types";

interface CircleChatProps {
  circle: CircleWithMembers;
  /** If set, opens DM with this user. Otherwise shows group chat. */
  dmUserId?: string;
  onDmSelect: (userId: string | null) => void;
}

/** Group consecutive messages from the same sender within 2 minutes. */
function groupMessages(messages: ChatMessage[]): { msg: ChatMessage; showAvatar: boolean; showTime: boolean }[] {
  return messages.map((msg, i) => {
    const prev = i > 0 ? messages[i - 1] : null;
    const next = i < messages.length - 1 ? messages[i + 1] : null;

    const sameSenderAsPrev = prev?.senderId === msg.senderId;
    const sameSenderAsNext = next?.senderId === msg.senderId;

    const timeDiffFromPrev = prev ? new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() : Infinity;
    const timeDiffToNext = next ? new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime() : Infinity;

    const closeToNext = sameSenderAsNext && timeDiffToNext < 120000;
    const closeToPrev = sameSenderAsPrev && timeDiffFromPrev < 120000;

    return {
      msg,
      showAvatar: !closeToPrev,
      showTime: !closeToNext,
    };
  });
}

export default function CircleChat({ circle, dmUserId, onDmSelect }: CircleChatProps) {
  const { user } = useAuth();
  const strings = getStrings();
  const otherMembers = circle.members.filter((m) => m.userId !== user?.id);
  const memberIds = circle.members.map((m) => m.userId);

  const dmMember = dmUserId
    ? circle.members.find((m) => m.userId === dmUserId)
    : null;

  const { messages, loading, send } = useChat({
    circleId: circle.id,
    dmUserId: dmUserId || undefined,
    circleName: circle.name,
    memberIds,
  });

  const grouped = useMemo(() => groupMessages(messages), [messages]);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!draft.trim() || sending) return;
    setSending(true);
    setSendError(false);
    const result = await send(draft);
    if (result.error) {
      setSendError(true);
      setSending(false);
      return;
    }
    setDraft("");
    setSending(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 260px)", minHeight: "300px" }}>
      {/* Header */}
      {dmUserId && dmMember ? (
        /* DM header — back button + avatar + name */
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-2"
          style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
        >
          <button
            onClick={() => onDmSelect(null)}
            className="cursor-pointer shrink-0 flex items-center justify-center w-7 h-7 rounded-lg active:opacity-70"
            style={{ color: "var(--color-accent)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
            style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
          >
            {(dmMember.displayName || "?")[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
            {dmMember.displayName}
          </span>
        </div>
      ) : (
        /* Group header — label + member shortcuts */
        <div className="mb-2">
          {otherMembers.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-0.5" style={{ color: "var(--color-text-muted)" }}>
                {strings.chatGroupTitle}
              </p>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 hide-scrollbar">
                {otherMembers.map((m) => (
                  <button
                    key={m.userId}
                    onClick={() => onDmSelect(m.userId)}
                    className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg cursor-pointer shrink-0 active:opacity-70"
                    title={`${strings.chatViewDirect} ${m.displayName}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
                    >
                      {(m.displayName || "?")[0].toUpperCase()}
                    </div>
                    <span
                      className="text-[10px] max-w-[48px] truncate"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {m.displayName}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-xl px-3 py-3"
        style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
              style={{ background: "var(--color-bg-tertiary)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-muted)" }}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
              {dmUserId ? strings.chatDirectEmpty : strings.chatGroupEmpty}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {grouped.map(({ msg, showAvatar, showTime }) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end gap-1.5 max-w-[80%] ${isMe ? "flex-row-reverse" : ""}`}>
                    {/* Avatar — only for others, only on first of group */}
                    {!isMe ? (
                      showAvatar ? (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mb-0.5"
                          style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
                        >
                          {(msg.senderName || "?")[0].toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-6 shrink-0" />
                      )
                    ) : null}
                    <div>
                      {/* Sender name — only for others in group chat, only on first of group */}
                      {!isMe && !dmUserId && showAvatar && (
                        <p className="text-[10px] mb-0.5 px-1 font-medium" style={{ color: "var(--color-text-muted)" }}>
                          {msg.senderName}
                        </p>
                      )}
                      <div
                        className={`px-3 py-1.5 text-xs leading-relaxed ${showAvatar && !isMe ? "rounded-2xl" : isMe ? "rounded-2xl" : "rounded-2xl"}`}
                        style={{
                          background: isMe ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                          color: isMe ? "var(--color-bg-primary)" : "var(--color-text-primary)",
                        }}
                      >
                        {msg.content}
                      </div>
                      {showTime && (
                        <p
                          className={`text-[10px] mt-0.5 px-1 ${isMe ? "text-right" : ""}`}
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send error */}
      {sendError && (
        <p className="text-[10px] text-center mt-1.5" style={{ color: "var(--color-danger)" }}>
          {strings.chatSendError}
        </p>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 mt-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={strings.chatPlaceholder}
          maxLength={500}
          className="flex-1 h-11 rounded-xl px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          style={{
            background: "var(--color-bg-secondary)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          className="w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer transition-opacity shrink-0"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg-primary)",
            opacity: !draft.trim() || sending ? 0.5 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
