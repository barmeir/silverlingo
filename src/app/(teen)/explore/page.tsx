"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HostCard, { HostProfile } from "@/components/teen/HostCard";
import { useLanguage } from "@/context/LanguageContext";
import {
  useUserProfile,
  PREDEFINED_HOBBIES,
} from "@/context/UserProfileContext";
import { withBasePath } from "@/lib/assets";
import {
  nextWallTimeInZoneToUTCISO,
  formatUTCInZone,
  safeTimeZone,
} from "@/lib/timezone";
import {
  Sparkles,
  Globe2,
  Filter,
  UserPlus,
  LogIn,
  Lock,
  Calendar,
  RefreshCw,
  XCircle,
  Video,
  CheckCircle2,
} from "lucide-react";

const DEMO_HOSTS: HostProfile[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    fullName: "Arthur Pendelton",
    fullNameHe: "ארתור פנדלטון",
    email: "arthur.pendelton@silverlingo.org",
    phone: "+12125550191",
    timezone: "America/New_York",
    usState: "New York",
    age: 74,
    country: "United States",
    countryHe: "ארה״ב (ניו יורק)",
    city: "New York, NY",
    cityHe: "ניו יורק",
    formerRole: "Retired High School History Teacher",
    formerRoleHe: "מורה להיסטוריה בגמלאות",
    rating: "4.9",
    callsCompleted: 48,
    bio: "Huge Premier League football fan and lifelong Marvel comic collector. I love hearing about what teenagers around the world are passionate about!",
    bioHe:
      "אוהד מושבע של ליגת האלופות והפרמייר-ליג ואספן קומיקס של מארוול. אני אוהב לשמוע מבני נוער בעולם על התחביבים והחלומות שלהם!",
    avatarUrl: "/avatars/arthur.png",
    hobbies: [
      { name: "Football / Soccer", nameHe: "כדורגל", icon: "⚽" },
      {
        name: "Classic Movies & Marvel",
        nameHe: "קולנוע ומארוול",
        icon: "🎬",
      },
      { name: "World History", nameHe: "היסטוריה עולמית", icon: "🏛️" },
    ],
    sharedHobbies: ["Football / Soccer", "Classic Movies & Marvel"],
    availableSlots: [
      {
        // Scheduled for 10:00 AM in New York (displays as 7:00 AM in California!)
        id: "slot-arthur-ny-10am",
        utcStartISO: nextWallTimeInZoneToUTCISO(
          1,
          10,
          0,
          "America/New_York"
        ),
      },
      {
        id: "slot-arthur-live",
        utcStartISO: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    fullName: "Eleanor Vance",
    fullNameHe: "אלינור ואנס",
    email: "eleanor.vance@silverlingo.org",
    phone: "+447700900077",
    timezone: "Europe/London",
    age: 69,
    country: "United Kingdom",
    countryHe: "בריטניה",
    city: "Bath",
    cityHe: "באת׳",
    formerRole: "Former Bakery Owner & Radio Host",
    formerRoleHe: "בעלת מאפייה ושדרנית רדיו לשעבר",
    rating: "5.0",
    callsCompleted: 63,
    bio: "I spent 30 years baking sourdough and spinning 70s rock vinyl records. Tell me about your favorite music or family recipes!",
    bioHe:
      "ביליתי 30 שנה באפיית לחמי מחמצת ובהאזנה לתקליטי רוק משנות ה-70. ספרו לי על המוזיקה שאתם אוהבים או על מתכונים מהבית!",
    avatarUrl: "/avatars/eleanor.png",
    hobbies: [
      { name: "Baking & Cooking", nameHe: "אפייה ובישול", icon: "🥐" },
      { name: "Music & Vinyl", nameHe: "מוזיקה ותקליטים", icon: "🎸" },
      { name: "Gardening", nameHe: "גינון", icon: "🌻" },
    ],
    sharedHobbies: ["Music & Vinyl"],
    availableSlots: [
      {
        id: "slot-eleanor-1",
        utcStartISO: nextWallTimeInZoneToUTCISO(1, 15, 0, "Europe/London"),
      },
      {
        id: "slot-eleanor-2",
        utcStartISO: nextWallTimeInZoneToUTCISO(2, 17, 0, "Europe/London"),
      },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    fullName: "Walter Miller",
    fullNameHe: "וולטר מילר",
    email: "walter.miller@silverlingo.org",
    phone: "+13105550188",
    timezone: "America/Los_Angeles",
    usState: "California",
    age: 78,
    country: "United States",
    countryHe: "ארה״ב (קליפורניה)",
    city: "San Diego, CA",
    cityHe: "סן דייגו, קליפורניה",
    formerRole: "Retired Airline Captain",
    formerRoleHe: "קברניט תעופה בגמלאות",
    rating: "4.9",
    callsCompleted: 39,
    bio: "Flew commercial jets to 60 countries. Always up for a friendly game of chess, aviation stories, or chatting about football!",
    bioHe:
      "הטסתי מטוסי נוסעים ל-60 מדינות בעולם. תמיד שמח למשחק שחמט ידידותי, סיפורי תעופה או שיחה טובה על כדורגל!",
    avatarUrl: "/avatars/walter.png",
    hobbies: [
      {
        name: "Board Games & Chess",
        nameHe: "שחמט ומשחקי קופסה",
        icon: "♟️",
      },
      { name: "Travel Stories", nameHe: "סיפורי טיולים", icon: "✈️" },
      { name: "Football / Soccer", nameHe: "כדורגל", icon: "⚽" },
    ],
    sharedHobbies: ["Football / Soccer"],
    availableSlots: [
      {
        id: "slot-walter-1",
        utcStartISO: nextWallTimeInZoneToUTCISO(
          1,
          10,
          0,
          "America/Los_Angeles"
        ),
      },
      {
        id: "slot-walter-2",
        utcStartISO: nextWallTimeInZoneToUTCISO(
          2,
          14,
          0,
          "America/Los_Angeles"
        ),
      },
    ],
  },
];

const QUICK_TIMEZONE_TEST_OPTIONS = [
  {
    labelEn: "California (America/Los_Angeles - PT)",
    labelHe: "קליפורניה (America/Los_Angeles - PT)",
    tz: "America/Los_Angeles",
  },
  {
    labelEn: "New York / Florida (America/New_York - ET)",
    labelHe: "ניו יורק / פלורידה (America/New_York - ET)",
    tz: "America/New_York",
  },
  {
    labelEn: "Texas / Illinois (America/Chicago - CT)",
    labelHe: "טקסס / אילינוי (America/Chicago - CT)",
    tz: "America/Chicago",
  },
  {
    labelEn: "Colorado (America/Denver - MT)",
    labelHe: "קולורדו (America/Denver - MT)",
    tz: "America/Denver",
  },
  {
    labelEn: "Israel (Asia/Jerusalem - IST)",
    labelHe: "ישראל (Asia/Jerusalem - IST)",
    tz: "Asia/Jerusalem",
  },
  {
    labelEn: "United Kingdom (Europe/London - GMT/BST)",
    labelHe: "בריטניה (Europe/London - GMT/BST)",
    tz: "Europe/London",
  },
];

export default function TeenExplorePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const {
    profile,
    customHosts,
    meetings,
    rescheduleMeeting,
    cancelMeeting,
  } = useUserProfile();
  const [selectedHobbyFilter, setSelectedHobbyFilter] = useState<string>("All");
  const [viewerTimezone, setViewerTimezone] = useState<string>(
    "America/Los_Angeles"
  );
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.timezone) {
      setViewerTimezone(safeTimeZone(profile.timezone));
    } else {
      setViewerTimezone(
        safeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      );
    }
  }, [profile?.timezone]);

  const isSignedIn = Boolean(
    profile &&
      profile.id &&
      profile.fullName?.trim() &&
      (profile.email?.trim() || profile.phone?.trim() || profile.contact?.trim())
  );

  const learnerName = isSignedIn
    ? profile!.fullName
    : lang === "he"
    ? "אורח/ת"
    : "Guest";
  const learnerAvatar =
    isSignedIn && profile?.avatarUrl
      ? profile.avatarUrl
      : "/avatars/mateo.png";
  const learnerHobbies =
    profile && profile.hobbies.length > 0
      ? profile.hobbies
      : ["Football / Soccer", "Classic Movies & Marvel", "Music & Vinyl"];

  const mappedCustomHosts: HostProfile[] = customHosts.map((ch) => ({
    id: ch.id,
    fullName: ch.fullName,
    email: ch.email || (ch.contact?.includes("@") ? ch.contact : undefined),
    phone:
      ch.phone ||
      (ch.contact && !ch.contact.includes("@") ? ch.contact : undefined),
    timezone: ch.timezone || "America/New_York",
    usState: ch.usState,
    age: ch.age,
    country: ch.country,
    city: ch.city,
    formerRole: ch.formerRole,
    rating: "5.0",
    callsCompleted: 1,
    bio: ch.bio,
    avatarUrl: ch.avatarUrl,
    hobbies: ch.hobbies.map((hName) => {
      const found = PREDEFINED_HOBBIES.find((p) => p.name === hName);
      return {
        name: hName,
        nameHe: found?.nameHe || hName,
        icon: found?.icon || "✨",
      };
    }),
    sharedHobbies: ch.hobbies.filter((h) => learnerHobbies.includes(h)),
    availableSlots: [
      {
        id: `slot-${ch.id}-10am`,
        utcStartISO: nextWallTimeInZoneToUTCISO(
          1,
          10,
          0,
          ch.timezone || "America/New_York"
        ),
      },
      {
        id: `slot-${ch.id}-live`,
        utcStartISO: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
      },
    ],
  }));

  const allHosts: HostProfile[] = [...mappedCustomHosts, ...DEMO_HOSTS].map(
    (h) => ({
      ...h,
      sharedHobbies: h.hobbies
        .map((hb) => hb.name)
        .filter((name) => learnerHobbies.includes(name)),
    })
  );

  const filteredHosts =
    selectedHobbyFilter === "All"
      ? allHosts
      : allHosts.filter((h) =>
          h.hobbies.some((hb) => hb.name === selectedHobbyFilter)
        );

  const handleBooked = (bookingData: {
    meetingId: string;
    hostId: string;
    hostName: string;
    hostEmail: string;
    hostPhone: string;
    hostTimezone: string;
    hostAvatar: string;
    learnerId: string;
    learnerName: string;
    learnerEmail: string;
    learnerPhone: string;
    learnerTimezone: string;
    scheduledStartUTC: string;
    googleMeetLink: string;
    aiIcebreaker: string;
  }) => {
    const query = new URLSearchParams({
      meetingId: bookingData.meetingId,
      host: bookingData.hostName,
      hostEmail: bookingData.hostEmail,
      hostPhone: bookingData.hostPhone,
      hostTz: bookingData.hostTimezone,
      ...(bookingData.hostAvatar.startsWith("data:")
        ? {}
        : { hostAvatar: bookingData.hostAvatar }),
      learner: bookingData.learnerName,
      learnerEmail: bookingData.learnerEmail,
      learnerPhone: bookingData.learnerPhone,
      learnerTz: bookingData.learnerTimezone,
      start: bookingData.scheduledStartUTC,
      meet: bookingData.googleMeetLink,
      icebreaker: bookingData.aiIcebreaker,
    });
    router.push(`/room/demo-session?${query.toString()}`);
  };

  const handleReschedule = async (meetingId: string, currentStart: string) => {
    // Move meeting 1 hour later and automatically notify both participants
    const nextStart = new Date(
      new Date(currentStart).getTime() + 60 * 60 * 1000
    ).toISOString();
    const updated = await rescheduleMeeting(meetingId, nextStart);
    if (updated) {
      const formatted = formatUTCInZone(
        updated.scheduledStartUTC,
        viewerTimezone,
        lang
      );
      setStatusFeedback(
        lang === "he"
          ? `הפגישה נדחתה לשעה ${formatted.timeWithTz} (${formatted.dateLabel}). הודעות SMS ואימייל מעודכנות נשלחו לשני המשתתפים!`
          : `Meeting rescheduled to ${formatted.timeWithTz} (${formatted.dateLabel}). Updated SMS & Email notifications sent to both participants!`
      );
    }
  };

  const handleCancel = async (meetingId: string) => {
    const canceled = await cancelMeeting(meetingId);
    if (canceled) {
      setStatusFeedback(
        lang === "he"
          ? "הפגישה בוטלה. הודעות ביטול ב-SMS ובאימייל נשלחו אוטומטית לשני המשתתפים!"
          : "Meeting canceled. Cancellation SMS & Email notifications have been automatically sent to both participants!"
      );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Gamified Hero Banner with Learner Portrait & Timezone Selector */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#4A148C] via-[#340C66] to-[#190B2E] border border-purple-400/30 p-4 sm:p-7 md:p-9 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 max-w-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden border-2 border-[#FF6D00] shadow-xl shrink-0 bg-purple-950">
              <img
                src={withBasePath(learnerAvatar)}
                alt={learnerName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-100 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6D00]" />
                  <span>
                    {lang === "he"
                      ? "התאמת תחביבים ב-AI • +50 XP"
                      : "AI Hobby Matcher • +50 XP"}
                  </span>
                </div>

                {!isSignedIn && (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:bg-white/25 bg-white/15 border border-white/30 px-3 py-1 rounded-full transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#FF6D00]" />
                    <span>{lang === "he" ? "התחברות" : "Sign In"}</span>
                  </Link>
                )}

                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-300 hover:text-white bg-orange-500/15 border border-orange-400/30 px-3 py-1 rounded-full transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>
                    {isSignedIn
                      ? lang === "he"
                        ? "עריכת פרופיל ומיקום"
                        : "Edit Profile & Location"
                      : lang === "he"
                      ? "הרשמת משתמש (חובה לקביעת פגישה)"
                      : "Register to Schedule"}
                  </span>
                </Link>
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                {isSignedIn
                  ? lang === "he"
                    ? `היי ${learnerName}! מוכנ/ה לתרגל אנגלית היום?`
                    : `Hey ${learnerName}! Ready to practice English today?`
                  : lang === "he"
                  ? "שלום אורח/ת! התחבר/י כדי לקבוע שיחה באנגלית"
                  : "Welcome! Sign in or register to schedule an English call"}
              </h1>

              {!isSignedIn && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-[#FF6D00] shrink-0" />
                  <span>
                    {lang === "he"
                      ? "ניתן לצפות במארחים כעת, אך קביעת פגישה זמינה רק למשתמשים מחוברים."
                      : "You can browse hosts below, but scheduling a meeting requires a signed-in user."}
                  </span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
                {lang === "he"
                  ? `התחביבים שלך: ${learnerHobbies.join(", ")}`
                  : `Your hobbies: ${learnerHobbies.join(", ")}`}
              </p>
            </div>
          </div>

          {/* Local Timezone Switcher & Verification Box */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/15 rounded-2xl p-4 text-xs text-slate-200 space-y-2.5 w-full lg:max-w-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-purple-200 font-bold">
                <Globe2 className="w-4 h-4 text-[#FF6D00] shrink-0" />
                <span>
                  {lang === "he"
                    ? "אזור הזמן שלך (המרה אוטומטית):"
                    : "Your Active Time Zone:"}
                </span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                DST Auto
              </span>
            </div>

            <select
              aria-label="Active Time Zone"
              dir="ltr"
              value={viewerTimezone}
              onChange={(e) => setViewerTimezone(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-xl bg-slate-900 border border-purple-400/40 text-white font-bold text-xs focus:outline-none focus:border-[#FF6D00]"
            >
              {!QUICK_TIMEZONE_TEST_OPTIONS.some(
                (o) => o.tz === viewerTimezone
              ) && <option value={viewerTimezone}>{viewerTimezone}</option>}
              {QUICK_TIMEZONE_TEST_OPTIONS.map((opt) => (
                <option key={opt.tz} value={opt.tz}>
                  {lang === "he" ? opt.labelHe : opt.labelEn}
                </option>
              ))}
            </select>

            <p className="text-[11px] text-purple-200/80 leading-snug">
              {lang === "he"
                ? "דוגמה: שיחה ב-10:00 בניו יורק מוצגת אוטומטית כ-7:00 בקליפורניה!"
                : "Example: Arthur's 10:00 AM New York slot automatically displays as 7:00 AM when viewing from California!"}
            </p>
          </div>
        </div>
      </section>

      {/* Scheduled Meetings Management Panel (Reschedule / Cancel with Auto SMS & Email) */}
      {meetings.length > 0 && (
        <section className="rounded-3xl bg-[#160E29] border border-purple-400/30 p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#FF6D00]" />
              <span>
                {lang === "he"
                  ? "הפגישות שלי (שינוי שעה או ביטול שולח SMS + אימייל אוטומטית)"
                  : "My Scheduled Meetings (Change or Cancel Auto-Sends SMS + Email)"}
              </span>
            </h2>
          </div>

          {statusFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{statusFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.slice(0, 4).map((m) => {
              const myZoned = formatUTCInZone(
                m.scheduledStartUTC,
                viewerTimezone,
                lang
              );
              const hostZoned = formatUTCInZone(
                m.scheduledStartUTC,
                m.hostTimezone || "America/New_York",
                lang
              );

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    m.status === "cancelled"
                      ? "bg-red-950/20 border-red-500/30 opacity-75"
                      : "bg-white/[0.04] border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold text-white text-sm sm:text-base">
                      {m.learnerName} & {m.hostName}
                    </div>
                    <span
                      className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        m.status === "cancelled"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1" dir="ltr">
                    <div>
                      <strong className="text-purple-200">
                        Your Time ({viewerTimezone}):
                      </strong>{" "}
                      {myZoned.dateLabel} at{" "}
                      <span className="text-amber-300 font-extrabold">
                        {myZoned.timeWithTz}
                      </span>
                    </div>
                    <div>
                      <strong className="text-slate-400">
                        Host Time ({m.hostTimezone}):
                      </strong>{" "}
                      {hostZoned.dateLabel} at {hostZoned.timeWithTz}
                    </div>
                  </div>

                  {m.status === "scheduled" && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Link
                        href={`/room/demo-session?meetingId=${encodeURIComponent(
                          m.id
                        )}&host=${encodeURIComponent(
                          m.hostName
                        )}&hostEmail=${encodeURIComponent(
                          m.hostEmail
                        )}&hostPhone=${encodeURIComponent(
                          m.hostPhone
                        )}&hostTz=${encodeURIComponent(
                          m.hostTimezone
                        )}&learner=${encodeURIComponent(
                          m.learnerName
                        )}&learnerEmail=${encodeURIComponent(
                          m.learnerEmail
                        )}&learnerPhone=${encodeURIComponent(
                          m.learnerPhone
                        )}&learnerTz=${encodeURIComponent(
                          viewerTimezone
                        )}&start=${encodeURIComponent(
                          m.scheduledStartUTC
                        )}&meet=${encodeURIComponent(
                          m.googleMeetLink
                        )}&icebreaker=${encodeURIComponent(m.aiIcebreaker)}`}
                        className="px-3 py-2 rounded-xl bg-[#FF6D00] hover:bg-[#E65100] text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>
                          {lang === "he" ? "חדר המתנה" : "Waiting Room"}
                        </span>
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleReschedule(m.id, m.scheduledStartUTC)
                        }
                        className="px-3 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-400/40 text-purple-100 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>
                          {lang === "he"
                            ? "שנה שעה (+1 שעה)"
                            : "Change Time (+1h)"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancel(m.id)}
                        className="px-3 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-400/40 text-red-200 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>
                          {lang === "he" ? "ביטול פגישה" : "Cancel Meeting"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Hobby Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 me-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-purple-400" />
          <span>{lang === "he" ? "סינון:" : "Filter:"}</span>
        </span>
        {[
          { id: "All", en: "All", he: "הכל" },
          ...PREDEFINED_HOBBIES.map((hb) => ({
            id: hb.name,
            en: `${hb.icon} ${hb.name}`,
            he: `${hb.icon} ${hb.nameHe}`,
          })),
        ].map((item) => {
          const active = selectedHobbyFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedHobbyFilter(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? "bg-[#4A148C] text-white border border-purple-400 shadow-md"
                  : "bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08]"
              }`}
            >
              {lang === "he" ? item.he : item.en}
            </button>
          );
        })}
      </div>

      {/* Host Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredHosts.map((host) => (
          <HostCard
            key={host.id}
            host={host}
            learnerName={learnerName}
            learnerTimezone={viewerTimezone}
            learnerHobbies={learnerHobbies}
            onBooked={handleBooked}
          />
        ))}
      </div>
    </div>
  );
}
