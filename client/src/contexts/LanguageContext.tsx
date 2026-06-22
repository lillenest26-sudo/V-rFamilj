import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Language } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "sv",
  setLanguage: () => {},
  t: (path) => path,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("familje-language");
    return (stored === "sv" || stored === "so") ? stored : "sv";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("familje-language", lang);
  }, []);

  const t = useCallback((path: string): string => {
    const keys = path.split(".");
    let current: unknown = translations[language];
    for (const key of keys) {
      if (current && typeof current === "object" && key in (current as object)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        // fallback to Swedish
        let fallback: unknown = translations.sv;
        for (const k of keys) {
          if (fallback && typeof fallback === "object" && k in (fallback as object)) {
            fallback = (fallback as Record<string, unknown>)[k];
          } else {
            return path;
          }
        }
        return typeof fallback === "string" ? fallback : path;
      }
    }
    return typeof current === "string" ? current : path;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
