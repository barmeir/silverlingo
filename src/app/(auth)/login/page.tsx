"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import {
  Mail,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

type AuthMethod = "email" | "phone";

export default function PasswordlessLoginPage() {
  const supabase = createClient();
  const { lang, isRTL } = useLanguage();
  const ForwardArrow = isRTL ? ArrowLeft : ArrowRight;
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [method, setMethod] = useState<AuthMethod>("email");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabaseActive = isSupabaseConfigured();

  const t = {
    en: {
      backHome: "Back to Home",
      pill: "Password-Free Sign In",
      title: "Welcome! Let’s sign you in easily.",
      subtitle:
        "You never need to remember a password. Enter your Email or Phone below, or create your interactive profile right away.",
      sentTitleEmail: supabaseActive
        ? "Check your Email Inbox!"
        : "Demo Mode: Ready to Create Your Profile!",
      sentTitlePhone: supabaseActive
        ? "Check your Phone Messages!"
        : "Demo Mode: Ready to Create Your Profile!",
      sentBody1: supabaseActive
        ? "We sent a personal Magic Sign-In Link to "
        : "Since this preview is running in Demo Mode (without an external email server connected), you don't need to wait for an email at ",
      sentBody2: supabaseActive
        ? ". Simply tap the orange button inside that message to open your account."
        : " — click below to set up your name, role, and hobbies right now!",
      createProfileBtn: "Create My Profile Now →",
      continueSchedule: "Skip to Host Schedule →",
      useDifferentEmail: "Use a different email address",
      useDifferentPhone: "Use a different phone number",
      step1: "1. How should we send your link?",
      byEmail: "By Email",
      byPhone: "By Phone SMS",
      step2Email: "2. Type your Email Address:",
      step2Phone: "2. Type your Mobile Phone Number:",
      sending: "Continuing...",
      sendEmailBtn: "Continue with Email Magic Link",
      sendPhoneBtn: "Continue with SMS Code",
      newHere: "New to SilverLingo? Create Your Profile Directly",
      reassurance: "Safe, private, and designed for effortless sign-in.",
      helpFooter: "Need help? Call our friendly support line anytime.",
    },
    he: {
      backHome: "חזרה לדף הבית",
      pill: "כניסה מהירה ללא סיסמה",
      title: "ברוכים הבאים! בואו נתחבר בקלות.",
      subtitle:
        "אין צורך לזכור סיסמאות. הזינו אימייל או טלפון למטה, או צרו פרופיל אישי באופן מיידי.",
      sentTitleEmail: supabaseActive
        ? "בדקו את תיבת האימייל שלכם!"
        : "מצב הדגמה (Demo): מוכנים ליצירת הפרופיל שלך!",
      sentTitlePhone: supabaseActive
        ? "בדקו את הודעות ה-SMS בטלפון!"
        : "מצב הדגמה (Demo): מוכנים ליצירת הפרופיל שלך!",
      sentBody1: supabaseActive
        ? "שלחנו קישור כניסה אישי אל "
        : "מכיוון שהמערכת פועלת במצב הדגמה (ללא שרת שליחת מיילים חיצוני), אין צורך להמתין לאימייל בכתובת ",
      sentBody2: supabaseActive
        ? ". פשוט לחצו על הכפתור הכתום שבתוך ההודעה כדי להיכנס לחשבון."
        : " — לחצו למטה כדי ליצור את הפרופיל שלכם (שם, תפקיד ותחביבים) ולהתחיל מיד!",
      createProfileBtn: "יצירת הפרופיל שלי עכשיו ←",
      continueSchedule: "מעבר ישיר ליומן המארח ←",
      useDifferentEmail: "שימוש בכתובת אימייל אחרת",
      useDifferentPhone: "שימוש במספר טלפון אחר",
      step1: "1. איך תרצו להתחבר?",
      byEmail: "באמצעות אימייל",
      byPhone: "בהודעת SMS לטלפון",
      step2Email: "2. הקלידו את כתובת האימייל שלכם:",
      step2Phone: "2. הקלידו את מספר הטלפון הנייד:",
      sending: "ממשיך...",
      sendEmailBtn: "המשך באמצעות קישור לאימייל",
      sendPhoneBtn: "המשך באמצעות קוד SMS",
      newHere: "חדשים ב-SilverLingo? יצירת פרופיל אישי מיד",
      reassurance: "בטוח, פרטי ומותאם לכניסה פשוטה ונוחה.",
      helpFooter: "צריכים עזרה? מוקד התמיכה שלנו זמין עבורכם בכל עת.",
    },
  }[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const detectedTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      if (supabaseActive) {
        if (method === "email") {
          const { error } = await supabase.auth.signInWithOtp({
            email: identifier.trim(),
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: { timezone: detectedTimezone },
            },
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signInWithOtp({
            phone: identifier.trim(),
            options: {
              data: { timezone: detectedTimezone },
            },
          });
          if (error) throw error;
        }
      } else {
        await new Promise((r) => setTimeout(r, 350));
      }

      setSent(true);
    } catch (err: any) {
      setErrorMsg(
        err.message || "We could not send your sign-in link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#2A0854] via-[#4A148C] to-[#1D053A] text-white flex flex-col justify-between px-6 py-10">
      {/* Top Bar with Back Link & Language Switcher */}
      <div className="max-w-2xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="min-h-[60px] px-6 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/25 text-white font-bold text-[19px] inline-flex items-center gap-3 transition-all"
        >
          <BackArrow className="w-6 h-6" />
          <span>{t.backHome}</span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher size="elderly" />
        </div>
      </div>

      {/* Main Card: Warm High-Contrast Ivory Surface (WCAG AAA) */}
      <div className="my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl mx-auto bg-[#FDFBF7] text-slate-950 rounded-[32px] p-8 sm:p-12 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border-2 border-white"
        >
          {/* Header */}
          <header className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-[#4A148C]/30 text-[#4A148C] font-extrabold text-[18px]">
              <Sparkles className="w-5 h-5" />
              <span>{t.pill}</span>
            </div>

            <h1 className="text-[32px] sm:text-[38px] font-extrabold leading-[1.15] text-slate-950 tracking-tight">
              {t.title}
            </h1>

            <p className="text-[20px] text-slate-800 leading-relaxed">
              {t.subtitle}
            </p>
          </header>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              role="status"
              aria-live="polite"
              className="bg-emerald-50 border-2 border-emerald-700 rounded-3xl p-8 space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-[26px] sm:text-[28px] font-extrabold text-emerald-950 leading-tight">
                  {method === "email" ? t.sentTitleEmail : t.sentTitlePhone}
                </h2>
              </div>

              <p className="text-[20px] text-slate-900 leading-relaxed">
                {t.sentBody1}
                <strong className="underline decoration-2">{identifier}</strong>
                {t.sentBody2}
              </p>

              <div className="pt-2 space-y-6">
                <Link
                  href={`/onboarding?contact=${encodeURIComponent(identifier)}`}
                  className="w-full min-h-[68px] px-6 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-[22px] shadow-lg flex items-center justify-center gap-3 transition-all"
                >
                  <UserPlus className="w-6 h-6" />
                  <span>{t.createProfileBtn}</span>
                </Link>

                <Link
                  href="/availability"
                  className="w-full min-h-[64px] px-6 rounded-2xl bg-[#4A148C] hover:bg-[#2A0854] text-white font-extrabold text-[20px] shadow-md flex items-center justify-center gap-3 transition-all"
                >
                  <span>{t.continueSchedule}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setIdentifier("");
                  }}
                  className="w-full min-h-[64px] px-6 rounded-2xl border-2 border-slate-900 bg-white text-slate-950 font-bold text-[20px] hover:bg-slate-100 transition-colors focus:outline-none focus:ring-4 focus:ring-[#4A148C]"
                >
                  {method === "email"
                    ? t.useDifferentEmail
                    : t.useDifferentPhone}
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Step 1: Method Selector (Minimum 60px height, 24px gap) */}
              <div className="space-y-3">
                <span className="block text-[20px] font-extrabold text-slate-900">
                  {t.step1}
                </span>

                <div
                  role="group"
                  aria-label={t.step1}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMethod("email");
                      setErrorMsg(null);
                    }}
                    aria-pressed={method === "email"}
                    className={`min-h-[68px] px-6 rounded-2xl font-extrabold text-[20px] border-2 transition-all flex items-center justify-center gap-3 ${
                      method === "email"
                        ? "bg-[#4A148C] text-white border-[#4A148C] shadow-lg ring-4 ring-[#4A148C]/25"
                        : "bg-white text-slate-900 border-slate-400 hover:border-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <Mail className="w-6 h-6 shrink-0" />
                    <span>{t.byEmail}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod("phone");
                      setErrorMsg(null);
                    }}
                    aria-pressed={method === "phone"}
                    className={`min-h-[68px] px-6 rounded-2xl font-extrabold text-[20px] border-2 transition-all flex items-center justify-center gap-3 ${
                      method === "phone"
                        ? "bg-[#4A148C] text-white border-[#4A148C] shadow-lg ring-4 ring-[#4A148C]/25"
                        : "bg-white text-slate-900 border-slate-400 hover:border-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone className="w-6 h-6 shrink-0" />
                    <span>{t.byPhone}</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Input Field */}
              <div className="pt-2 space-y-3">
                <label
                  htmlFor="auth-identifier"
                  className="block text-[20px] font-extrabold text-slate-950"
                >
                  {method === "email" ? t.step2Email : t.step2Phone}
                </label>
                <input
                  id="auth-identifier"
                  dir="ltr"
                  type={method === "email" ? "email" : "tel"}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    method === "email"
                      ? "bar@example.com"
                      : "+972 50-123-4567"
                  }
                  className="w-full min-h-[68px] px-6 rounded-2xl bg-white border-2 border-slate-800 text-[22px] font-semibold text-slate-950 placeholder-slate-400 shadow-inner focus:outline-none focus:border-[#4A148C] focus:ring-4 focus:ring-[#4A148C]/25"
                />
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div
                  role="alert"
                  className="p-5 rounded-2xl bg-red-50 border-2 border-red-800 text-red-950 text-[20px] font-bold"
                >
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Primary CTA (#FF6D00) — Minimum 68px height, 24px gap above */}
              <div className="pt-2 space-y-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[72px] px-8 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] active:scale-[0.99] text-white font-extrabold text-[24px] shadow-[0_12px_30px_-6px_rgba(255,109,0,0.6)] transition-all flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-[#FF6D00] disabled:opacity-50"
                >
                  <span>
                    {loading
                      ? t.sending
                      : method === "email"
                      ? t.sendEmailBtn
                      : t.sendPhoneBtn}
                  </span>
                  <ForwardArrow className="w-7 h-7" />
                </button>

                {/* Direct 1-Click Create Profile Button */}
                <Link
                  href="/onboarding"
                  className="w-full min-h-[64px] px-6 rounded-2xl bg-purple-100 hover:bg-purple-200 border-2 border-[#4A148C] text-[#4A148C] font-extrabold text-[20px] flex items-center justify-center gap-3 transition-colors"
                >
                  <UserPlus className="w-6 h-6" />
                  <span>{t.newHere}</span>
                </Link>
              </div>

              {/* Reassurance Footer */}
              <div className="pt-2 flex items-center justify-center gap-2.5 text-slate-700 text-[18px] font-medium">
                <ShieldCheck className="w-6 h-6 text-[#4A148C] shrink-0" />
                <span>{t.reassurance}</span>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      <div className="text-center text-purple-200/80 text-[18px]">
        {t.helpFooter}
      </div>
    </main>
  );
}
