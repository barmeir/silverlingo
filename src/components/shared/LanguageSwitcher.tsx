"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Languages } from "lucide-react";

interface LanguageSwitcherProps {
  size?: "default" | "elderly";
}

/**
 * Persistent top-bar Language Switcher pill (EN | עברית).
 * Avoids hidden settings drawers so users can switch languages on first visit
 * (including before logging in) and meets WCAG AAA elderly touch-target standards.
 */
export default function LanguageSwitcher({
  size = "default",
}: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  if (size === "elderly") {
    return (
      <div
        role="group"
        aria-label="Language Switcher / בחירת שפה"
        className="inline-flex items-center bg-white/10 border-2 border-white/30 rounded-2xl p-1.5 gap-2"
      >
        <button
          type="button"
          onClick={() => setLang("en")}
          aria-pressed={lang === "en"}
          className={`min-h-[52px] px-5 rounded-xl font-extrabold text-[19px] transition-all flex items-center gap-2 ${
            lang === "en"
              ? "bg-[#FF6D00] text-white shadow-md"
              : "text-white hover:bg-white/10"
          }`}
        >
          <span>🇺🇸 EN</span>
        </button>

        <button
          type="button"
          onClick={() => setLang("he")}
          aria-pressed={lang === "he"}
          className={`min-h-[52px] px-5 rounded-xl font-extrabold text-[19px] transition-all flex items-center gap-2 ${
            lang === "he"
              ? "bg-[#FF6D00] text-white shadow-md"
              : "text-white hover:bg-white/10"
          }`}
        >
          <span>🇮🇱 עברית</span>
        </button>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language Switcher / בחירת שפה"
      className="inline-flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1 gap-1"
    >
      <Languages className="w-4 h-4 text-[#FF6D00] mx-2 shrink-0" />
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
          lang === "en"
            ? "bg-[#FF6D00] text-white shadow-sm"
            : "text-purple-100 hover:text-white hover:bg-white/10"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("he")}
        aria-pressed={lang === "he"}
        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
          lang === "he"
            ? "bg-[#FF6D00] text-white shadow-sm"
            : "text-purple-100 hover:text-white hover:bg-white/10"
        }`}
      >
        עברית
      </button>
    </div>
  );
}
