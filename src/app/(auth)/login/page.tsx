"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useUserProfile, type UserProfile } from "@/context/UserProfileContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import {
  COUNTRY_CALLING_CODES,
  validatePhoneForCountryCode,
} from "@/lib/location-timezone";
import { sendFirstLoginVerificationCode } from "@/lib/verification";
import {
  Mail,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  UserPlus,
  LogIn,
  KeyRound,
  RefreshCw,
} from "lucide-react";

type AuthMethod = "email" | "phone";

export default function PasswordlessLoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const { lang, isRTL } = useLanguage();
  const { lookupUserForLogin, completeFirstLoginVerification } =
    useUserProfile();
  const ForwardArrow = isRTL ? ArrowLeft : ArrowRight;
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [showSignInForm, setShowSignInForm] = useState(false);
  const [method, setMethod] = useState<AuthMethod>("email");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formattedContact, setFormattedContact] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // First-time login verification code state
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [expectedCode, setExpectedCode] = useState<string>("");
  const [enteredCode, setEnteredCode] = useState<string>("");
  const [codeMessagePreview, setCodeMessagePreview] = useState<string>("");

  const supabaseActive = isSupabaseConfigured();
  const selectedCodeObj =
    COUNTRY_CALLING_CODES.find((c) => c.code === phoneCountryCode) ||
    COUNTRY_CALLING_CODES[0];

  const t = {
    en: {
      backHome: "Back to Home",
      pill: "Welcome to SilverLingo",
      title: "Registration or Sign In",
      subtitle:
        "Choose Registration if you are new, or click Sign In if you already have an account.",
      registrationBtn: "Registration",
      signInToggleBtn: "Sign In",
      backToChoices: "← Back",
      sentTitle: "Account Ready! Complete Your Registration",
      sentBody1: "We could not find an existing profile for ",
      sentBody2:
        " yet. Please complete our quick Registration Screen (Email, Phone, Country/State Time Zone & Profile Picture) to start!",
      createProfileBtn: "Go to Registration Screen →",
      useDifferent: "Use a different Email or Phone Number",
      step1: "1. How would you like to identify yourself?",
      byEmail: "By Email Address",
      byPhone: "By Phone Number",
      callingCodeLabel: "Country Calling Code",
      step2Email: "2. Enter your Email Address:",
      step2Phone: "2. Select Calling Code & Enter Phone Number:",
      sending: "Checking Account...",
      sendEmailBtn: "Sign In with Email",
      sendPhoneBtn: "Sign In with Phone Number",
      verifyTitle: "First-Time Sign-In Verification Code",
      verifySub1: "Since this is your first time signing in, we sent a 6-digit verification code to ",
      verifySub2: " (required only on your first login).",
      codeLabel: "Enter 6-Digit Verification Code:",
      verifyBtn: "Verify Code & Sign In",
      resendBtn: "Resend Verification Code",
      invalidCodeErr: "Incorrect verification code. Please check the 6-digit code and try again.",
      dispatchedNotice: "Verification code dispatched to your ",
      newHere: "Registration",
      reassurance: "Safe, password-free identification with automatic timezone sync.",
      helpFooter: "SilverLingo • Connecting Generations Across Time Zones",
    },
    he: {
      backHome: "חזרה לדף הבית",
      pill: "ברוכים הבאים ל-SilverLingo",
      title: "הרשמה או התחברות",
      subtitle:
        "בחרו ׳הרשמה׳ אם אתם משתמשים חדשים, או לחצו על ׳התחברות׳ אם כבר יצרתם חשבון.",
      registrationBtn: "הרשמה (Registration)",
      signInToggleBtn: "התחברות (Sign In)",
      backToChoices: "→ חזרה לבחירה",
      sentTitle: "השלימו את ההרשמה שלכם!",
      sentBody1: "עדיין לא קיים פרופיל רשום עבור ",
      sentBody2:
        ". אנא השלימו את טופס ההרשמה (אימייל, טלפון, מדינה/אזור זמן ותמונת פרופיל חובה) כדי להתחיל!",
      createProfileBtn: "מעבר למסך ההרשמה ←",
      useDifferent: "שימוש באימייל או מספר טלפון אחר",
      step1: "1. איך תרצו להזדהות?",
      byEmail: "באמצעות אימייל",
      byPhone: "באמצעות מספר טלפון",
      callingCodeLabel: "קידומת מדינה",
      step2Email: "2. הקלידו את כתובת האימייל שלכם:",
      step2Phone: "2. בחרו קידומת מדינה והקלידו מספר טלפון:",
      sending: "בודק חשבון...",
      sendEmailBtn: "כניסה באמצעות אימייל",
      sendPhoneBtn: "כניסה באמצעות מספר טלפון",
      verifyTitle: "קוד אימות לכניסה ראשונה",
      verifySub1: "מכיוון שזו הכניסה הראשונה שלך למערכת, שלחנו קוד אימות בן 6 ספרות אל ",
      verifySub2: " (נדרש אך ורק בהתחברות הראשונה).",
      codeLabel: "הזינו קוד אימות בן 6 ספרות:",
      verifyBtn: "אימות קוד וכניסה למערכת",
      resendBtn: "שלח קוד אימות מחדש",
      invalidCodeErr: "קוד האימות שגוי. נא לבדוק את הקוד בן 6 הספרות ולנסות שוב.",
      dispatchedNotice: "קוד האימות נשלח אל ה",
      newHere: "הרשמה",
      reassurance: "זיהוי מהיר ובטוח ללא סיסמה עם סנכרון אזור זמן אוטומטי.",
      helpFooter: "SilverLingo • מחברים בין דורות ברחבי העולם",
    },
  }[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let cleanEmail: string | undefined;
      let cleanPhoneE164: string | undefined;

      if (method === "email") {
        cleanEmail = identifier.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          throw new Error(
            lang === "he"
              ? "נא להזין כתובת אימייל תקינה."
              : "Please enter a valid email address."
          );
        }
        setFormattedContact(cleanEmail);
      } else {
        const phoneCheck = validatePhoneForCountryCode(
          identifier,
          phoneCountryCode
        );
        if (!phoneCheck.valid) {
          throw new Error(
            (lang === "he" ? phoneCheck.errorHe : phoneCheck.errorEn) ||
              "Invalid phone number."
          );
        }
        cleanPhoneE164 = phoneCheck.e164;
        setFormattedContact(cleanPhoneE164);
      }

      // 1. Check if this user is already registered in Supabase public.users or local profile
      const lookupResult = await lookupUserForLogin({
        email: cleanEmail,
        phoneE164: cleanPhoneE164,
      });

      if (lookupResult) {
        const { user, requiresFirstLoginVerification } = lookupResult;

        if (requiresFirstLoginVerification) {
          const targetAddress =
            (method === "email" ? cleanEmail || user.email : cleanPhoneE164 || user.phone) ||
            formattedContact;

          const dispatched = await sendFirstLoginVerificationCode({
            userId: user.id,
            recipientName: user.fullName,
            recipientRole: user.role,
            channel: method,
            address: targetAddress,
          });

          setPendingUser(user);
          setExpectedCode(dispatched.code);
          setEnteredCode("");
          setCodeMessagePreview(dispatched.messagePreview);
          return;
        }

        // Already verified on first login -> sign in immediately without code
        const verifiedProfile = await completeFirstLoginVerification(user);
        const dest =
          verifiedProfile.role === "elderly" ? "/availability" : "/explore";
        router.push(dest);
        return;
      }

      // 2. Also trigger Supabase Magic Link if email method is used
      if (supabaseActive && cleanEmail) {
        try {
          await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
        } catch {}
      }

      setSent(true);
    } catch (err: any) {
      setErrorMsg(
        err.message || "Could not verify your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFirstLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pendingUser) return;
    const cleanCode = enteredCode.trim();
    let codeValid = cleanCode === expectedCode;

    // Also allow Supabase Auth Email OTP token if user received a Supabase OTP email
    if (!codeValid && method === "email" && supabaseActive && formattedContact) {
      try {
        const { error } = await supabase.auth.verifyOtp({
          email: formattedContact,
          token: cleanCode,
          type: "email",
        });
        if (!error) {
          codeValid = true;
        }
      } catch {}
    }

    if (!codeValid) {
      setErrorMsg(t.invalidCodeErr);
      return;
    }

    setLoading(true);
    try {
      const verifiedProfile = await completeFirstLoginVerification(pendingUser);
      const dest =
        verifiedProfile.role === "elderly" ? "/availability" : "/explore";
      router.push(dest);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantAutoVerify = async () => {
    if (!pendingUser || !expectedCode) return;
    setEnteredCode(expectedCode);
    setErrorMsg(null);
    setLoading(true);
    try {
      const verifiedProfile = await completeFirstLoginVerification(pendingUser);
      const dest =
        verifiedProfile.role === "elderly" ? "/availability" : "/explore";
      router.push(dest);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingUser) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const dispatched = await sendFirstLoginVerificationCode({
        userId: pendingUser.id,
        recipientName: pendingUser.fullName,
        recipientRole: pendingUser.role,
        channel: method,
        address: formattedContact,
      });
      setExpectedCode(dispatched.code);
      setEnteredCode("");
      setCodeMessagePreview(dispatched.messagePreview);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#2A0854] via-[#4A148C] to-[#1D053A] text-white flex flex-col justify-between px-3 sm:px-6 py-5 sm:py-10">
      {/* Top Bar */}
      <div className="max-w-2xl w-full mx-auto flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="min-h-[48px] sm:min-h-[56px] px-4 sm:px-5 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/25 text-white font-bold text-base sm:text-[18px] inline-flex items-center gap-2 transition-all"
        >
          <BackArrow className="w-5 h-5" />
          <span>{t.backHome}</span>
        </Link>

        <LanguageSwitcher />
      </div>

      {/* Main Card */}
      <div className="my-auto py-5 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl mx-auto bg-[#FDFBF7] text-slate-950 rounded-3xl sm:rounded-[32px] p-5 sm:p-10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border-2 border-white"
        >
          <header className="mb-6 sm:mb-8 space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 border border-[#4A148C]/30 text-[#4A148C] font-extrabold text-sm sm:text-[16px]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{t.pill}</span>
            </div>

            <h1 className="text-2xl sm:text-[36px] font-extrabold leading-tight text-slate-950 tracking-tight">
              {t.title}
            </h1>

            <p className="text-base sm:text-[19px] text-slate-700 leading-relaxed">
              {t.subtitle}
            </p>
          </header>

          {pendingUser ? (
            /* First-Time Login 6-Digit Verification Code View */
            <form
              onSubmit={handleVerifyFirstLoginCode}
              className="space-y-5 bg-purple-50/90 border-2 border-[#4A148C] rounded-3xl p-5 sm:p-8"
              noValidate
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#4A148C] text-white flex items-center justify-center shrink-0 shadow-md">
                  <KeyRound className="w-6 h-6 text-[#FF6D00]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-[26px] font-extrabold text-slate-950 leading-tight">
                    {t.verifyTitle}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-700 font-semibold">
                    {pendingUser.fullName}
                  </p>
                </div>
              </div>

              <p className="text-base sm:text-[18px] text-slate-800 leading-relaxed">
                {t.verifySub1}
                <strong className="underline decoration-2" dir="ltr">
                  {formattedContact}
                </strong>
                {t.verifySub2}
              </p>

              {/* Notification Dispatch Confirmation Box + 1-Tap Auto-Fill */}
              {expectedCode && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-700 text-emerald-950 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-extrabold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        {lang === "he"
                          ? `קוד האימות שלך ל-${formattedContact}:`
                          : `Your Verification Code for ${formattedContact}:`}
                      </span>
                    </span>
                    <span
                      dir="ltr"
                      className="px-3 py-1 rounded-xl bg-emerald-700 text-white text-base sm:text-lg font-mono font-extrabold tracking-widest"
                    >
                      {expectedCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleInstantAutoVerify}
                    className="w-full min-h-[46px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {lang === "he"
                        ? `לחצו כאן למילוי אוטומטי ואימות הקוד (${expectedCode})`
                        : `Tap Here to Auto-Fill & Verify Code (${expectedCode})`}
                    </span>
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="verification-code-input"
                  className="block text-base sm:text-[19px] font-extrabold text-slate-950"
                >
                  {t.codeLabel}
                </label>
                <input
                  id="verification-code-input"
                  dir="ltr"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={enteredCode}
                  onChange={(e) =>
                    setEnteredCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                  className="w-full min-h-[62px] px-4 rounded-2xl bg-white border-2 border-slate-900 text-center tracking-[0.35em] text-2xl sm:text-3xl font-extrabold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                />
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-red-50 border-2 border-red-800 text-red-950 text-base font-bold"
                >
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || enteredCode.length < 6}
                  className="w-full min-h-[62px] px-6 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-lg sm:text-[21px] shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span>{t.verifyBtn}</span>
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#4A148C] hover:underline"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t.resendBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingUser(null);
                      setExpectedCode("");
                      setEnteredCode("");
                      setErrorMsg(null);
                    }}
                    className="text-sm font-bold text-slate-600 hover:text-slate-900"
                  >
                    {t.useDifferent}
                  </button>
                </div>
              </div>
            </form>
          ) : sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              role="status"
              aria-live="polite"
              className="bg-emerald-50 border-2 border-emerald-700 rounded-3xl p-5 sm:p-8 space-y-5"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl sm:text-[26px] font-extrabold text-emerald-950 leading-tight">
                  {t.sentTitle}
                </h2>
              </div>

              <p className="text-base sm:text-[19px] text-slate-900 leading-relaxed">
                {t.sentBody1}
                <strong className="underline decoration-2" dir="ltr">
                  {formattedContact}
                </strong>
                {t.sentBody2}
              </p>

              <div className="pt-2 space-y-4">
                <Link
                  href={`/onboarding?contact=${encodeURIComponent(
                    formattedContact
                  )}`}
                  className="w-full min-h-[60px] px-5 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-lg sm:text-[21px] shadow-lg flex items-center justify-center gap-3 transition-all"
                >
                  <UserPlus className="w-6 h-6 shrink-0" />
                  <span>{t.createProfileBtn}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setIdentifier("");
                    setErrorMsg(null);
                  }}
                  className="w-full min-h-[56px] px-5 rounded-2xl border-2 border-slate-900 bg-white text-slate-950 font-bold text-base sm:text-[18px] hover:bg-slate-100 transition-colors"
                >
                  {t.useDifferent}
                </button>
              </div>
            </motion.div>
          ) : !showSignInForm ? (
            /* Initial Simple 2-Button View: 1st Button Registration, 2nd Button Sign In */
            <div className="space-y-4">
              {/* 1st Button: Registration */}
              <Link
                href="/onboarding"
                className="w-full min-h-[68px] px-6 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] active:scale-[0.99] text-white font-extrabold text-xl sm:text-[24px] shadow-[0_12px_30px_-6px_rgba(255,109,0,0.6)] flex items-center justify-center gap-3 transition-all"
              >
                <UserPlus className="w-6 h-6 shrink-0" />
                <span>{t.registrationBtn}</span>
                <ForwardArrow className="w-6 h-6 shrink-0" />
              </Link>

              {/* 2nd Button Below: Sign In */}
              <button
                type="button"
                onClick={() => {
                  setShowSignInForm(true);
                  setErrorMsg(null);
                }}
                className="w-full min-h-[68px] px-6 rounded-2xl bg-[#4A148C] hover:bg-[#380E6B] active:scale-[0.99] text-white font-extrabold text-xl sm:text-[24px] shadow-lg flex items-center justify-center gap-3 transition-all"
              >
                <LogIn className="w-6 h-6 shrink-0" />
                <span>{t.signInToggleBtn}</span>
              </button>

              <div className="pt-3 flex items-center justify-center gap-2 text-slate-700 text-sm sm:text-[16px] font-medium text-center">
                <ShieldCheck className="w-5 h-5 text-[#4A148C] shrink-0" />
                <span>{t.reassurance}</span>
              </div>
            </div>
          ) : (
            /* Expanded Sign-In Form (Revealed after clicking Sign In) */
            <form onSubmit={handleLogin} className="space-y-6" noValidate>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignInForm(false);
                    setErrorMsg(null);
                  }}
                  className="text-sm sm:text-base font-extrabold text-[#4A148C] hover:underline"
                >
                  {t.backToChoices}
                </button>
              </div>

              {/* Step 1: Method Selector */}
              <div className="space-y-2.5">
                <span className="block text-base sm:text-[19px] font-extrabold text-slate-900">
                  {t.step1}
                </span>

                <div
                  role="group"
                  aria-label={t.step1}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMethod("email");
                      setIdentifier("");
                      setErrorMsg(null);
                    }}
                    aria-pressed={method === "email"}
                    className={`min-h-[60px] px-5 rounded-2xl font-extrabold text-base sm:text-[19px] border-2 transition-all flex items-center justify-center gap-3 ${
                      method === "email"
                        ? "bg-[#4A148C] text-white border-[#4A148C] shadow-lg ring-4 ring-[#4A148C]/25"
                        : "bg-white text-slate-900 border-slate-400 hover:border-slate-800"
                    }`}
                  >
                    <Mail className="w-5 h-5 shrink-0" />
                    <span>{t.byEmail}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod("phone");
                      setIdentifier("");
                      setErrorMsg(null);
                    }}
                    aria-pressed={method === "phone"}
                    className={`min-h-[60px] px-5 rounded-2xl font-extrabold text-base sm:text-[19px] border-2 transition-all flex items-center justify-center gap-3 ${
                      method === "phone"
                        ? "bg-[#4A148C] text-white border-[#4A148C] shadow-lg ring-4 ring-[#4A148C]/25"
                        : "bg-white text-slate-900 border-slate-400 hover:border-slate-800"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 shrink-0" />
                    <span>{t.byPhone}</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Input Field */}
              {method === "email" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="auth-identifier"
                    className="block text-base sm:text-[19px] font-extrabold text-slate-950"
                  >
                    {t.step2Email}
                  </label>
                  <input
                    id="auth-identifier"
                    dir="ltr"
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="bar@example.com"
                    className="w-full min-h-[60px] px-4 rounded-2xl bg-white border-2 border-slate-800 text-lg sm:text-[21px] font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-[#4A148C]"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-base sm:text-[19px] font-extrabold text-slate-950">
                    {t.step2Phone}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <select
                        aria-label={t.callingCodeLabel}
                        dir="ltr"
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                        className="w-full min-h-[60px] px-3 rounded-2xl bg-white border-2 border-slate-800 text-base font-bold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                      >
                        {COUNTRY_CALLING_CODES.map((cc) => (
                          <option key={cc.id} value={cc.code}>
                            {cc.flag}{" "}
                            {lang === "he" ? cc.countryHe : cc.countryEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-7 flex items-center gap-2" dir="ltr">
                      <span className="min-h-[60px] px-3.5 rounded-2xl bg-purple-100 border-2 border-[#4A148C] text-[#4A148C] font-extrabold text-lg flex items-center justify-center shrink-0">
                        {phoneCountryCode}
                      </span>
                      <input
                        id="auth-phone-identifier"
                        dir="ltr"
                        type="tel"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={selectedCodeObj.placeholder}
                        className="w-full min-h-[60px] px-4 rounded-2xl bg-white border-2 border-slate-800 text-lg sm:text-[20px] font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-[#4A148C]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-red-50 border-2 border-red-800 text-red-950 text-base sm:text-[18px] font-bold"
                >
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="pt-2 space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[64px] px-6 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] active:scale-[0.99] text-white font-extrabold text-lg sm:text-[22px] shadow-[0_12px_30px_-6px_rgba(255,109,0,0.6)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <span>
                    {loading
                      ? t.sending
                      : method === "email"
                      ? t.sendEmailBtn
                      : t.sendPhoneBtn}
                  </span>
                  <ForwardArrow className="w-6 h-6" />
                </button>

                <Link
                  href="/onboarding"
                  className="w-full min-h-[58px] px-5 rounded-2xl bg-purple-100 hover:bg-purple-200 border-2 border-[#4A148C] text-[#4A148C] font-extrabold text-base sm:text-[19px] flex items-center justify-center gap-2.5 text-center transition-colors"
                >
                  <UserPlus className="w-5 h-5 shrink-0" />
                  <span>{t.newHere}</span>
                </Link>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-slate-700 text-sm sm:text-[16px] font-medium text-center">
                <ShieldCheck className="w-5 h-5 text-[#4A148C] shrink-0" />
                <span>{t.reassurance}</span>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      <div className="text-center text-purple-200/80 text-sm sm:text-[16px]">
        {t.helpFooter}
      </div>
    </main>
  );
}
