"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatUTCToLocalDisplay } from "@/lib/timezone";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import {
  Video,
  Sparkles,
  Clock,
  Calendar,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mic,
  Volume2,
  ExternalLink,
} from "lucide-react";

interface WaitingRoomProps {
  hostName: string;
  hostAvatar?: string;
  learnerName: string;
  learnerAvatar?: string;
  scheduledStartUTC: string;
  googleMeetLink: string;
  aiIcebreaker: string;
}

/**
 * The "Waiting Room" Screen:
 * Shared by both Elderly Hosts and Teen Learners 5 minutes before the meeting starts.
 * Supports full English & Hebrew (RTL) UI while keeping the English Icebreaker
 * prominent (with a Hebrew translation/coaching tip) so the Learner knows what to ask!
 */
export default function WaitingRoom({
  hostName,
  hostAvatar = "/avatars/arthur.png",
  learnerName,
  learnerAvatar = "/avatars/mateo.png",
  scheduledStartUTC,
  googleMeetLink,
  aiIcebreaker,
}: WaitingRoomProps) {
  const { lang, isRTL } = useLanguage();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [secondsUntilStart, setSecondsUntilStart] = useState<number>(() => {
    const diffMs = new Date(scheduledStartUTC).getTime() - Date.now();
    return Math.floor(diffMs / 1000);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const diffMs = new Date(scheduledStartUTC).getTime() - Date.now();
      setSecondsUntilStart(Math.floor(diffMs / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledStartUTC]);

  const isWithinFiveMinutes = secondsUntilStart <= 300;
  const minutesRemaining = Math.max(0, Math.floor(secondsUntilStart / 60));
  const secondsRemaining = Math.max(0, secondsUntilStart % 60);

  const t = {
    en: {
      backExplore: "Back to Explore",
      meetReady: "Google Meet Link Ready",
      lobbyPill: "1-on-1 Video Lobby",
      startsIn: `Starts in ${minutesRemaining}m ${String(
        secondsRemaining
      ).padStart(2, "0")}s`,
      liveNow: "Session is Live Now!",
      localTimeLabel: "Local Time:",
      durationLabel: "(30 Minutes)",
      icebreakerTitle: "Your AI Icebreaker Question",
      icebreakerTip:
        "💡 Tip: Start your call by asking this question in English to break the ice right away!",
      micReady: "Microphone & Camera Ready",
      roomReady: "Private Google Meet Room Created",
      joinBtn: "Join Video Call",
      opens5Min: "Waiting Room Opens 5 Minutes Before Call",
      joinSub:
        "Tapping Join Video Call opens your 1-on-1 Google Meet room immediately—no Google account sign-in needed.",
      footer: "SilverLingo • Connecting Generations Across the Globe",
    },
    he: {
      backExplore: "חזרה לרשימת המארחים",
      meetReady: "קישור Google Meet מוכן",
      lobbyPill: "חדר המתנה לשיחת 1-על-1",
      startsIn: `מתחיל בעוד ${minutesRemaining} דק׳ ו-${String(
        secondsRemaining
      ).padStart(2, "0")} שנ׳`,
      liveNow: "השיחה פעילה כעת!",
      localTimeLabel: "זמן מקומי:",
      durationLabel: "(30 דקות)",
      icebreakerTitle: "שאלת שבירת הקרח שלך (AI Icebreaker)",
      icebreakerTip:
        "💡 טיפ: פתחו את השיחה בשאלה הזו באנגלית כדי לשבור את הקרח מיד בהתחלה!",
      micReady: "מיקרופון ומצלמה מוכנים",
      roomReady: "חדר Google Meet פרטי נוצר עבורכם",
      joinBtn: "הצטרפות לשיחת הווידאו",
      opens5Min: "חדר ההמתנה נפתח 5 דקות לפני תחילת השיחה",
      joinSub:
        "לחיצה על ׳הצטרפות לשיחת הווידאו׳ תפתח מיד את חדר ה-Google Meet הפרטי שלכם — ללא צורך בחשבון Google.",
      footer: "SilverLingo • מחברים בין דורות ברחבי העולם",
    },
  }[lang];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#280750] via-[#4A148C] to-[#1A0436] text-white flex flex-col justify-between p-6 md:p-10">
      {/* Top Navigation Bar */}
      <div className="max-w-4xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/explore"
          className="min-h-[60px] px-6 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/25 text-white font-bold text-[19px] inline-flex items-center gap-3 transition-colors"
        >
          <BackArrow className="w-6 h-6" />
          <span>{t.backExplore}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <LanguageSwitcher size="elderly" />

          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold text-[18px]">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.meetReady}</span>
          </div>
        </div>
      </div>

      {/* Center Waiting Room Card */}
      <div className="my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto bg-[#FDFBF7] text-slate-950 rounded-[36px] p-8 sm:p-12 shadow-[0_28px_80px_-15px_rgba(0,0,0,0.65)] border-2 border-white space-y-8"
        >
          {/* Top Header & Countdown Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b-2 border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-[#4A148C] text-white font-extrabold px-5 py-2 rounded-full text-[18px]">
                <Video className="w-5 h-5 text-[#FF6D00]" />
                <span>{t.lobbyPill}</span>
              </span>
            </div>

            <div
              role="timer"
              aria-live="polite"
              className="px-6 py-2.5 rounded-full bg-purple-100 border-2 border-[#4A148C] text-[#4A148C] font-extrabold text-[20px] inline-flex items-center gap-2.5"
            >
              <Clock className="w-6 h-6" />
              <span>{secondsUntilStart > 0 ? t.startsIn : t.liveNow}</span>
            </div>
          </div>

          {/* Participants Banner with Real Portraits */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-[32px] sm:text-[40px] font-extrabold text-slate-950 leading-tight tracking-tight">
                {learnerName} & {hostName}
              </h1>
              <p className="text-[20px] text-slate-700 font-semibold flex flex-wrap items-center gap-2">
                <Calendar className="w-6 h-6 text-[#4A148C] shrink-0" />
                <span>{t.localTimeLabel}</span>
                <strong dir="ltr" className="text-slate-950">
                  {formatUTCToLocalDisplay(scheduledStartUTC)}
                </strong>
                <span>{t.durationLabel}</span>
              </p>
            </div>

            {/* Paired Photographic Portraits */}
            <div className="flex items-center -space-x-4 rtl:space-x-reverse shrink-0">
              <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-[#4A148C] shadow-lg bg-purple-900">
                <img
                  src={hostAvatar}
                  alt={hostName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-[#FF6D00] shadow-lg bg-orange-600">
                <img
                  src={learnerAvatar}
                  alt={learnerName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* AI-Generated Icebreaker Spotlight Box */}
          <section
            aria-label="Conversation Icebreaker"
            className="relative overflow-hidden bg-gradient-to-br from-[#F5F0FA] to-purple-100/80 border-2 border-[#4A148C] rounded-3xl p-7 sm:p-9 space-y-4 shadow-inner"
          >
            <div className="inline-flex items-center gap-2 text-[18px] font-extrabold uppercase tracking-wider text-[#4A148C]">
              <Sparkles className="w-6 h-6 text-[#FF6D00]" />
              <span>{t.icebreakerTitle}</span>
            </div>

            {/* Always show the English question clearly so the Learner can read it aloud */}
            <p
              dir="ltr"
              className="text-[26px] sm:text-[32px] font-extrabold text-slate-950 leading-snug text-left"
            >
              “{aiIcebreaker}”
            </p>

            <p className="text-[18px] text-slate-700 font-medium">
              {t.icebreakerTip}
            </p>
          </section>

          {/* Pre-Call Audio/Video Readiness Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="min-h-[60px] px-5 py-3 rounded-2xl bg-slate-100 border border-slate-300 flex items-center gap-3.5 text-[18px] font-bold text-slate-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
              <Mic className="w-5 h-5 text-[#4A148C] shrink-0" />
              <span>{t.micReady}</span>
            </div>

            <div className="min-h-[60px] px-5 py-3 rounded-2xl bg-slate-100 border border-slate-300 flex items-center gap-3.5 text-[18px] font-bold text-slate-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
              <Volume2 className="w-5 h-5 text-[#4A148C] shrink-0" />
              <span>{t.roomReady}</span>
            </div>
          </div>

          {/* Massive Vibrant Orange CTA Button (#FF6D00) — Exclusive Main Action */}
          <div className="pt-2 space-y-4">
            {isWithinFiveMinutes ? (
              <a
                href={googleMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[84px] px-8 py-6 rounded-3xl bg-[#FF6D00] hover:bg-[#E65100] active:scale-[0.99] text-white font-extrabold text-[28px] sm:text-[32px] shadow-[0_18px_45px_-8px_rgba(255,109,0,0.7)] flex items-center justify-center gap-4 text-center transition-all focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-[#FF6D00]"
              >
                <Video className="w-9 h-9 shrink-0" />
                <span>{t.joinBtn}</span>
                <ExternalLink className="w-7 h-7 shrink-0 opacity-90" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full min-h-[84px] px-8 py-6 rounded-3xl bg-slate-200 text-slate-600 font-extrabold text-[24px] border-2 border-slate-300 flex items-center justify-center text-center cursor-not-allowed"
              >
                {t.opens5Min}
              </button>
            )}

            <p className="text-[19px] text-center text-slate-700 font-medium">
              {t.joinSub}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="text-center text-purple-200/80 text-[18px]">
        {t.footer}
      </div>
    </main>
  );
}
