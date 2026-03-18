import type { EventCategory } from "@/types";
import type { LocaleStrings } from "@/constants/strings";

interface CategoryConfig {
  labelKey: string;
  /** CSS custom property name — use with var(), e.g. var(--color-cat-work) */
  colorVar: string;
}

/** Maps each category to its i18n string key. Shared across all components. */
export const CATEGORY_LABEL_KEYS: Record<EventCategory, keyof LocaleStrings> = {
  work: "categoryWork",
  personal: "categoryPersonal",
  health: "categoryHealth",
  errand: "categoryErrand",
  other: "categoryOther",
};

/**
 * Category metadata — maps each EventCategory to its display label key and
 * a CSS variable reference. Colors adapt automatically to the active theme.
 */
export const categoryConfig: Record<EventCategory, CategoryConfig> = {
  work: { labelKey: "categoryWork", colorVar: "var(--color-cat-work)" },
  personal: { labelKey: "categoryPersonal", colorVar: "var(--color-cat-personal)" },
  health: { labelKey: "categoryHealth", colorVar: "var(--color-cat-health)" },
  errand: { labelKey: "categoryErrand", colorVar: "var(--color-cat-errand)" },
  other: { labelKey: "categoryOther", colorVar: "var(--color-cat-other)" },
};
