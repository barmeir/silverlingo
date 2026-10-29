"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { withBasePath } from "@/lib/assets";
import {
  Sparkles,
  Calendar,
  Compass,
  Video,
  ArrowRight,
  ArrowLeft,
  HeartHandshake,
  Globe2,
  ShieldCheck,
} from "lucide-react";

export default function HomePage() {
  const { lang, isRTL } = useLanguage();
  const DirectionalArrow = isRTL ? ArrowLeft : ArrowRight;

  const t = {
    en: {
      badge: "Intergenerational Exchange",
      signIn: "Sign In",
      heroPill: "30-Minute 1-on-1 Video Conversations Over Shared Hobbies",
      heroTitle1: "Where lifetime wisdom meets ",
      heroTitleHighlight: "curious minds.",
      heroSubtitle:
        "SilverLingo connects retired native English speakers seeking warm conversation with teenagers worldwide practicing spoken English—matched automatically by shared passions.",
      communityTitle: "Meet Arthur, Eleanor, Walter & Mateo",
      communitySub:
        "Connecting daily over Football, Baking, Chess & Marvel movies",
      ctaPrimary: "Start Magic Link Sign-In",
      noPassword: "No passwords or Google login required",
      seniorBadge: "For Senior Hosts (WCAG AAA)",
      seniorTitle: "Weekly Availability Calendar",
      seniorDesc:
        "Large, calm 60px+ buttons with 24px spacing. Tap or drag to paint your free 30-minute chat times.",
      teenBadge: "For Teen Learners (Dark Mode)",
      teenTitle: "Explore Hosts & Instant Booking",
      teenDesc:
        "Browse hosts with AI hobby match badges, streaks, and book slots automatically converted to your timezone.",
      roomTitle: "5-Minute Waiting Room Lobby",
      roomDesc: "Preview the AI Icebreaker & 1-tap Google Meet launch",
      footerTz:
        "All schedules stored in UTC & displayed in your local browser timezone",
      footerTech: "Built by Bar Meir",
    },
    he: {
      badge: "חילופי שפה בין-דוריים",
      signIn: "התחברות",
      heroPill: "שיחות וידאו של 30 דקות אחד-על-אחד סביב תחביבים משותפים",
      heroTitle1: "כשניסיון חיים פוגש ",
      heroTitleHighlight: "סקרנות צעירה.",
      heroSubtitle:
        "SilverLingo מחברת בין אזרחים ותיקים דוברי אנגלית שפת אם המחפשים שיחה חמה ומשמעותית, לבין בני נוער שרוצים לתרגל אנגלית מדוברת — בהתאמה אישית לפי תחביבים משותפים.",
      communityTitle: "הכירו את ארתור, אלינור, וולטר ומתיאו",
      communitySub:
        "נפגשים מדי יום לשיחות על כדורגל, אפייה, שחמט וסרטי מארוול",
      ctaPrimary: "כניסה מהירה ללא סיסמה (Magic Link)",
      noPassword: "ללא צורך בסיסמאות או בחיבור חשבון Google",
      seniorBadge: "למארחים ותיקים (נגישות WCAG AAA)",
      seniorTitle: "יומן זמינות שבועי נוח",
      seniorDesc:
        "כפתורים גדולים וברורים (60px+) עם מרווחים נוחים. לחצו או גררו כדי לסמן מתי נוח לכם לשוחח.",
      teenBadge: "לבני נוער לומדים (מצב כהה)",
      teenTitle: "מציאת מארחים וקביעת שיחה",
      teenDesc:
        "גלו מארחים עם תגי התאמת תחביבים ב-AI, צברו רצף ימים (Streak) וקבעו שיחה באזור הזמן שלכם.",
      roomTitle: "חדר המתנה חכם (5 דקות לפני השיחה)",
      roomDesc: "צפו בשאלת שבירת הקרח של ה-AI והצטרפו לשיחת הווידאו בלחיצה אחת",
      footerTz:
        "כל השעות נשמרות ב-UTC ומוצגות אוטומטית לפי השעון המקומי בדפדפן שלכם",
      footerTech: "נבנה על ידי בר מאיר",
    },
  }[lang];

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#230647] via-[#4A148C] to-[#1A0536] text-white flex flex-col justify-between">
      {/* Ambient Decorative Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-purple-500/20 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-[#FF6D00]/15 blur-[140px]" />

      {/* Top Navigation */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-10 pt-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <HeartHandshake className="w-6 h-6 text-[#FF6D00]" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight text-white">
              SilverLingo
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-purple-200 border border-white/15">
              {t.badge}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="min-h-[60px] px-6 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-[18px] flex items-center gap-2 transition-all"
          >
            <span>{t.signIn}</span>
          </Link>
        </div>
      </header>

      {/* Main Hero & Dual Persona Portal */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-10 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Editorial Story + Real Community Portraits */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-7 space-y-8"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-purple-100 text-[16px] font-semibold">
              <Sparkles className="w-5 h-5 text-[#FF6D00] shrink-0" />
              <span>{t.heroPill}</span>
            </div>

            <h1 className="text-[40px] sm:text-[52px] lg:text-[58px] font-extrabold tracking-tight leading-[1.12] text-white">
              {t.heroTitle1}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-[#FF6D00]">
                {t.heroTitleHighlight}
              </span>
            </h1>

            <p className="text-[20px] sm:text-[22px] text-purple-100/90 leading-relaxed max-w-2xl font-normal">
              {t.heroSubtitle}
            </p>

            {/* Real Photographic Community Showcase */}
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <div className="flex items-center -space-x-3 rtl:space-x-reverse">
                <img
                  src={withBasePath("/avatars/arthur.png")}
                  alt="Arthur, 74"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-lg"
                />
                <img
                  src={withBasePath("/avatars/eleanor.png")}
                  alt="Eleanor, 69"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-lg"
                />
                <img
                  src={withBasePath("/avatars/walter.png")}
                  alt="Walter, 78"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-lg"
                />
                <img
                  src={withBasePath("/avatars/mateo.png")}
                  alt="Mateo, 16"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#FF6D00] shadow-lg"
                />
              </div>
              <div className="text-sm text-purple-100">
                <p className="font-extrabold text-white text-[16px]">
                  {t.communityTitle}
                </p>
                <p className="text-purple-200/85">{t.communitySub}</p>
              </div>
            </div>

            {/* Primary CTA (#FF6D00) + Secondary Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 pt-2">
              <Link
                href="/login"
                className="min-h-[64px] px-9 rounded-2xl bg-[#FF6D00] hover:bg-[#F56200] text-white font-extrabold text-[20px] shadow-[0_14px_34px_-6px_rgba(255,109,0,0.55)] hover:shadow-[0_18px_40px_-4px_rgba(255,109,0,0.7)] transition-all flex items-center justify-center gap-3 group"
              >
                <span>{t.ctaPrimary}</span>
                <DirectionalArrow className="w-6 h-6 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>

              <div className="flex items-center gap-3 text-purple-100/80 text-[16px] px-2">
                <ShieldCheck className="w-6 h-6 text-emerald-300 shrink-0" />
                <span>{t.noPassword}</span>
              </div>
            </div>
          </motion.div>

          {/* Interactive Experience Cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Card 1: Elderly Host Experience (WCAG AAA Light Surface) */}
            <Link
              href="/availability"
              className="block rounded-3xl bg-[#FDFBF7] text-slate-950 p-7 shadow-2xl border-2 border-white/80 hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={withBasePath("/avatars/arthur.png")}
                      alt="Arthur"
                      className="w-12 h-12 rounded-xl object-cover border-2 border-[#4A148C]"
                    />
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4A148C] text-white text-[15px] font-bold">
                      <Calendar className="w-4 h-4" />
                      {t.seniorBadge}
                    </span>
                  </div>
                  <h2 className="text-[26px] font-extrabold text-slate-950 group-hover:text-[#4A148C] transition-colors">
                    {t.seniorTitle}
                  </h2>
                  <p className="text-[18px] text-slate-700 leading-relaxed">
                    {t.seniorDesc}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#4A148C] flex items-center justify-center shrink-0 group-hover:bg-[#4A148C] group-hover:text-white transition-colors">
                  <DirectionalArrow className="w-6 h-6" />
                </div>
              </div>
            </Link>

            {/* Card 2: Teen Learner Experience (Dark Gamified Surface) */}
            <Link
              href="/explore"
              className="block rounded-3xl bg-slate-950/90 backdrop-blur-xl text-white p-7 shadow-2xl border border-purple-400/30 hover:border-purple-400/70 hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={withBasePath("/avatars/mateo.png")}
                      alt="Mateo"
                      className="w-12 h-12 rounded-xl object-cover border-2 border-[#FF6D00]"
                    />
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold uppercase tracking-wider">
                      <Compass className="w-3.5 h-3.5 text-[#FF6D00]" />
                      {t.teenBadge}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white group-hover:text-orange-300 transition-colors">
                    {t.teenTitle}
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {t.teenDesc}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 group-hover:bg-[#FF6D00] transition-colors">
                  <DirectionalArrow className="w-5 h-5" />
                </div>
              </div>
            </Link>

            {/* Card 3: 5-Minute Waiting Room */}
            <Link
              href="/room/demo-session"
              className="block rounded-3xl bg-white/10 hover:bg-white/15 backdrop-blur-xl text-white p-6 shadow-xl border border-white/20 hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#FF6D00] text-white shadow-md">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-extrabold text-white">
                      {t.roomTitle}
                    </h3>
                    <p className="text-[16px] text-purple-100/85">
                      {t.roomDesc}
                    </p>
                  </div>
                </div>
                <DirectionalArrow className="w-6 h-6 text-purple-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform shrink-0" />
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Bottom Trust Bar */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5 flex flex-wrap items-center justify-between gap-4 text-sm text-purple-200/80">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#FF6D00]" />
            <span>{t.footerTz}</span>
          </div>
          <div>{t.footerTech}</div>
        </div>
      </footer>
    </main>
  );
}
