"use client";

import { useState } from "react";
import { useCircle } from "@/hooks/useCircle";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import Link from "next/link";

export default function CirclePage() {
  const { t } = usePreferences();
  const { user } = useAuth();
  const { circles, loading, createCircle, joinCircle } = useCircle();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (!joinCodeInput.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await joinCircle(joinCodeInput);
    if (result.error) setError(result.error);
    else {
      setJoinCodeInput("");
      setShowJoin(false);
    }
    setSubmitting(false);
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

      {/* Error display */}
      {error && (
        <div
          className="text-xs px-3 py-2 rounded-lg mb-4"
          style={{ color: "var(--color-danger)", background: "var(--color-bg-secondary)", borderLeft: "3px solid var(--color-danger)" }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {circles.length === 0 && !showCreate && !showJoin && (
        <div className="flex flex-col items-center text-center py-10">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: "var(--color-bg-tertiary)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-muted)" }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
            {t.circleCreateDescription}
          </p>
          <div className="flex gap-2 mt-4 w-full">
            <button
              onClick={() => { setShowCreate(true); setError(null); }}
              className="flex-1 h-10 rounded-lg text-sm font-medium cursor-pointer"
              style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
            >
              {t.circleCreate}
            </button>
            <button
              onClick={() => { setShowJoin(true); setError(null); }}
              className="flex-1 h-10 rounded-lg text-sm font-medium cursor-pointer"
              style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
            >
              {t.circleJoin}
            </button>
          </div>
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
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
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
              disabled={submitting || !joinCodeInput.trim()}
              className="flex-1 h-10 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
              style={{
                background: "var(--color-accent)",
                color: "var(--color-bg-primary)",
                opacity: submitting || !joinCodeInput.trim() ? 0.5 : 1,
              }}
            >
              {t.circleJoin}
            </button>
          </div>
        </div>
      )}

      {/* Circle cards */}
      <div className="space-y-2">
        {circles.map((circle) => {
          const isOwner = circle.ownerId === user?.id;
          return (
            <Link
              key={circle.id}
              href={`/circle/${circle.id}`}
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-transform active:scale-[0.98]"
              style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
            >
              {/* Member avatars preview */}
              <div className="flex -space-x-1.5 shrink-0">
                {circle.members.slice(0, 3).map((m) => (
                  <div
                    key={m.userId}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold border-2"
                    style={{
                      background: m.userId === user?.id ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                      color: m.userId === user?.id ? "var(--color-bg-primary)" : "var(--color-text-secondary)",
                      borderColor: "var(--color-bg-secondary)",
                    }}
                  >
                    {(m.displayName || "?")[0].toUpperCase()}
                  </div>
                ))}
                {circle.members.length > 3 && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium border-2"
                    style={{
                      background: "var(--color-bg-tertiary)",
                      color: "var(--color-text-muted)",
                      borderColor: "var(--color-bg-secondary)",
                    }}
                  >
                    +{circle.members.length - 3}
                  </div>
                )}
              </div>

              {/* Circle info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                    {circle.name}
                  </h3>
                  {isOwner && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
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

              {/* Chevron */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0" style={{ color: "var(--color-text-muted)" }}>
                <polyline points="9,6 15,12 9,18" />
              </svg>
            </Link>
          );
        })}
      </div>

      {/* Add circle buttons when user already has circles */}
      {circles.length > 0 && !showCreate && !showJoin && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => { setShowCreate(true); setError(null); }}
            className="flex-1 h-10 rounded-lg text-xs font-medium cursor-pointer active:opacity-80"
            style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            {t.circleCreateTitle}
          </button>
          <button
            onClick={() => { setShowJoin(true); setError(null); }}
            className="flex-1 h-10 rounded-lg text-xs font-medium cursor-pointer active:opacity-80"
            style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            {t.circleJoinTitle}
          </button>
        </div>
      )}
    </div>
  );
}
