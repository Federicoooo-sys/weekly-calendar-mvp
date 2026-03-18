"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setLocale, getStrings, type SupportedLocale, type LocaleStrings } from "@/constants/strings";

type Theme = "light" | "dark" | "blue";

interface PreferencesContextValue {
  theme: Theme;
  language: SupportedLocale;
  t: LocaleStrings;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: SupportedLocale) => void;
}

const STORAGE_KEY = "weekplanner_preferences";

interface StoredPreferences {
  theme: Theme;
  language: SupportedLocale;
}

function loadPreferences(): StoredPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        theme: parsed.theme || "light",
        language: parsed.language || "en",
      };
    }
  } catch {
    // Corrupted or unavailable
  }
  return { theme: "light", language: "en" };
}

function savePreferences(prefs: StoredPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Silent fail
  }
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [language, setLanguageState] = useState<SupportedLocale>("en");
  const [t, setT] = useState<LocaleStrings>(getStrings);

  // Load preferences on mount
  useEffect(() => {
    const prefs = loadPreferences();
    setThemeState(prefs.theme);
    setLanguageState(prefs.language);
    document.documentElement.setAttribute("data-theme", prefs.theme);
    document.documentElement.setAttribute("lang", prefs.language === "zh" ? "zh-CN" : "en");
    setLocale(prefs.language);
    setT(getStrings());
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    savePreferences({ theme: newTheme, language });
  }, [language]);

  const setLanguage = useCallback((newLanguage: SupportedLocale) => {
    setLanguageState(newLanguage);
    setLocale(newLanguage);
    setT(getStrings());
    document.documentElement.setAttribute("lang", newLanguage === "zh" ? "zh-CN" : "en");
    savePreferences({ theme, language: newLanguage });
  }, [theme]);

  return (
    <PreferencesContext.Provider value={{ theme, language, t, setTheme, setLanguage }}>
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
