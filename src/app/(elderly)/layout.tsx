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
    profile && profile.role === "elderly"
      ? profile.avatarUrl
      : "/avatars/arthur.png";

  const t = {
    en: {
      hostSub: `Host: ${hostDisplayName}`,
      home: "Home",
      editProfile: "My Profile",
      schedule: "My Weekly Schedule",
      waitingRoom: "Next Call Waiting Room",
    },
    he: {
      hostSub: `מארח/ת: ${hostDisplayName}`,
      home: "דף הבית",
      editProfile: "הפרופיל שלי",
      schedule: "היומן השבועי שלי",
      waitingRoom: "חדר המתנה לשיחה הבאה",
    },
  }[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#380E6B] via-[#4A148C] to-[#2A0854] text-white font-sans">
      <header className="bg-[#240646]/95 backdrop-blur-md border-b-2 border-white/20 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <Link
            href="/"
            className="min-h-[60px] px-4 rounded-2xl flex items-center gap-4 focus:outline-none focus:ring-4 focus:ring-[#FF6D00]"
          >
            <img
              src={withBasePath(hostAvatarUrl)}
              alt={hostDisplayName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
            />
            <div>
              <span className="text-[26px] font-extrabold text-white tracking-tight block leading-none">
                SilverLingo
              </span>
              <span className="text-[18px] text-purple-200 font-semibold">
                {t.hostSub}
              </span>
            </div>
          </Link>

          <nav
            aria-label="Host Navigation"
            className="flex flex-wrap items-center gap-6"
          >
            <LanguageSwitcher size="elderly" />

            <Link
              href="/"
              className="min-h-[60px] px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-[20px] flex items-center gap-3 border-2 border-white/30 transition-colors"
            >
              <Home className="w-6 h-6" />
              <span>{t.home}</span>
            </Link>

            <Link
              href="/onboarding"
              className="min-h-[60px] px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-[20px] flex items-center gap-3 border-2 border-white/30 transition-colors"
            >
              <UserPlus className="w-6 h-6" />
              <span>{t.editProfile}</span>
            </Link>

            <Link
              href="/availability"
              className="min-h-[60px] px-7 rounded-2xl bg-white text-slate-950 font-extrabold text-[20px] flex items-center gap-3 shadow-md hover:bg-purple-50 transition-colors"
            >
              <Calendar className="w-6 h-6 text-[#4A148C]" />
              <span>{t.schedule}</span>
            </Link>

            <Link
              href="/room/demo-session"
              className="min-h-[60px] px-7 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-[20px] flex items-center gap-3 shadow-lg transition-colors"
            >
              <Video className="w-6 h-6" />
              <span>{t.waitingRoom}</span>
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
