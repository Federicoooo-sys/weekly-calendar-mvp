import en from "./locales/en";
import zh from "./locales/zh";
import type { LocaleStrings } from "./locales/en";

export type SupportedLocale = "en" | "zh";

const locales: Record<SupportedLocale, LocaleStrings> = { en, zh };

/**
 * Current active locale. Defaults to English.
 * Driven by PreferencesProvider at runtime.
 */
let activeLocale: SupportedLocale = "en";

export function setLocale(locale: SupportedLocale): void {
  activeLocale = locale;
}

export function getLocale(): SupportedLocale {
  return activeLocale;
}

/**
 * Returns the string dictionary for the active locale.
 * Call inside component render or function bodies — not at module level.
 */
export function getStrings(): LocaleStrings {
  return locales[activeLocale];
}

/**
 * Static reference for server components and module-level usage.
 * Always returns English. Client components should use `usePreferences().t`
 * for reactive locale switching, or `getStrings()` inside function bodies.
 */
export const strings = en;

export type { LocaleStrings };
