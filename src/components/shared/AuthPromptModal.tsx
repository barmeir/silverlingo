"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useUserProfile } from "@/context/UserProfileContext";
import {
  COUNTRY_CALLING_CODES,
  validatePhoneForCountryCode,
} from "@/lib/location-timezone";
import {
  Lock,
  Mail,
  Smartphone,
  LogIn,
  UserPlus,
  X,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

export interface AuthPromptDetail {
  actionLabelEn?: string;
  actionLabelHe?: string;
}

export function openAuthPromptModal(detail?: AuthPromptDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("silverlingo:open-auth-prompt", { detail })
    );
  }
}

export default function AuthPromptModal() {
  const router = useRouter();
  const { lang, isRTL } = useLanguage();
  const { identifyExistingUser } = useUserProfile();
  const ForwardArrow = isRTL ? ArrowLeft : ArrowRight;

  const [isOpen, setIsOpen] = useState(false);
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [actionDetail, setActionDetail] = useState<AuthPromptDetail | null>(
    null
  );
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notFoundContact, setNotFoundContact] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<AuthPromptDetail | undefined>;
      setActionDetail(customEvent.detail || null);
      setShowSignInForm(false);
      setErrorMsg(null);
      setNotFoundContact(null);
      setIsOpen(true);
    };

    window.addEventListener("silverlingo:open-auth-prompt", handleOpen);
    return () => {
      window.removeEventListener("silverlingo:open-auth-prompt", handleOpen);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setErrorMsg(null);
    setNotFoundContact(null);
  };

  const selectedCodeObj =
    COUNTRY_CALLING_CODES.find((c) => c.code === phoneCountryCode) ||
    COUNTRY_CALLING_CODES[0];

  const t = {
    en: {
      badge: "Sign-In Required",
      title: "Registration or Sign In",
      defaultSub:
        "You must be signed in to perform this action. Choose Registration or Sign In below:",
      actionPrefix: "To ",
      actionSuffix: ", please register or sign in first:",
      registrationBtn: "Registration",
      signInChoiceBtn: "Sign In",
      backToChoices: "← Back",
      step1: "1. How would you like to identify yourself?",
      byEmail: "By Email Address",
      byPhone: "By Phone Number",
      emailLabel: "2. Enter your Email Address:",
      phoneLabel: "2. Select Calling Code & Enter Phone Number:",
      signInBtn: "Sign In Now",
      checking: "Checking Account...",
      cancelBtn: "Cancel",
      notFoundTitle: "Account not registered yet!",
      notFoundBody:
        "We couldn't find an existing profile for this contact. Complete our quick Registration Screen (with photo & time zone) to continue:",
      completeRegBtn: "Continue to Registration →",
    },
    he: {
      badge: "נדרשת התחברות למערכת",
      title: "הרשמה או התחברות",
      defaultSub:
        "פעולה זו זמינה למשתמשים מחוברים בלבד. בחרו הרשמה או התחברות למטה:",
      actionPrefix: "כדי ",
      actionSuffix: ", יש להירשם או להתחבר תחילה:",
      registrationBtn: "הרשמה (Registration)",
      signInChoiceBtn: "התחברות (Sign In)",
      backToChoices: "→ חזרה",
      step1: "1. איך תרצו להזדהות?",
      byEmail: "באמצעות אימייל",
      byPhone: "באמצעות מספר טלפון",
      emailLabel: "2. הקלידו את כתובת האימייל שלכם:",
      phoneLabel: "2. בחרו קידומת מדינה והקלידו מספר טלפון:",
      signInBtn: "התחברות כעת",
      checking: "בודק חשבון...",
      cancelBtn: "ביטול",
      notFoundTitle: "החשבון עדיין לא רשום במערכת!",
      notFoundBody:
        "לא נמצא פרופיל קיים עבור פרטי הקשר הללו. השלימו את מסך ההרשמה המהיר (כולל תמונת פרופיל ואזור זמן) כדי להמשיך:",
      completeRegBtn: "המשך למסך ההרשמה ←",
    },
  }[lang];

  const subtitleText =
    lang === "he" && actionDetail?.actionLabelHe
      ? `${t.actionPrefix}${actionDetail.actionLabelHe}${t.actionSuffix}`
      : lang === "en" && actionDetail?.actionLabelEn
      ? `${t.actionPrefix}${actionDetail.actionLabelEn}${t.actionSuffix}`
      : t.defaultSub;

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setNotFoundContact(null);

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
      }

      const foundProfile = await identifyExistingUser({
        email: cleanEmail,
        phoneE164: cleanPhoneE164,
      });

      if (foundProfile) {
        setIsOpen(false);
        return;
      }

      setNotFoundContact(cleanEmail || cleanPhoneE164 || "");
    } catch (err: any) {
      setErrorMsg(
        err.message || "Could not verify your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm"
        >
          <motion.div
            key="auth-prompt-modal"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-[#FDFBF7] text-slate-950 rounded-3xl shadow-[0_25px_75px_rgba(0,0,0,0.8)] border-2 border-white overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4A148C] via-purple-800 to-[#2A0854] text-white p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FF6D00] text-white flex items-center justify-center shadow-md shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                    {t.badge}
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                    {t.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close Sign-In Popup"
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                {subtitleText}
              </p>

              {notFoundContact ? (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-600 space-y-3">
                  <div className="font-extrabold text-sm sm:text-base text-amber-950">
                    {t.notFoundTitle}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {t.notFoundBody}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const contactParam = encodeURIComponent(notFoundContact);
                      handleClose();
                      router.push(`/onboarding?contact=${contactParam}`);
                    }}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span>{t.completeRegBtn}</span>
                  </button>
                </div>
              ) : !showSignInForm ? (
                /* Simple 2-Button View: 1) Registration, 2) Sign In */
                <div className="space-y-3 pt-1">
                  <Link
                    href="/onboarding"
                    onClick={handleClose}
                    className="w-full min-h-[56px] px-5 py-3 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-base sm:text-lg shadow-lg flex items-center justify-center gap-2.5 transition-all"
                  >
                    <UserPlus className="w-5 h-5 shrink-0" />
                    <span>{t.registrationBtn}</span>
                    <ForwardArrow className="w-5 h-5 shrink-0" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSignInForm(true);
                      setErrorMsg(null);
                    }}
                    className="w-full min-h-[56px] px-5 py-3 rounded-2xl bg-[#4A148C] hover:bg-[#380E6B] text-white font-extrabold text-base sm:text-lg shadow-md flex items-center justify-center gap-2.5 transition-all"
                  >
                    <LogIn className="w-5 h-5 shrink-0" />
                    <span>{t.signInChoiceBtn}</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleQuickLogin} className="space-y-4" noValidate>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignInForm(false);
                        setErrorMsg(null);
                      }}
                      className="text-xs sm:text-sm font-extrabold text-[#4A148C] hover:underline"
                    >
                      {t.backToChoices}
                    </button>
                  </div>

                  {/* Step 1: Method Toggle */}
                  <div className="space-y-2">
                    <span className="block text-xs sm:text-sm font-extrabold text-slate-900">
                      {t.step1}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMethod("email");
                          setIdentifier("");
                          setErrorMsg(null);
                        }}
                        className={`min-h-[44px] px-3 rounded-xl font-extrabold text-xs sm:text-sm border-2 flex items-center justify-center gap-2 transition-all ${
                          method === "email"
                            ? "bg-[#4A148C] text-white border-[#4A148C] shadow-sm"
                            : "bg-white text-slate-800 border-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <Mail className="w-4 h-4 shrink-0" />
                        <span>{t.byEmail}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMethod("phone");
                          setIdentifier("");
                          setErrorMsg(null);
                        }}
                        className={`min-h-[44px] px-3 rounded-xl font-extrabold text-xs sm:text-sm border-2 flex items-center justify-center gap-2 transition-all ${
                          method === "phone"
                            ? "bg-[#4A148C] text-white border-[#4A148C] shadow-sm"
                            : "bg-white text-slate-800 border-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <Smartphone className="w-4 h-4 shrink-0" />
                        <span>{t.byPhone}</span>
                      </button>
                    </div>
                  </div>

                  {/* Input */}
                  {method === "email" ? (
                    <div className="space-y-1.5">
                      <label className="block text-xs sm:text-sm font-extrabold text-slate-900">
                        {t.emailLabel}
                      </label>
                      <input
                        dir="ltr"
                        type="email"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full min-h-[48px] px-3.5 rounded-xl bg-white border-2 border-slate-700 text-sm sm:text-base font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-extrabold text-slate-900">
                        {t.phoneLabel}
                      </label>
                      <select
                        aria-label="Country Calling Code"
                        dir="ltr"
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-white border-2 border-slate-700 text-xs sm:text-sm font-bold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                      >
                        {COUNTRY_CALLING_CODES.map((cc) => (
                          <option key={cc.id} value={cc.code}>
                            {cc.flag}{" "}
                            {lang === "he" ? cc.countryHe : cc.countryEn}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2" dir="ltr">
                        <span className="min-h-[48px] px-3 rounded-xl bg-purple-100 border-2 border-[#4A148C] text-[#4A148C] font-extrabold text-sm flex items-center justify-center shrink-0">
                          {phoneCountryCode}
                        </span>
                        <input
                          dir="ltr"
                          type="tel"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder={selectedCodeObj.placeholder}
                          className="w-full min-h-[48px] px-3.5 rounded-xl bg-white border-2 border-slate-700 text-sm sm:text-base font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                        />
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-700 text-red-950 text-xs sm:text-sm font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[50px] px-5 rounded-xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4 shrink-0" />
                    <span>{loading ? t.checking : t.signInBtn}</span>
                    <ForwardArrow className="w-4 h-4 shrink-0" />
                  </button>
                </form>
              )}

              {/* Bottom Cancel Button */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  {t.cancelBtn}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
