"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Video, Home, UserPlus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useUserProfile } from "@/context/UserProfileContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { withBasePath } from "@/lib/assets";

export default function ElderlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const { profile } = useUserProfile();

  const hostDisplayName =
    profile && profile.role === "elderly"
      ? profile.fullName
      : lang === "he"
      ? "ארתור פנדלטון"
      : "Arthur Pendelton";

  const hostAvatarUrl =
    profile && profile.role === "elderly" && profile.avatarUrl
      ? profile.avatarUrl
      : "/avatars/arthur.png";

  const t = {
    en: {
      hostSub: `Host: ${hostDisplayName}`,
      home: "Home",
      editProfile: "My Profile",
      schedule: "My Schedule",
      waitingRoom: "Waiting Room",
    },
    he: {
      hostSub: `מארח/ת: ${hostDisplayName}`,
      home: "דף הבית",
      editProfile: "הפרופיל שלי",
      schedule: "היומן שלי",
      waitingRoom: "חדר המתנה",
    },
  }[lang];

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#380E6B] via-[#4A148C] to-[#2A0854] text-white font-sans">
      <header className="bg-[#240646]/95 backdrop-blur-md border-b-2 border-white/20 px-3 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="min-h-[52px] flex items-center gap-3 focus:outline-none"
            >
              <img
                src={withBasePath(hostAvatarUrl)}
                alt={hostDisplayName}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
              />
              <div>
                <span className="text-xl sm:text-[24px] font-extrabold text-white tracking-tight block leading-none">
                  SilverLingo
                </span>
                <span className="text-sm sm:text-[16px] text-purple-200 font-semibold">
                  {t.hostSub}
                </span>
              </div>
            </Link>

            <div className="lg:hidden">
              <LanguageSwitcher />
            </div>
          </div>

          <nav
            aria-label="Host Navigation"
            className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-4"
          >
            <div className="hidden lg:block">
              <LanguageSwitcher size="elderly" />
            </div>

            <Link
              href="/"
              className="min-h-[50px] sm:min-h-[56px] px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-[18px] flex items-center justify-center gap-2 border-2 border-white/30 transition-colors"
            >
              <Home className="w-5 h-5 shrink-0" />
              <span>{t.home}</span>
            </Link>

            <Link
              href="/onboarding"
              className="min-h-[50px] sm:min-h-[56px] px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-[18px] flex items-center justify-center gap-2 border-2 border-white/30 transition-colors"
            >
              <UserPlus className="w-5 h-5 shrink-0" />
              <span>{t.editProfile}</span>
            </Link>

            <Link
              href="/availability"
              className="min-h-[50px] sm:min-h-[56px] px-4 sm:px-5 rounded-2xl bg-white text-slate-950 font-extrabold text-sm sm:text-[18px] flex items-center justify-center gap-2 shadow-md hover:bg-purple-50 transition-colors"
            >
              <Calendar className="w-5 h-5 text-[#4A148C] shrink-0" />
              <span>{t.schedule}</span>
            </Link>

            <Link
              href="/room/demo-session"
              className="min-h-[50px] sm:min-h-[56px] px-4 sm:px-5 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-sm sm:text-[18px] flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <Video className="w-5 h-5 shrink-0" />
              <span>{t.waitingRoom}</span>
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
