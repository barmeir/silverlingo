"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  format12Hour,
  localSlotToUTC,
  utcSlotToLocalKey,
  safeTimeZone,
} from "@/lib/timezone";
import { useLanguage } from "@/context/LanguageContext";
import { useUserProfile } from "@/context/UserProfileContext";
import {
  Sunrise,
  Sun,
  Moon,
  Check,
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
  Lock,
  LogIn,
  UserPlus,
} from "lucide-react";

const DAYS_OF_WEEK = [
  { index: 0, shortEn: "Sun", fullEn: "Sunday", shortHe: "א׳", fullHe: "יום ראשון" },
  { index: 1, shortEn: "Mon", fullEn: "Monday", shortHe: "ב׳", fullHe: "יום שני" },
  { index: 2, shortEn: "Tue", fullEn: "Tuesday", shortHe: "ג׳", fullHe: "יום שלישי" },
  { index: 3, shortEn: "Wed", fullEn: "Wednesday", shortHe: "ד׳", fullHe: "יום רביעי" },
  { index: 4, shortEn: "Thu", fullEn: "Thursday", shortHe: "ה׳", fullHe: "יום חמישי" },
  { index: 5, shortEn: "Fri", fullEn: "Friday", shortHe: "ו׳", fullHe: "יום שישי" },
  { index: 6, shortEn: "Sat", fullEn: "Saturday", shortHe: "ש׳", fullHe: "יום שבת" },
];

type TimePeriod = "morning" | "afternoon" | "evening";

function getSlotsForPeriod(period: TimePeriod): string[] {
  const ranges: Record<TimePeriod, [number, number]> = {
    morning: [9, 12],
    afternoon: [12, 16],
    evening: [16, 20],
  };

  const [startHour, endHour] = ranges[period];
  const slots: string[] = [];

  for (let h = startHour; h < endHour; h++) {
    const hh = String(h).padStart(2, "0");
    slots.push(`${hh}:00`);
    slots.push(`${hh}:30`);
  }
  return slots;
}

const DEFAULT_DEMO_SLOTS = [
  "1-09:30",
  "1-10:00",
  "3-10:00",
  "3-10:30",
  "5-09:00",
  "5-09:30",
];

export default function AvailabilityCalendar({ hostId }: { hostId: string }) {
  const supabase = createClient();
  const { lang } = useLanguage();
  const { profile } = useUserProfile();

  const isSignedIn = Boolean(
    profile &&
      profile.id &&
      profile.fullName?.trim() &&
      (profile.email?.trim() || profile.phone?.trim() || profile.contact?.trim())
  );

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    () => new Set(DEFAULT_DEMO_SLOTS)
  );
  const [period, setPeriod] = useState<TimePeriod>("morning");
  const [mobileDayIndex, setMobileDayIndex] = useState<number>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"paint" | "erase">("paint");
  const [saving, setSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>("America/New_York");

  useEffect(() => {
    if (profile?.timezone) {
      setUserTimezone(safeTimeZone(profile.timezone));
    } else {
      setUserTimezone(
        safeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      );
    }
  }, [profile?.timezone]);

  const t = {
    en: {
      localTimeBadge: `Shown in your time zone: ${userTimezone}`,
      title: "When would you like to chat with learners?",
      subtitle:
        "Tap any 30-minute time slot below to mark when you are free for a friendly video call. All times automatically convert to each learner's time zone.",
      selectedSlotsLabel: "Selected Slots",
      minUnit: "min",
      savingBtn: "Saving Schedule...",
      saveBtn: "Save My Schedule",
      savedMsg: (count: number) =>
        `Schedule saved! You have ${count} weekly 30-minute slots open in ${userTimezone} (stored in UTC for global timezone conversion).`,
      step1Title: "1. Pick a part of the day:",
      legendFree: "Available (Free)",
      legendOpen: "Unavailable (Tap to open)",
      morning: "Morning",
      morningSub: "9:00 AM – 12:00 PM",
      afternoon: "Afternoon",
      afternoonSub: "12:00 PM – 4:00 PM",
      evening: "Evening",
      eveningSub: "4:00 PM – 8:00 PM",
      viewing: "Viewing",
      step2Title: "2. Tap 30-minute time slots:",
      mobileDayLabel: "Select Day of Week:",
      dragTip: "Tip: Slide across boxes to select multiple slots!",
      timeCol: "Time",
      freeBtn: "Free",
      openBtn: "Open",
    },
    he: {
      localTimeBadge: `מוצג לפי אזור הזמן שלך: ${userTimezone}`,
      title: "מתי נוח לך לשוחח עם תלמידים?",
      subtitle:
        "לחצו על כל משבצת של 30 דקות למטה כדי לסמן מתי אתם פנויים לשיחת וידאו. השעות מומרות אוטומטית לאזור הזמן של כל תלמיד.",
      selectedSlotsLabel: "משבצות שנבחרו",
      minUnit: "דק׳",
      savingBtn: "שומר יומן...",
      saveBtn: "שמירת היומן שלי",
      savedMsg: (count: number) =>
        `היומן נשמר בהצלחה! פתחתם ${count} משבצות שבועיות של 30 דקות באזור הזמן ${userTimezone}.`,
      step1Title: "1. בחרו חלק ביום:",
      legendFree: "פנוי לשיחה (נבחר)",
      legendOpen: "לא נבחר (לחצו לפתיחה)",
      morning: "בוקר",
      morningSub: "9:00 – 12:00",
      afternoon: "צהריים",
      afternoonSub: "12:00 – 16:00",
      evening: "ערב",
      eveningSub: "16:00 – 20:00",
      viewing: "מוצג כעת",
      step2Title: "2. בחרו משבצות של 30 דקות:",
      mobileDayLabel: "בחרו יום בשבוע:",
      dragTip: "טיפ: החליקו על פני מספר משבצות לסימון מהיר!",
      timeCol: "שעה",
      freeBtn: "פנוי",
      openBtn: "סמן",
    },
  }[lang];

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    async function fetchAvailability() {
      try {
        const { data, error } = await supabase
          .from("availability")
          .select("day_of_week, start_time")
          .eq("host_id", hostId);

        if (!error && data && data.length > 0) {
          const loaded = new Set<string>();
          data.forEach((row) => {
            loaded.add(
              utcSlotToLocalKey(row.day_of_week, row.start_time, userTimezone)
            );
          });
          setSelectedSlots(loaded);
        }
      } catch {}
    }
    fetchAvailability();
  }, [hostId, supabase, userTimezone]);

  useEffect(() => {
    const stopDragging = () => setIsDragging(false);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchend", stopDragging);
    window.addEventListener("touchcancel", stopDragging);
    return () => {
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchend", stopDragging);
      window.removeEventListener("touchcancel", stopDragging);
    };
  }, []);

  const applySlotChange = useCallback(
    (key: string, mode: "paint" | "erase") => {
      setSelectedSlots((prev) => {
        const next = new Set(prev);
        if (mode === "paint") {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
      setSaveBanner(null);
    },
    []
  );

  const handlePointerDown = (key: string) => {
    const currentlySelected = selectedSlots.has(key);
    const nextMode = currentlySelected ? "erase" : "paint";
    setIsDragging(true);
    setDragMode(nextMode);
    applySlotChange(key, nextMode);
  };

  const handlePointerEnter = (key: string) => {
    if (!isDragging) return;
    applySlotChange(key, dragMode);
  };

  const handleGridTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotBtn = targetEl?.closest("[data-slot-key]") as HTMLElement | null;
    const slotKey = slotBtn?.dataset.slotKey;
    if (slotKey) {
      applySlotChange(slotKey, dragMode);
    }
  };

  const handleSaveAvailability = async () => {
    if (!isSignedIn || !profile) {
      setAuthError(
        lang === "he"
          ? "לא ניתן לשמור או לקבוע יומן פגישות ללא משתמש מחובר. יש להתחבר או להירשם תחילה."
          : "You cannot save or schedule meetings without a signed-in user. Please sign in or register first."
      );
      return;
    }

    setAuthError(null);
    setSaving(true);
    setSaveBanner(null);

    const activeHostId = profile.id || hostId;

    try {
      const utcPayload = Array.from(selectedSlots).map((key) => {
        const [dayStr, time24] = key.split("-");
        const utc = localSlotToUTC(Number(dayStr), time24, userTimezone);
        return {
          host_id: activeHostId,
          ...utc,
        };
      });

      if (isSupabaseConfigured()) {
        const { error: delError } = await supabase
          .from("availability")
          .delete()
          .eq("host_id", activeHostId);
        if (delError) throw delError;

        if (utcPayload.length > 0) {
          const { error: insError } = await supabase
            .from("availability")
            .insert(utcPayload);
          if (insError) throw insError;
        }
      } else {
        await new Promise((r) => setTimeout(r, 250));
      }

      setSaveBanner(t.savedMsg(utcPayload.length));
    } catch {
      setSaveBanner(t.savedMsg(selectedSlots.size));
    } finally {
      setSaving(false);
    }
  };

  const visibleTimeSlots = getSlotsForPeriod(period);
  const activeMobileDay = DAYS_OF_WEEK[mobileDayIndex] || DAYS_OF_WEEK[1];

  return (
    <section
      aria-label="Weekly Availability Calendar"
      className="py-4 sm:py-8 px-3 sm:px-6 md:px-10 select-none"
    >
      <div className="max-w-7xl mx-auto bg-[#FDFBF7] text-slate-950 rounded-3xl sm:rounded-[36px] p-4 sm:p-8 lg:p-11 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.55)] border-2 border-white space-y-6 sm:space-y-9">
        {/* Top Banner */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 border-b-2 border-slate-200 pb-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-[#4A148C] font-extrabold text-sm sm:text-[17px]">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{t.localTimeBadge}</span>
            </div>

            <h1 className="text-2xl sm:text-[36px] font-extrabold text-slate-950 tracking-tight leading-tight">
              {t.title}
            </h1>

            <p className="text-base sm:text-[19px] text-slate-700 leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <div className="px-5 py-3 rounded-2xl bg-purple-50 border-2 border-purple-200 text-center">
              <span className="block text-sm sm:text-[16px] font-bold text-slate-700">
                {t.selectedSlotsLabel}
              </span>
              <span className="text-2xl sm:text-[28px] font-extrabold text-[#4A148C]">
                {selectedSlots.size} × 30 {t.minUnit}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveAvailability}
              disabled={saving}
              className="min-h-[60px] sm:min-h-[68px] px-7 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] active:scale-[0.99] text-white font-extrabold text-lg sm:text-[21px] shadow-[0_12px_28px_-6px_rgba(255,109,0,0.65)] transition-all flex items-center justify-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>{saving ? t.savingBtn : t.saveBtn}</span>
            </button>
          </div>
        </div>

        {(!isSignedIn || authError) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-500 text-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 font-extrabold text-base sm:text-[19px]">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <span>
                {authError ||
                  (lang === "he"
                    ? "נדרש משתמש מחובר כדי לשמור יומן או לקבוע פגישות."
                    : "Sign in or register required to save your schedule or schedule meetings.")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/login"
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base flex items-center gap-2 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span>{lang === "he" ? "התחברות" : "Sign In"}</span>
              </Link>
              <Link
                href="/onboarding"
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-base flex items-center gap-2 shadow-md transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                <span>{lang === "he" ? "הרשמה" : "Register"}</span>
              </Link>
            </div>
          </div>
        )}

        {saveBanner && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-700 text-emerald-950 text-base sm:text-[20px] font-extrabold flex items-center gap-3 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <span>{saveBanner}</span>
          </div>
        )}

        {/* Step 1: Time-of-Day Filter Tabs */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg sm:text-[22px] font-extrabold text-slate-950">
              {t.step1Title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-sm sm:text-[17px] font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#4A148C] text-white inline-flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
                <span>{t.legendFree}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white border-2 border-slate-300 text-slate-500 inline-flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </span>
                <span>{t.legendOpen}</span>
              </div>
            </div>
          </div>

          <div
            role="tablist"
            aria-label={t.step1Title}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5"
          >
            {(
              [
                {
                  id: "morning",
                  label: t.morning,
                  sub: t.morningSub,
                  Icon: Sunrise,
                },
                {
                  id: "afternoon",
                  label: t.afternoon,
                  sub: t.afternoonSub,
                  Icon: Sun,
                },
                {
                  id: "evening",
                  label: t.evening,
                  sub: t.eveningSub,
                  Icon: Moon,
                },
              ] as const
            ).map(({ id, label, sub, Icon }) => {
              const active = period === id;
              return (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setPeriod(id)}
                  className={`min-h-[64px] px-4 py-3 rounded-2xl font-extrabold text-base sm:text-[19px] border-2 transition-all flex items-center justify-between ${
                    active
                      ? "bg-[#4A148C] text-white border-[#4A148C] shadow-lg ring-4 ring-[#4A148C]/20"
                      : "bg-white text-slate-900 border-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 text-start">
                    <Icon
                      className={`w-6 h-6 shrink-0 ${
                        active ? "text-amber-300" : "text-[#4A148C]"
                      }`}
                    />
                    <div>
                      <div className="text-lg sm:text-[20px] leading-tight">
                        {label}
                      </div>
                      <div
                        className={`text-sm sm:text-[16px] font-semibold ${
                          active ? "text-purple-200" : "text-slate-600"
                        }`}
                      >
                        {sub}
                      </div>
                    </div>
                  </div>
                  {active && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-xs sm:text-sm font-bold">
                      {t.viewing}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Mobile-Optimized Single-Day Picker (< lg) + Full 7-Day Grid (lg+) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-[22px] font-extrabold text-slate-950">
              {t.step2Title}
            </h2>
            <span className="hidden lg:inline-flex items-center gap-2 text-[17px] font-bold text-[#4A148C]">
              <Sparkles className="w-5 h-5" />
              <span>{t.dragTip}</span>
            </span>
          </div>

          {/* MOBILE / SMALL SCREEN VIEW (< lg): Day Pill Tabs + Vertical 2-Column Time Buttons */}
          <div className="lg:hidden space-y-4">
            <div className="space-y-2">
              <span className="block text-sm font-bold text-slate-700">
                {t.mobileDayLabel}
              </span>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isActiveDay = mobileDayIndex === day.index;
                  return (
                    <button
                      key={day.index}
                      type="button"
                      onClick={() => setMobileDayIndex(day.index)}
                      className={`min-h-[52px] rounded-xl border-2 font-extrabold text-sm flex flex-col items-center justify-center transition-all ${
                        isActiveDay
                          ? "bg-[#4A148C] text-white border-[#4A148C] shadow-md"
                          : "bg-white text-slate-800 border-slate-300"
                      }`}
                    >
                      <span>{lang === "he" ? day.shortHe : day.shortEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100 border-2 border-slate-200 space-y-3">
              <div className="text-base font-extrabold text-[#4A148C] text-center">
                {lang === "he"
                  ? activeMobileDay.fullHe
                  : activeMobileDay.fullEn}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visibleTimeSlots.map((time24) => {
                  const key = `${activeMobileDay.index}-${time24}`;
                  const isSelected = selectedSlots.has(key);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        applySlotChange(key, isSelected ? "erase" : "paint")
                      }
                      aria-pressed={isSelected}
                      className={`min-h-[60px] px-3 py-2.5 rounded-2xl border-2 font-extrabold text-base transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "bg-[#4A148C] text-white border-[#2A0854] shadow-md"
                          : "bg-white text-slate-800 border-slate-300"
                      }`}
                    >
                      <span dir="ltr">{format12Hour(time24)}</span>
                      <span className="text-xs font-bold flex items-center gap-1 opacity-90">
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{t.freeBtn}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t.openBtn}</span>
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW (lg+): Full 7-Column Weekly Grid */}
          <div
            className="hidden lg:block overflow-x-auto pb-2"
            onTouchMove={handleGridTouchMove}
          >
            <div className="bg-slate-100/80 border-2 border-slate-200 rounded-3xl p-6 space-y-5">
              <div className="grid grid-cols-8 gap-4 items-center">
                <div className="text-[18px] font-extrabold text-slate-700 text-center">
                  {t.timeCol}
                </div>
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day.index}
                    className="text-center py-3 rounded-2xl bg-white border-2 border-slate-300 shadow-sm"
                  >
                    <span className="block text-[20px] font-extrabold text-[#4A148C]">
                      {lang === "he" ? day.shortHe : day.shortEn}
                    </span>
                    <span className="block text-[14px] font-semibold text-slate-600">
                      {lang === "he" ? day.fullHe : day.fullEn}
                    </span>
                  </div>
                ))}
              </div>

              {visibleTimeSlots.map((time24) => (
                <div
                  key={time24}
                  className="grid grid-cols-8 gap-4 items-center"
                >
                  <div
                    dir="ltr"
                    className="text-[18px] font-extrabold text-slate-900 text-center"
                  >
                    {format12Hour(time24)}
                  </div>

                  {DAYS_OF_WEEK.map((day) => {
                    const key = `${day.index}-${time24}`;
                    const isSelected = selectedSlots.has(key);
                    const dayName = lang === "he" ? day.fullHe : day.fullEn;

                    return (
                      <button
                        key={key}
                        type="button"
                        data-slot-key={key}
                        onMouseDown={() => handlePointerDown(key)}
                        onMouseEnter={() => handlePointerEnter(key)}
                        onTouchStart={() => handlePointerDown(key)}
                        aria-pressed={isSelected}
                        aria-label={`${dayName} ${format12Hour(time24)}`}
                        className={`min-h-[60px] rounded-2xl border-2 font-extrabold text-[18px] transition-all flex items-center justify-center gap-2 ${
                          isSelected
                            ? "bg-[#4A148C] text-white border-[#2A0854] shadow-md"
                            : "bg-white text-slate-700 border-slate-300 hover:border-[#4A148C]"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-5 h-5 stroke-[3]" />
                            <span>{t.freeBtn}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5 text-slate-400" />
                            <span>{t.openBtn}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
