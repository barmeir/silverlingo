"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "he";

interface LanguageContextValue {
  lang: Language;
  dir: "ltr" | "rtl";
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("silverlingo_lang") as Language | null;
    if (saved === "en" || saved === "he") {
      setLangState(saved);
    }
  }, []);

  useEffect(() => {
    const dir = lang === "he" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    window.localStorage.setItem("silverlingo_lang", lang);
  }, [lang]);

  const setLang = (next: Language) => {
    setLangState(next);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === "en" ? "he" : "en"));
  };

  const dir = lang === "he" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider
      value={{
        lang,
        dir,
        setLang,
        toggleLang,
        isRTL: lang === "he",
      }}
    >
      <div dir={dir} className={lang === "he" ? "font-heebo" : "font-sans"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
