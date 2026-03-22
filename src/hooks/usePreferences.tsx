"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { setLocale, getStrings, type SupportedLocale, type LocaleStrings } from "@/constants/strings";
import { clearTimeSlotCache, setTimezone } from "@/lib/dates";
import { createClient } from "@/lib/supabase";
import { detectTimezone } from "@/lib/timezone";
import { useAuth } from "./useAuth";

type Theme = "light" | "dark" | "blue" | "lavender" | "mist" | "cosmic";

interface PreferencesContextValue {
  theme: Theme;
  language: SupportedLocale;
  timezone: string;
  t: LocaleStrings;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: SupportedLocale) => void;
  setTimezonePreference: (timezone: string) => void;
}

const LOCAL_STORAGE_KEY = "weekplanner_preferences";

interface StoredPreferences {
  theme: Theme;
  language: SupportedLocale;
  timezone: string;
}

/** Load from localStorage for immediate display (before Supabase responds). */
function loadLocalPreferences(): StoredPreferences {
  const detectedTz = detectTimezone();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        theme: parsed.theme || "light",
        language: parsed.language || "en",
        timezone: parsed.timezone || detectedTz,
      };
    }
  } catch {
    // Corrupted or unavailable
  }
  return { theme: "light", language: "en", timezone: detectedTz };
}

/** Save to localStorage for flash prevention and offline fallback. */
function saveLocalPreferences(prefs: StoredPreferences): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Silent fail
  }
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>("light");
  const [language, setLanguageState] = useState<SupportedLocale>("en");
  const [timezone, setTimezoneState] = useState<string>(detectTimezone);
  const [t, setT] = useState<LocaleStrings>(getStrings);

  // Refs to avoid stale closures in callbacks
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const languageRef = useRef(language);
  languageRef.current = language;
  const timezoneRef = useRef(timezone);
  timezoneRef.current = timezone;

  // Load preferences: localStorage first (instant), then Supabase (authoritative)
  useEffect(() => {
    // 1. Load from localStorage immediately
    const local = loadLocalPreferences();
    applyPreferences(local.theme, local.language, local.timezone);

    // 2. If authenticated, load from Supabase and override
    if (!user) return;

    let cancelled = false;
    async function loadFromDB() {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_preferences")
        .select("theme, language, timezone")
        .eq("user_id", user!.id)
        .single();

      if (cancelled) return;

      if (data) {
        const dbTheme = (data.theme || "light") as Theme;
        const dbLanguage = (data.language || "en") as SupportedLocale;
        // If no timezone stored in DB yet, auto-detect and persist it
        const dbTimezone = data.timezone || detectTimezone();
        applyPreferences(dbTheme, dbLanguage, dbTimezone);
        saveLocalPreferences({ theme: dbTheme, language: dbLanguage, timezone: dbTimezone });

        // If timezone was missing in DB, save the detected one
        if (!data.timezone) {
          supabase
            .from("user_preferences")
            .update({ timezone: dbTimezone, updated_at: new Date().toISOString() })
            .eq("user_id", user!.id)
            .then();
        }
      }
    }

    loadFromDB();
    return () => { cancelled = true; };
  }, [user]);

  function applyPreferences(newTheme: Theme, newLanguage: SupportedLocale, newTimezone: string) {
    setThemeState(newTheme);
    setLanguageState(newLanguage);
    setTimezoneState(newTimezone);
    setTimezone(newTimezone);
    document.documentElement.setAttribute("data-theme", newTheme);
    document.documentElement.setAttribute("lang", newLanguage === "zh" ? "zh-CN" : "en");
    setLocale(newLanguage);
    clearTimeSlotCache();
    setT(getStrings());
  }

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    saveLocalPreferences({ theme: newTheme, language: languageRef.current, timezone: timezoneRef.current });

    // Persist to Supabase
    if (user) {
      const supabase = createClient();
      supabase
        .from("user_preferences")
        .update({ theme: newTheme, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .then();
    }
  }, [user]);

  const setLanguage = useCallback((newLanguage: SupportedLocale) => {
    setLanguageState(newLanguage);
    setLocale(newLanguage);
    clearTimeSlotCache();
    setT(getStrings());
    document.documentElement.setAttribute("lang", newLanguage === "zh" ? "zh-CN" : "en");
    saveLocalPreferences({ theme: themeRef.current, language: newLanguage, timezone: timezoneRef.current });

    // Persist to Supabase
    if (user) {
      const supabase = createClient();
      supabase
        .from("user_preferences")
        .update({ language: newLanguage, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .then();
    }
  }, [user]);

  const setTimezonePreference = useCallback((newTimezone: string) => {
    setTimezoneState(newTimezone);
    setTimezone(newTimezone);
    clearTimeSlotCache();
    saveLocalPreferences({ theme: themeRef.current, language: languageRef.current, timezone: newTimezone });

    // Persist to Supabase
    if (user) {
      const supabase = createClient();
      supabase
        .from("user_preferences")
        .update({ timezone: newTimezone, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .then();
    }
  }, [user]);

  const value = useMemo(
    () => ({ theme, language, timezone, t, setTheme, setLanguage, setTimezonePreference }),
    [theme, language, timezone, t, setTheme, setLanguage, setTimezonePreference],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
