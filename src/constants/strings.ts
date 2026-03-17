import en from "./locales/en";
import zh from "./locales/zh";
import type { LocaleStrings } from "./locales/en";

export type SupportedLocale = "en" | "zh";

const locales: Record<SupportedLocale, LocaleStrings> = { en, zh };

/**
 * Current active locale. Defaults to English.
 * Will be driven by UserPreferences once settings page exists.
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
 * All components import this — it's the single access point for UI text.
 */
export function getStrings(): LocaleStrings {
  return locales[activeLocale];
}

/**
 * Static reference for server components and module-level usage.
 * Points to English. Client components that need reactive locale
 * switching should use getStrings() instead.
 */
export const strings = en;

export type { LocaleStrings };
