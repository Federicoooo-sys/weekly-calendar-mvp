"use client";

import { useState, useRef, useEffect } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { useAuth } from "@/hooks/useAuth";
import { searchTimezones, formatTimezoneDisplay, type TimezoneOption } from "@/lib/timezone";
import type { SupportedLocale } from "@/constants/strings";

type Theme = "light" | "dark" | "blue" | "lavender" | "mist" | "cosmic";

const THEMES: { value: Theme; labelKey: keyof typeof import("@/constants/locales/en").default; preview: string }[] = [
  { value: "light", labelKey: "settingsThemeLight", preview: "#ffffff" },
  { value: "dark", labelKey: "settingsThemeDark", preview: "#000000" },
  { value: "blue", labelKey: "settingsThemeBlue", preview: "#0d9488" },
  { value: "lavender", labelKey: "settingsThemeLavender", preview: "#8b5cf6" },
  { value: "mist", labelKey: "settingsThemeMist", preview: "#3b82f6" },
  { value: "cosmic", labelKey: "settingsThemeCosmic", preview: "#ea580c" },
];

const LANGUAGES: { value: SupportedLocale; labelKey: "settingsLanguageEn" | "settingsLanguageZh" }[] = [
  { value: "en", labelKey: "settingsLanguageEn" },
  { value: "zh", labelKey: "settingsLanguageZh" },
];

export default function SettingsPage() {
  const { theme, language, timezone, t, setTheme, setLanguage, setTimezonePreference } = usePreferences();
  const { user, signOut } = useAuth();
  const [tzQuery, setTzQuery] = useState("");
  const [tzResults, setTzResults] = useState<TimezoneOption[]>([]);
  const [showTzDropdown, setShowTzDropdown] = useState(false);
  const tzInputRef = useRef<HTMLInputElement>(null);
  const tzContainerRef = useRef<HTMLDivElement>(null);

  // Search timezones as user types
  useEffect(() => {
    if (tzQuery.trim()) {
      setTzResults(searchTimezones(tzQuery));
      setShowTzDropdown(true);
    } else {
      setTzResults([]);
      setShowTzDropdown(false);
    }
  }, [tzQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tzContainerRef.current && !tzContainerRef.current.contains(e.target as Node)) {
        setShowTzDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-md">
      <h2
        className="text-lg font-semibold mb-6 md:text-xl"
        style={{ color: "var(--color-text-primary)" }}
      >
        {t.settingsPageTitle}
      </h2>

      {/* Theme section */}
      <section className="mb-8">
        <h3
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t.settingsAppearance}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((opt) => {
            const isSelected = opt.value === theme;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className="flex flex-col items-center gap-2 py-3 rounded-xl cursor-pointer transition-colors active:opacity-80"
                style={{
                  background: "var(--color-bg-secondary)",
                  border: isSelected
                    ? "2px solid var(--color-accent)"
                    : "2px solid var(--color-border)",
                }}
              >
                {/* Color preview */}
                <div
                  className="w-8 h-8 rounded-full border"
                  style={{
                    background: opt.preview,
                    borderColor: "var(--color-border)",
                  }}
                />
                <span
                  className="text-xs font-medium"
                  style={{
                    color: isSelected ? "var(--color-accent)" : "var(--color-text-secondary)",
                  }}
                >
                  {t[opt.labelKey]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Language section */}
      <section>
        <h3
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t.settingsLanguage}
        </h3>
        <div className="space-y-2">
          {LANGUAGES.map((opt) => {
            const isSelected = opt.value === language;
            return (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors active:opacity-80"
                style={{
                  background: "var(--color-bg-secondary)",
                  border: isSelected
                    ? "2px solid var(--color-accent)"
                    : "2px solid var(--color-border)",
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{
                    color: isSelected ? "var(--color-accent)" : "var(--color-text-primary)",
                  }}
                >
                  {t[opt.labelKey]}
                </span>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,8 6.5,11.5 13,4.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Timezone section */}
      <section className="mt-8">
        <h3
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t.settingsTimezone}
        </h3>

        {/* Current timezone display */}
        <div
          className="px-4 py-3 rounded-xl mb-3 text-sm"
          style={{
            background: "var(--color-bg-secondary)",
            border: "2px solid var(--color-accent)",
            color: "var(--color-accent)",
          }}
        >
          {formatTimezoneDisplay(timezone)}
        </div>

        {/* City search */}
        <div ref={tzContainerRef} className="relative">
          <input
            ref={tzInputRef}
            type="text"
            value={tzQuery}
            onChange={(e) => setTzQuery(e.target.value)}
            placeholder={t.settingsTimezoneSearch}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
            onFocus={() => { if (tzQuery.trim()) setShowTzDropdown(true); }}
          />

          {showTzDropdown && tzResults.length > 0 && (
            <div
              className="absolute z-10 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-lg"
              style={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              {tzResults.map((tz) => (
                <button
                  key={tz.id}
                  onClick={() => {
                    setTimezonePreference(tz.id);
                    setTzQuery("");
                    setShowTzDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm cursor-pointer transition-colors"
                  style={{
                    color: tz.id === timezone ? "var(--color-accent)" : "var(--color-text-primary)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = "var(--color-bg-tertiary, var(--color-border))";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = "transparent";
                  }}
                >
                  <span className="font-medium">{tz.city}</span>
                  <span className="ml-2" style={{ color: "var(--color-text-muted)" }}>
                    {tz.offset}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Account section */}
      <section className="mt-8 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
        <h3
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t.settingsAccount}
        </h3>
        <p className="text-sm font-medium mb-4" style={{ color: "var(--color-text-primary)" }}>
          {user?.email}
        </p>
        <button
          onClick={signOut}
          className="w-full h-10 rounded-lg text-sm font-medium cursor-pointer transition-colors"
          style={{
            color: "var(--color-danger)",
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          {t.authSignOut}
        </button>
      </section>
    </div>
  );
}
