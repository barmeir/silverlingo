"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useUserProfile } from "@/context/UserProfileContext";
import {
  Sparkles,
  UserPlus,
  Camera,
  Globe2,
  Calendar,
  BellRing,
  Video,
  ArrowRight,
  ArrowLeft,
  X,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

const STORAGE_GUIDE_KEY = "silverlingo_welcome_guide_seen_v1";

export function openWelcomeGuide() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("silverlingo:open-guide"));
  }
}

export default function WelcomeGuideModal() {
  const pathname = usePathname();
  const { lang, isRTL } = useLanguage();
  const { profile } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const NextArrow = isRTL ? ArrowLeft : ArrowRight;
  const PrevArrow = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => {
    const handleOpenEvent = () => {
      setStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("silverlingo:open-guide", handleOpenEvent);
    return () => {
      window.removeEventListener("silverlingo:open-guide", handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    // Only auto-popup on the main screen ("/") after 6 seconds for first-time visitors
    const isMainScreen =
      pathname === "/" || pathname === "/silverlingo" || pathname === "/silverlingo/";
    if (!isMainScreen) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      const seen = window.localStorage.getItem(STORAGE_GUIDE_KEY);
      if (!seen) {
        timer = setTimeout(() => {
          setIsOpen(true);
        }, 6000);
      }
    } catch {
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 6000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  const handleCloseOrSkip = () => {
    try {
      window.localStorage.setItem(STORAGE_GUIDE_KEY, "true");
    } catch {}
    setIsOpen(false);
  };

  const steps =
    lang === "he"
      ? [
          {
            badge: "ברוכים הבאים ל-SilverLingo",
            title: "חילופי שפה בין-דוריים סביב תחביבים משותפים",
            description:
              "SilverLingo מחברת בין אזרחים ותיקים דוברי אנגלית שפת אם (Hosts) לבין בני נוער הלומדים אנגלית (Learners) לשיחות וידאו של 30 דקות אחד-על-אחד.",
            highlights: [
              "שיחות וידאו ידידותיות של 30 דקות סביב תחומי עניין משותפים",
              "מותאם במלואו לטלפון נייד ולמחשב",
              "תמיכה מלאה באנגלית ובעברית",
            ],
            icon: Sparkles,
            accent: "from-[#4A148C] to-purple-700",
          },
          {
            badge: "שלב 1 מתוך 4 • הרשמה וזיהוי",
            title: "הרשמה קלה ומהירה",
            description:
              "יצירת החשבון אורכת פחות מדקה — ללא צורך בסיסמה!",
            highlights: [
              "הזינו אימייל + מספר טלפון",
              "העלו תמונת פרופיל",
              "כדי לקבוע פגישה, יש להיות מחוברים למערכת.",
            ],
            icon: Camera,
            accent: "from-[#FF6D00] to-amber-600",
          },
          {
            badge: "שלב 2 מתוך 4 • מיקום ואזור זמן",
            title: "המרת אזורי זמן אוטומטית",
            description: "בחרו את מדינת המגורים שלכם.",
            highlights: [
              "המערכת מזהה אוטומטית את אזור הזמן המדויק שלכם (כולל שעון קיץ)",
              "20:00 בישראל = 10:00 בניו יורק = 7:00 בקליפורניה באופן אוטומטי!",
              "כל משתתף רואה את כל השעות לפי השעון המקומי שלו",
            ],
            icon: Globe2,
            accent: "from-emerald-600 to-teal-700",
          },
          {
            badge: "שלב 3 מתוך 4 • תחביבים וקביעת פגישה",
            title: "בחירת תחביבים ותיאום שיחה ביומן",
            description:
              "בחרו מתוך 24+ תחביבים (או הוסיפו תחביב משלכם) כדי שה-AI יתאים לכם שותפים לשיחה.",
            highlights: [
              "תלמידים: מסננים מארחים לפי תחביב ובוחרים משבצת פנויה של 30 דקות",
              "מארחים: מסמנים ביומן השבועי את השעות שבהן נוח להם לשוחח",
              "ניתן לשנות מועד פגישה או לבטל בכל עת בלחיצת כפתור",
            ],
            icon: Calendar,
            accent: "from-purple-700 to-indigo-800",
          },
          {
            badge: "שלב 4 מתוך 4 • התראות וחדר וידאו",
            title: "אישורי SMS + אימייל וכניסה לשיחת הווידאו",
            description:
              "ברגע שנקבעת, משתנה או מתבטלת פגישה, שני המשתתפים מקבלים עדכון אוטומטי!",
            highlights: [
              "התראת SMS לטלפון והודעת אימייל עם תאריך, שעה מקומית וקיצור אזור הזמן",
              "חדר המתנה עם שאלת שבירת קרח (AI Icebreaker) מותאמת לתחביב המשותף",
              "לחיצה אחת להצטרפות לשיחת הווידאו החיה",
            ],
            icon: BellRing,
            accent: "from-[#4A148C] to-[#FF6D00]",
          },
        ]
      : [
          {
            badge: "Welcome to SilverLingo",
            title: "Intergenerational English Exchange Over Shared Hobbies",
            description:
              "SilverLingo connects retired native English speakers (Senior Hosts) with Teen Learners worldwide for friendly 30-minute 1-on-1 video calls.",
            highlights: [
              "30-minute 1-on-1 video conversations matched by shared hobbies",
              "Fully responsive and optimized for mobile phones & desktop",
              "Available in English and Hebrew",
            ],
            icon: Sparkles,
            accent: "from-[#4A148C] to-purple-700",
          },
          {
            badge: "Step 1 of 4 • Registration & Sign-In",
            title: "Easy Registration",
            description:
              "Creating your account takes less than a minute—no password needed!",
            highlights: [
              "Enter your Email + Phone Number",
              "Upload a profile picture",
              "To schedule a meeting, you must be signed in.",
            ],
            icon: Camera,
            accent: "from-[#FF6D00] to-amber-600",
          },
          {
            badge: "Step 2 of 4 • Country, State & Time Zone",
            title: "Automatic Time Zone Conversion (Including DST)",
            description: "Select your Country of Residence.",
            highlights: [
              "Automatically detects and applies your exact local time zone",
              "20:00 Israel = 10:00 AM New York = 7:00 AM California automatically",
              "Automatically adjusts for Daylight Saving Time",
            ],
            icon: Globe2,
            accent: "from-emerald-600 to-teal-700",
          },
          {
            badge: "Step 3 of 4 • Hobbies & Scheduling",
            title: "Pick Your Favorite Hobbies & Book a 30-Min Slot",
            description:
              "Pick from 24+ hobbies (or add your own custom hobby) so our AI matches you with the right conversation partner.",
            highlights: [
              "Learners: Filter hosts by hobby and book an available 30-minute slot",
              "Senior Hosts: Tap 30-minute slots on the weekly calendar when you're free",
              "Reschedule (+1h) or cancel meetings anytime with one tap",
            ],
            icon: Calendar,
            accent: "from-purple-700 to-indigo-800",
          },
          {
            badge: "Step 4 of 4 • Notifications & Video Lobby",
            title: "Automatic SMS & Email Reminders + 1-on-1 Waiting Room",
            description:
              "Whenever a meeting is scheduled, changed, or canceled, both participants are notified automatically!",
            highlights: [
              "SMS & Email notifications with Date, Local Time, Time Zone abbreviation, and links",
              "5-minute Waiting Room with a personalized AI Icebreaker question",
              "One-tap Join Video Call button for mobile and desktop",
            ],
            icon: BellRing,
            accent: "from-[#4A148C] to-[#FF6D00]",
          },
        ];

  const currentStep = steps[stepIndex] || steps[0];
  const StepIcon = currentStep.icon;
  const isLastStep = stepIndex === steps.length - 1;

  const t = {
    en: {
      guideBtnLabel: "Guide",
      skipBtn: "Skip Guide",
      backBtn: "Back",
      nextBtn: "Next Step",
      finishBtn: "Got It, Let's Start!",
      registerNow: "Go to Registration",
      exploreHosts: "Explore Hosts",
      stepCounter: `Step ${stepIndex + 1} of ${steps.length}`,
    },
    he: {
      guideBtnLabel: "מדריך",
      skipBtn: "דלג על המדריך",
      backBtn: "הקודם",
      nextBtn: "השלב הבא",
      finishBtn: "הבנתי, בואו נתחיל!",
      registerNow: "מעבר להרשמה",
      exploreHosts: "צפייה במארחים",
      stepCounter: `שלב ${stepIndex + 1} מתוך ${steps.length}`,
    },
  }[lang];

  return (
    <>
      {/* Floating Compact Help / Guide Button (Always accessible in bottom corner) */}
      <button
        type="button"
        onClick={() => {
          setStepIndex(0);
          setIsOpen(true);
        }}
        aria-label="Open Step-by-Step Guide"
        className="fixed bottom-4 right-4 z-40 min-h-[46px] px-4 py-2.5 rounded-full bg-gradient-to-r from-[#4A148C] to-purple-800 hover:from-[#5c19ad] hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-2 border-white/30 flex items-center gap-2 transition-all active:scale-95"
      >
        <HelpCircle className="w-4 h-4 text-[#FF6D00] shrink-0" />
        <span>{t.guideBtnLabel}</span>
      </button>

      {/* Compact Step-by-Step Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={currentStep.title}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              key="welcome-guide-modal"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.22 }}
              className="relative w-full max-w-lg bg-[#FDFBF7] text-slate-950 rounded-3xl shadow-[0_25px_75px_rgba(0,0,0,0.75)] border-2 border-white overflow-hidden"
            >
              {/* Top Gradient Header Banner */}
              <div
                className={`bg-gradient-to-r ${currentStep.accent} text-white p-4 sm:p-5 flex items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0">
                    <StepIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-200 truncate">
                      {currentStep.badge}
                    </span>
                    <span className="block text-xs text-white/85 font-semibold">
                      {t.stepCounter}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseOrSkip}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-extrabold transition-colors"
                  >
                    {t.skipBtn}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseOrSkip}
                    aria-label="Close Guide"
                    className="w-8 h-8 rounded-xl bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-200">
                <div
                  className="h-full bg-[#FF6D00] transition-all duration-300"
                  style={{
                    width: `${((stepIndex + 1) / steps.length) * 100}%`,
                  }}
                />
              </div>

              {/* Step Content Body */}
              <div className="p-5 sm:p-6 space-y-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 leading-snug">
                  {currentStep.title}
                </h2>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {currentStep.description}
                </p>

                <ul className="space-y-2.5 bg-purple-50/80 border border-purple-200 rounded-2xl p-3.5 sm:p-4">
                  {currentStep.highlights.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-slate-900"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#4A148C] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Quick Shortcut Links on Last Step */}
                {isLastStep && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {!profile && (
                      <Link
                        href="/onboarding"
                        onClick={handleCloseOrSkip}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 border border-[#4A148C] text-[#4A148C] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <UserPlus className="w-4 h-4 shrink-0" />
                        <span>{t.registerNow}</span>
                      </Link>
                    )}
                    <Link
                      href="/explore"
                      onClick={handleCloseOrSkip}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Video className="w-4 h-4 text-[#FF6D00] shrink-0" />
                      <span>{t.exploreHosts}</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer: Step Dots + Back / Skip / Next Buttons */}
              <div className="px-5 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                {/* Step Indicator Dots */}
                <div className="flex items-center gap-1.5">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Go to step ${idx + 1}`}
                      onClick={() => setStepIndex(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === stepIndex
                          ? "w-6 bg-[#4A148C]"
                          : "w-2.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ms-auto">
                  {stepIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStepIndex((prev) => prev - 1)}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                    >
                      <PrevArrow className="w-4 h-4" />
                      <span>{t.backBtn}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCloseOrSkip}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 font-bold text-xs sm:text-sm transition-colors"
                    >
                      {t.skipBtn}
                    </button>
                  )}

                  {!isLastStep ? (
                    <button
                      type="button"
                      onClick={() => setStepIndex((prev) => prev + 1)}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-colors"
                    >
                      <span>{t.nextBtn}</span>
                      <NextArrow className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCloseOrSkip}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.finishBtn}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
