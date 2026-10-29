"use client";

import React from "react";
import Link from "next/link";
import { Flame, Trophy, Sparkles, Zap, Calendar, Home, UserPlus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useUserProfile } from "@/context/UserProfileContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

export default function TeenLearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const { profile } = useUserProfile();

  const t = {
    en: {
      rolePill: profile ? profile.fullName : "Teen Learner",
      home: "Home",
      hostView: "Host View",
      editProfile: profile ? "Edit Profile" : "Create Profile",
      weeklyQuest: "Weekly Fluency Quest",
      callsCount: "2 / 3 calls",
      streak: "12 Day Streak",
    },
    he: {
      rolePill: profile ? profile.fullName : "תלמיד/ה",
      home: "דף הבית",
      hostView: "תצוגת מארח",
      editProfile: profile ? "עריכת פרופיל" : "יצירת פרופיל",
      weeklyQuest: "יעד שיחות שבועי",
      callsCount: "2 / 3 שיחות",
      streak: "רצף של 12 ימים",
    },
  }[lang];

  return (
    <div className="dark min-h-screen bg-[#0B0714] text-slate-100 text-[15px] leading-normal font-sans relative overflow-x-hidden">
      <div className="pointer-events-none fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#4A148C]/25 blur-[140px]" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-[#FF6D00]/10 blur-[140px]" />

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#130A24]/85 border-b border-purple-500/20 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4A148C] to-purple-600 border border-purple-400/40 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-[#FF6D00]" />
              </div>
              <span>SilverLingo</span>
              <span className="text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 font-bold">
                {t.rolePill}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-2 text-xs font-semibold">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t.home}</span>
              </Link>
              <Link
                href="/onboarding"
                className="px-3 py-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t.editProfile}</span>
              </Link>
              <Link
                href="/availability"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.hostView}</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageSwitcher />

            <div className="hidden sm:flex items-center gap-3 bg-white/[0.04] border border-white/10 px-3.5 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              </div>
              <div className="w-36">
                <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-1">
                  <span>{t.weeklyQuest}</span>
                  <span className="text-amber-300 font-bold">
                    {t.callsCount}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-[#4A148C] via-purple-500 to-[#FF6D00] rounded-full" />
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 bg-purple-950/60 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-200">
              <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
              <span>1,450 XP</span>
            </div>

            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/40 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-orange-200 shadow-sm">
              <Flame className="w-4 h-4 text-[#FF6D00] fill-[#FF6D00]" />
              <span>{t.streak}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
