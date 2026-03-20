"use client";

import { usePreferences } from "@/hooks/usePreferences";
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
  const { theme, language, t, setTheme, setLanguage } = usePreferences();

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
                className="flex flex-col items-center gap-2 py-3 rounded-xl cursor-pointer transition-colors"
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
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors"
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
    </div>
  );
}
