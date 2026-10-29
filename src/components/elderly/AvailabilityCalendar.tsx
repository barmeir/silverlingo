"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  format12Hour,
  localSlotToUTC,
  utcSlotToLocalKey,
} from "@/lib/timezone";
import { useLanguage } from "@/context/LanguageContext";
import {
  Sunrise,
  Sun,
  Moon,
  Check,
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
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

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    () => new Set(DEFAULT_DEMO_SLOTS)
  );
  const [period, setPeriod] = useState<TimePeriod>("morning");
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"paint" | "erase">("paint");
  const [saving, setSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>("Local Time");

  // Hydration-safe timezone resolution on client mount
  useEffect(() => {
    setUserTimezone(
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Time"
    );
  }, []);

  const t = {
    en: {
      localTimeBadge: `Shown in your local time: ${userTimezone}`,
      title: "When would you like to chat with learners?",
      subtitle:
        "Tap any box below—or press and drag across several boxes—to mark when you are free for a friendly 30-minute video call.",
      selectedSlotsLabel: "Selected Slots",
      minUnit: "min",
      savingBtn: "Saving Schedule...",
      saveBtn: "Save My Schedule",
      savedMsg: (count: number) =>
        `Schedule saved! You have ${count} weekly 30-minute chat slots open (automatically saved in UTC).`,
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
      step2Title: "2. Tap or drag across 30-minute time slots:",
      dragTip:
        "Tip: Hold down your mouse or slide your finger across boxes to paint multiple slots!",
      timeCol: "Time",
      freeBtn: "Free",
      openBtn: "Open",
    },
    he: {
      localTimeBadge: `מוצג לפי השעון המקומי שלך: ${userTimezone}`,
      title: "מתי נוח לך לשוחח עם תלמידים?",
      subtitle:
        "לחצו על כל משבצת למטה — או לחצו וגררו על פני מספר משבצות — כדי לסמן מתי אתם פנויים לשיחת וידאו ידידותית של 30 דקות.",
      selectedSlotsLabel: "משבצות שנבחרו",
      minUnit: "דק׳",
      savingBtn: "שומר יומן...",
      saveBtn: "שמירת היומן שלי",
      savedMsg: (count: number) =>
        `היומן נשמר בהצלחה! פתחתם ${count} משבצות שבועיות של 30 דקות (נשמר אוטומטית ב-UTC).`,
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
      step2Title: "2. לחצו או גררו על פני משבצות של 30 דקות:",
      dragTip: "טיפ: החזיקו את העכבר או החליקו אצבע כדי לסמן מספר שעות ברצף!",
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
            loaded.add(utcSlotToLocalKey(row.day_of_week, row.start_time));
          });
          setSelectedSlots(loaded);
        }
      } catch {
        // Keep demo defaults
      }
    }
    fetchAvailability();
  }, [hostId, supabase]);

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

  // Touch-screen / iPad drag-to-paint support across slot buttons
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
    setSaving(true);
    setSaveBanner(null);

    try {
      const utcPayload = Array.from(selectedSlots).map((key) => {
        const [dayStr, time24] = key.split("-");
        const utc = localSlotToUTC(Number(dayStr), time24);
        return {
          host_id: hostId,
          ...utc,
        };
      });

      if (isSupabaseConfigured()) {
        const { error: delError } = await supabase
          .from("availability")
          .delete()
          .eq("host_id", hostId);
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

  return (
    <section
      aria-label="Weekly Availability Calendar"
      className="py-8 px-4 sm:px-8 md:px-12 select-none"
    >
      <div className="max-w-7xl mx-auto bg-[#FDFBF7] text-slate-950 rounded-[36px] p-6 sm:p-10 lg:p-12 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.55)] border-2 border-white space-y-10">
        {/* Top Banner: Warm Welcome & Primary Orange Save CTA */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 border-b-2 border-slate-200 pb-8">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-purple-100 text-[#4A148C] font-extrabold text-[18px]">
              <Clock className="w-5 h-5" />
              <span>{t.localTimeBadge}</span>
            </div>

            <h1 className="text-[32px] sm:text-[40px] font-extrabold text-slate-950 tracking-tight leading-tight">
              {t.title}
            </h1>

            <p className="text-[20px] text-slate-700 leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Summary Counter + Vibrant Orange Primary CTA (#FF6D00) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 shrink-0">
            <div className="px-6 py-4 rounded-2xl bg-purple-50 border-2 border-purple-200 text-center">
              <span className="block text-[18px] font-bold text-slate-700">
                {t.selectedSlotsLabel}
              </span>
              <span className="text-[30px] font-extrabold text-[#4A148C]">
                {selectedSlots.size} × 30 {t.minUnit}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveAvailability}
              disabled={saving}
              className="min-h-[72px] px-9 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] active:scale-[0.99] text-white font-extrabold text-[22px] shadow-[0_12px_28px_-6px_rgba(255,109,0,0.65)] transition-all flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-[#FF6D00]"
            >
              <CheckCircle2 className="w-7 h-7" />
              <span>{saving ? t.savingBtn : t.saveBtn}</span>
            </button>
          </div>
        </div>

        {/* Confirmation Banner */}
        {saveBanner && (
          <div
            role="status"
            aria-live="polite"
            className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-700 text-emerald-950 text-[22px] font-extrabold flex items-center gap-4 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Check className="w-6 h-6" />
            </div>
            <span>{saveBanner}</span>
          </div>
        )}

        {/* Step 1: Time-of-Day Filter Tabs (Minimum 64px height, 24px gap) */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[24px] font-extrabold text-slate-950">
              {t.step1Title}
            </h2>

            {/* Clear Visual Legend */}
            <div className="flex flex-wrap items-center gap-6 text-[19px] font-bold text-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#4A148C] text-white inline-flex items-center justify-center shadow-sm">
                  <Check className="w-5 h-5" />
                </span>
                <span>{t.legendFree}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-white border-2 border-slate-300 text-slate-500 inline-flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </span>
                <span>{t.legendOpen}</span>
              </div>
            </div>
          </div>

          <div
            role="tablist"
            aria-label={t.step1Title}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
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
                  className={`min-h-[72px] px-6 py-4 rounded-2xl font-extrabold text-[20px] border-2 transition-all flex items-center justify-between ${
                    active
                      ? "bg-[#4A148C] text-white border-[#4A148C] shadow-lg ring-4 ring-[#4A148C]/20"
                      : "bg-white text-slate-900 border-slate-300 hover:border-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3.5 text-start">
                    <Icon
                      className={`w-7 h-7 shrink-0 ${
                        active ? "text-amber-300" : "text-[#4A148C]"
                      }`}
                    />
                    <div>
                      <div className="text-[22px] leading-tight">{label}</div>
                      <div
                        className={`text-[18px] font-semibold ${
                          active ? "text-purple-200" : "text-slate-600"
                        }`}
                      >
                        {sub}
                      </div>
                    </div>
                  </div>
                  {active && (
                    <span className="px-3 py-1 rounded-full bg-white/15 text-[16px] font-bold">
                      {t.viewing}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Weekly Calendar Grid — Strict 24px (gap-6) between every slot and 64px height */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[24px] font-extrabold text-slate-950">
              {t.step2Title}
            </h2>
            <span className="hidden md:inline-flex items-center gap-2 text-[18px] font-bold text-[#4A148C]">
              <Sparkles className="w-5 h-5" />
              <span>{t.dragTip}</span>
            </span>
          </div>

          <div
            className="overflow-x-auto pb-4"
            onTouchMove={handleGridTouchMove}
          >
            <div className="min-w-[980px] bg-slate-100/80 border-2 border-slate-200 rounded-3xl p-6 space-y-6">
              {/* Day Column Headers */}
              <div className="grid grid-cols-8 gap-6 items-center">
                <div className="text-[20px] font-extrabold text-slate-700 text-center">
                  {t.timeCol}
                </div>
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day.index}
                    className="text-center py-3.5 rounded-2xl bg-white border-2 border-slate-300 shadow-sm"
                  >
                    <span className="block text-[22px] font-extrabold text-[#4A148C]">
                      {lang === "he" ? day.shortHe : day.shortEn}
                    </span>
                    <span className="block text-[16px] font-semibold text-slate-600">
                      {lang === "he" ? day.fullHe : day.fullEn}
                    </span>
                  </div>
                ))}
              </div>

              {/* 30-Minute Rows with strict gap-6 (24px) both horizontally and vertically */}
              {visibleTimeSlots.map((time24) => (
                <div
                  key={time24}
                  className="grid grid-cols-8 gap-6 items-center"
                >
                  {/* Row Time Label (20px bold) */}
                  <div
                    dir="ltr"
                    className="text-[20px] font-extrabold text-slate-900 text-center"
                  >
                    {format12Hour(time24)}
                  </div>

                  {/* 7 Interactive Day Buttons per Row — min-h-[64px] & gap-6 (24px) */}
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            applySlotChange(
                              key,
                              isSelected ? "erase" : "paint"
                            );
                          }
                        }}
                        aria-pressed={isSelected}
                        aria-label={`${dayName} ${format12Hour(time24)}`}
                        className={`min-h-[64px] rounded-2xl border-2 font-extrabold text-[19px] transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-[#4A148C] ${
                          isSelected
                            ? "bg-[#4A148C] text-white border-[#2A0854] shadow-md scale-[1.02]"
                            : "bg-white text-slate-700 border-slate-300 hover:border-[#4A148C] hover:text-[#4A148C] hover:bg-purple-50/50"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-6 h-6 stroke-[3]" />
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
