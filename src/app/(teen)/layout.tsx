"use client";

import React from "react";
import Link from "next/link";
import {
  Flame,
  Trophy,
  Sparkles,
  Calendar,
  Home,
  UserPlus,
  LogIn,
  LogOut,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useUserProfile } from "@/context/UserProfileContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

export default function TeenLearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const { profile, clearProfile } = useUserProfile();

  const isSignedIn = Boolean(
    profile &&
      profile.id &&
      profile.fullName?.trim() &&
      (profile.email?.trim() || profile.phone?.trim() || profile.contact?.trim())
  );

  const t = {
    en: {
      rolePill: isSignedIn ? profile!.fullName : "Guest (Not Signed In)",
      home: "Home",
      hostView: "Host Calendar",
      signIn: "Sign In",
      signOut: "Sign Out",
      editProfile: isSignedIn ? "Edit Profile" : "Register",
      weeklyQuest: "Weekly Fluency Quest",
      callsCount: "2 / 3 calls",
      streak: "12 Day Streak",
    },
    he: {
      rolePill: isSignedIn ? profile!.fullName : "אורח/ת (לא מחובר/ת)",
      home: "דף הבית",
      hostView: "יומן מארח",
      signIn: "התחברות",
      signOut: "התנתקות",
      editProfile: isSignedIn ? "עריכת פרופיל" : "הרשמה",
      weeklyQuest: "יעד שיחות שבועי",
      callsCount: "2 / 3 שיחות",
      streak: "רצף 12 ימים",
    },
  }[lang];

  return (
    <div className="dark min-h-screen bg-[#0B0714] text-slate-100 text-[15px] leading-normal font-sans relative overflow-x-hidden">
      <div className="pointer-events-none fixed top-0 left-1/4 w-[360px] sm:w-[500px] h-[360px] sm:h-[500px] rounded-full bg-[#4A148C]/25 blur-[130px]" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] rounded-full bg-[#FF6D00]/10 blur-[130px]" />

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#130A24]/90 border-b border-purple-500/20 px-3 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/"
              className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#4A148C] to-purple-600 border border-purple-400/40 flex items-center justify-center shadow-md shrink-0">
                <Sparkles className="w-4 h-4 text-[#FF6D00]" />
              </div>
              <span>SilverLingo</span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 font-bold truncate max-w-[120px] sm:max-w-none">
                {t.rolePill}
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher />

              <div className="hidden lg:flex items-center gap-3 bg-white/[0.04] border border-white/10 px-3.5 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                </div>
                <div className="w-32">
                  <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-1">
                    <span>{t.weeklyQuest}</span>
                    <span className="text-amber-300 font-bold">
                      {t.callsCount}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-[#4A148C] via-purple-500 to-[#FF6D00] rounded-full" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/40 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold text-orange-200 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-[#FF6D00] fill-[#FF6D00] shrink-0" />
                <span>{t.streak}</span>
              </div>
            </div>
          </div>

          {/* Mobile & Desktop Quick Navigation Row */}
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-bold pt-0.5">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t.home}</span>
            </Link>
            <Link
              href="/onboarding"
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 flex items-center gap-1.5 whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.editProfile}</span>
            </Link>
            <Link
              href="/availability"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.hostView}</span>
            </Link>
            {!isSignedIn ? (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-xl bg-[#FF6D00] hover:bg-[#F56200] text-white flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.signIn}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={clearProfile}
                className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-400/30 text-red-200 flex items-center gap-1.5 whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.signOut}</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {children}
      </main>
    </div>
  );
}
