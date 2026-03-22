"use client";

import { useState, useRef, useEffect } from "react";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { getStrings } from "@/constants/strings";
import { timeAgo } from "@/lib/time";

interface CommentThreadProps {
  eventId: string;
  eventOwnerId?: string;
  eventTitle?: string;
  /** Auto-scroll to bottom on mount (used when opening from notification) */
  autoFocus?: boolean;
}

export default function CommentThread({ eventId, eventOwnerId, eventTitle, autoFocus }: CommentThreadProps) {
  const strings = getStrings();
  const { user } = useAuth();
  const { comments, loading, addComment, deleteComment } = useComments(eventId, {
    ownerId: eventOwnerId,
    title: eventTitle,
  });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when comments load or new comment added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  // Auto-focus input when opening from notification
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    await addComment(text.trim());
    setText("");
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleDelete(commentId: string) {
    if (confirmDeleteId !== commentId) {
      setConfirmDeleteId(commentId);
      return;
    }
    await deleteComment(commentId);
    setConfirmDeleteId(null);
  }

  return (
    <div>
      {/* Thread header */}
      <label
        className="block text-xs font-medium mb-1.5"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {strings.commentThread}
        {comments.length > 0 && (
          <span
            className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-muted)" }}
          >
            {comments.length}
          </span>
        )}
      </label>

      {/* Comments list */}
      <div
        ref={scrollRef}
        className="rounded-lg mb-2 space-y-0"
        style={{
          maxHeight: "200px",
          overflowY: "auto",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
        }}
      >
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs px-3 py-3" style={{ color: "var(--color-text-muted)" }}>
            {strings.commentEmpty}
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-2 px-3 py-2"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              {/* Avatar */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5"
                style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
              >
                {(c.displayName || "?")[0].toUpperCase()}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {c.displayName || "?"}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {c.content}
                </p>
              </div>
              {/* Delete — own comments only */}
              {user && c.userId === user.id && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="shrink-0 text-[10px] cursor-pointer mt-0.5"
                  style={{ color: confirmDeleteId === c.id ? "var(--color-danger)" : "var(--color-text-muted)" }}
                >
                  {confirmDeleteId === c.id ? strings.commentDeleteConfirm : "×"}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={strings.commentPlaceholder}
          className="flex-1 h-9 rounded-lg px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
          style={{
            background: "var(--color-bg-secondary)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="h-9 px-3 rounded-lg text-xs font-medium cursor-pointer transition-opacity"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg-primary)",
            opacity: !text.trim() || sending ? 0.5 : 1,
          }}
        >
          {strings.commentSend}
        </button>
      </div>
    </div>
  );
}
