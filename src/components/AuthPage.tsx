"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { strings } from "@/constants/strings";

type Mode = "signin" | "signup" | "confirmation" | "forgot" | "reset_sent";

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Use static English strings since user isn't authenticated yet (no preferences loaded)
  const t = strings;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "forgot") {
        const result = await resetPassword(email);
        if (result.error) {
          setError(result.error);
        } else {
          setMode("reset_sent");
        }
      } else if (mode === "signup") {
        if (!inviteCode.trim()) {
          setError(t.authInviteRequired);
          setSubmitting(false);
          return;
        }
        const result = await signUp(email, password, inviteCode, displayName);
        if (result.error) {
          setError(result.error);
        } else {
          setMode("confirmation");
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) setError(result.error);
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
  };

  // ─── Email confirmation screen ───
  if (mode === "confirmation") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <div className="w-full max-w-sm text-center">
          {/* Mail icon */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "var(--color-bg-tertiary)" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--color-accent)" }}
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
          </div>

          <h1
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            {t.authCheckEmail}
          </h1>

          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t.authCheckEmailDescription.replace("{email}", email)}
          </p>

          <button
            onClick={() => {
              setMode("signin");
              setError(null);
              setPassword("");
            }}
            className="text-sm font-medium cursor-pointer"
            style={{ color: "var(--color-accent)" }}
          >
            {t.authBackToSignIn}
          </button>
        </div>
      </div>
    );
  }

  // ─── Password reset sent screen ───
  if (mode === "reset_sent") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <div className="w-full max-w-sm text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "var(--color-bg-tertiary)" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--color-accent)" }}
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
          </div>
          <h1
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            {t.authResetSent}
          </h1>
          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t.authResetSentDescription.replace("{email}", email)}
          </p>
          <button
            onClick={() => { setMode("signin"); setError(null); setPassword(""); }}
            className="text-sm font-medium cursor-pointer"
            style={{ color: "var(--color-accent)" }}
          >
            {t.authBackToSignIn}
          </button>
        </div>
      </div>
    );
  }

  // ─── Sign in / Sign up form ───
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-bg-primary)" }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            {mode === "forgot"
              ? t.authResetPassword
              : mode === "signup"
                ? t.authWelcomeSignUp
                : t.authWelcome}
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {mode === "forgot"
              ? ""
              : mode === "signup"
                ? t.authSignUpDescription
                : t.authWelcomeDescription}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display name — signup only */}
          {mode === "signup" && (
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t.authDisplayName}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-11 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
                style={inputStyle}
                required
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t.authEmail}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
              style={inputStyle}
              required
            />
          </div>

          {/* Password — hidden in forgot mode */}
          {mode !== "forgot" && (
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t.authPassword}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
                style={inputStyle}
                minLength={6}
                required
              />
            </div>
          )}

          {/* Forgot password — sign in only */}
          {mode === "signin" && (
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(null); }}
                className="text-xs cursor-pointer"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t.authForgotPassword}
              </button>
            </div>
          )}

          {/* Invite code — signup only, last field */}
          {mode === "signup" && (
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t.authInviteCode}
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder={t.authInviteCodePlaceholder}
                className="w-full h-11 rounded-lg px-3 text-sm outline-none font-mono tracking-wider focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
                style={inputStyle}
                required
              />
              <p
                className="text-xs mt-1.5 px-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t.authInviteCodeHint}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p
              className="text-xs px-1"
              style={{ color: "var(--color-danger)" }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-bg-primary)",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting
              ? t.authLoading
              : mode === "forgot"
                ? t.authResetPassword
                : mode === "signin"
                  ? t.authSignIn
                  : t.authSignUp}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="text-center mt-6">
          {mode === "forgot" ? (
            <button
              onClick={() => { setMode("signin"); setError(null); }}
              className="text-sm font-medium cursor-pointer"
              style={{ color: "var(--color-accent)" }}
            >
              {t.authBackToSignIn}
            </button>
          ) : (
            <>
              <span
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {mode === "signin" ? t.authNoAccount : t.authHaveAccount}{" "}
              </span>
              <button
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                }}
                className="text-sm font-semibold cursor-pointer"
                style={{ color: "var(--color-accent)" }}
              >
                {mode === "signin" ? t.authSignUp : t.authSignIn}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
