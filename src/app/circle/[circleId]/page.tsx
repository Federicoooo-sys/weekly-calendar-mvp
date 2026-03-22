"use client";

import { useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCircle } from "@/hooks/useCircle";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import CircleChat from "@/components/CircleChat";
import CircleSchedules from "@/components/CircleSchedules";

type Tab = "members" | "schedules" | "chat";

export default function CircleDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const circleId = params.circleId as string;
  const { t } = usePreferences();
  const { user } = useAuth();
  const { circles, loading, generateInvite, setJoinCode, leaveCircle, deleteCircle, reload } = useCircle();

  // Tab state from URL or default
  const initialTab = (searchParams.get("tab") as Tab) || "members";
  const initialDm = searchParams.get("dm") || null;
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [dmUserId, setDmUserId] = useState<string | null>(initialDm);

  // Circle management state
  const [inviteCodes, setInviteCodes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [editingJoinCode, setEditingJoinCode] = useState(false);
  const [joinCodeDraft, setJoinCodeDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const circle = useMemo(() => circles.find((c) => c.id === circleId), [circles, circleId]);

  if (loading) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl">
        <div className="flex justify-center py-12">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
        </div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-md">
        <Link href="/circle" className="inline-flex items-center gap-1 text-xs font-medium mb-4" style={{ color: "var(--color-accent)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          {t.circleDetailBack}
        </Link>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t.errorGeneric}</p>
      </div>
    );
  }

  const isOwner = circle.ownerId === user?.id;
  const otherMembers = circle.members.filter((m) => m.userId !== user?.id);
  const selfMember = circle.members.find((m) => m.userId === user?.id);

  const tabs: { key: Tab; label: string }[] = [
    { key: "members", label: t.circleTabMembers },
    { key: "schedules", label: t.circleTabSchedules },
    { key: "chat", label: t.circleTabChat },
  ];

  async function handleGenerateInvite() {
    const result = await generateInvite(circleId);
    if (result.code) setInviteCodes((prev) => ({ ...prev, [circleId]: result.code! }));
  }

  async function handleCopy(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveJoinCode() {
    const result = await setJoinCode(circleId, joinCodeDraft);
    if (result.error) setError(result.error);
    else { setEditingJoinCode(false); await reload(); }
  }

  async function handleLeave() {
    if (!confirmLeave) { setConfirmLeave(true); return; }
    const result = await leaveCircle(circleId);
    if (result?.error) { setError(result.error); setConfirmLeave(false); }
  }

  async function handleDeleteCircle() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    const result = await deleteCircle(circleId);
    if (result?.error) { setError(result.error); setConfirmDelete(false); }
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl">
      {/* Back link */}
      <Link href="/circle" className="inline-flex items-center gap-1 text-xs font-medium mb-4" style={{ color: "var(--color-accent)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
        {t.circleDetailBack}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold md:text-xl" style={{ color: "var(--color-text-primary)" }}>{circle.name}</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {circle.members.length} {t.circleMembers.toLowerCase()}
          </p>
        </div>
        {isOwner && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-muted)" }}>
            {t.circleOwner}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div
        className="flex rounded-xl p-1 mb-5"
        style={{ background: "var(--color-bg-secondary)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); if (tab.key !== "chat") setDmUserId(null); }}
            className="flex-1 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            style={{
              background: activeTab === tab.key ? "var(--color-bg-primary)" : "transparent",
              color: activeTab === tab.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
              boxShadow: activeTab === tab.key ? "var(--shadow-card)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs px-3 py-2 rounded-lg mb-4" style={{ color: "var(--color-danger)", background: "var(--color-bg-secondary)", borderLeft: "3px solid var(--color-danger)" }}>
          {error}
        </div>
      )}

      {/* ─── Members tab ─── */}
      {activeTab === "members" && (
        <div>
          {/* Member list */}
          <div
            className="rounded-xl overflow-hidden mb-5"
            style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            {/* Self */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
              >
                {(selfMember?.displayName || "?")[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium flex-1" style={{ color: "var(--color-text-primary)" }}>
                {selfMember?.displayName || ""}{" "}
                <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>({t.circleYou})</span>
              </span>
            </div>

            {/* Other members */}
            {otherMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
                >
                  {(member.displayName || "?")[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium truncate flex-1" style={{ color: "var(--color-text-primary)" }}>
                  {member.displayName || "Member"}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/circle/${circleId}/member/${member.userId}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
                  >
                    {t.circleViewWeek}
                  </Link>
                  <button
                    onClick={() => { setActiveTab("chat"); setDmUserId(member.userId); }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer"
                    style={{ background: "var(--color-bg-tertiary)", color: "var(--color-accent)" }}
                  >
                    {t.chatViewDirect}
                  </button>
                </div>
              </div>
            ))}

            {otherMembers.length === 0 && (
              <div className="px-4 py-4 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {t.circleNoOtherMembers}
                </p>
              </div>
            )}
          </div>

          {/* Circle management — collapsible */}
          <button
            onClick={() => setShowManage(!showManage)}
            className="flex items-center gap-1.5 text-xs font-medium cursor-pointer mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t.circleManage}
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              className="transition-transform"
              style={{ transform: showManage ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>

          {showManage && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
            >
              {/* Invite code */}
              {!inviteCodes[circleId] ? (
                <button
                  onClick={handleGenerateInvite}
                  className="w-full h-10 rounded-lg text-xs font-medium cursor-pointer"
                  style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
                >
                  {t.circleGenerateCode}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 text-xs font-mono tracking-wider px-3 py-2.5 rounded-lg text-center"
                    style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }}
                  >
                    {inviteCodes[circleId]}
                  </code>
                  <button
                    onClick={() => handleCopy(inviteCodes[circleId])}
                    className="h-10 px-4 rounded-lg text-xs font-medium cursor-pointer shrink-0"
                    style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
                  >
                    {copied ? t.circleCopied : t.circleInviteTitle}
                  </button>
                </div>
              )}

              {/* Persistent join code — owner only */}
              {isOwner && (
                <div className="pt-1">
                  {editingJoinCode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={joinCodeDraft}
                        onChange={(e) => setJoinCodeDraft(e.target.value.toUpperCase())}
                        placeholder="e.g. FAMILY-2026"
                        maxLength={30}
                        className="flex-1 h-10 rounded-lg px-3 text-xs font-mono tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                        style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveJoinCode()}
                      />
                      <button
                        onClick={handleSaveJoinCode}
                        className="h-10 px-4 rounded-lg text-xs font-medium cursor-pointer shrink-0"
                        style={{ background: "var(--color-accent)", color: "var(--color-bg-primary)" }}
                      >
                        {t.circleJoinCodeSave}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] block mb-0.5" style={{ color: "var(--color-text-muted)" }}>{t.circleJoinCode}</span>
                        {circle.joinCode ? (
                          <code className="text-xs font-mono tracking-wider" style={{ color: "var(--color-text-primary)" }}>{circle.joinCode}</code>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t.circleJoinCodeEmpty}</span>
                        )}
                      </div>
                      <button
                        onClick={() => { setEditingJoinCode(true); setJoinCodeDraft(circle.joinCode || ""); }}
                        className="text-xs font-medium cursor-pointer"
                        style={{ color: "var(--color-accent)" }}
                      >
                        {circle.joinCode ? t.circleJoinCodeEdit : t.circleJoinCodeSet}
                      </button>
                    </div>
                  )}
                  {circle.joinCode && (
                    <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>{t.circleJoinCodeHint}</p>
                  )}
                </div>
              )}

              {/* Divider before danger zone */}
              <div style={{ borderTop: "1px solid var(--color-border)" }} />

              {/* Leave / delete */}
              {isOwner ? (
                <button
                  onClick={handleDeleteCircle}
                  className="w-full h-10 rounded-lg text-xs font-medium cursor-pointer"
                  style={{
                    color: confirmDelete ? "var(--color-bg-primary)" : "var(--color-text-muted)",
                    background: confirmDelete ? "var(--color-danger)" : "transparent",
                  }}
                >
                  {confirmDelete ? t.circleDeleteConfirm : t.circleDeleteCircle}
                </button>
              ) : (
                <button
                  onClick={handleLeave}
                  className="w-full h-10 rounded-lg text-xs font-medium cursor-pointer"
                  style={{
                    color: confirmLeave ? "var(--color-bg-primary)" : "var(--color-text-muted)",
                    background: confirmLeave ? "var(--color-danger)" : "transparent",
                  }}
                >
                  {confirmLeave ? t.circleLeaveConfirm : t.circleLeave}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Schedules tab ─── */}
      {activeTab === "schedules" && <CircleSchedules circle={circle} />}

      {/* ─── Chat tab ─── */}
      {activeTab === "chat" && (
        <CircleChat
          circle={circle}
          dmUserId={dmUserId || undefined}
          onDmSelect={(userId) => setDmUserId(userId)}
        />
      )}
    </div>
  );
}
