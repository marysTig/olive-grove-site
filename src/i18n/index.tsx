import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dict, type Lang, type TKey } from "./dictionary";

interface I18nValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "lnj-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  // Restore saved language — client-only
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === "ar" || saved === "fr") setLangState(saved);
    } catch {
      // localStorage unavailable (SSR or private browsing)
    }
  }, []);

  // Sync <html> element attributes — client-only
  useEffect(() => {
    const dir = dict[lang].dir;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    // Guard: localStorage only available in the browser
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, l);
      } catch {
        // ignore
      }
    }
  };

  const t = (key: TKey) => dict[lang][key] ?? dict.fr[key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, dir: dict[lang].dir as "rtl" | "ltr", setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export type { Lang };
