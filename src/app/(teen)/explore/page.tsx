"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import HostCard, { HostProfile } from "@/components/teen/HostCard";
import { useLanguage } from "@/context/LanguageContext";
import { withBasePath } from "@/lib/assets";
import { Globe2, Sparkles, Flame, Compass } from "lucide-react";

const DEMO_HOSTS: HostProfile[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    fullName: "Arthur Pendelton",
    fullNameHe: "ארתור פנדלטון",
    age: 74,
    country: "United Kingdom",
    countryHe: "בריטניה",
    city: "Manchester",
    cityHe: "מנצ׳סטר",
    formerRole: "Retired High School History Teacher",
    formerRoleHe: "מורה להיסטוריה בתיכון (בגמלאות)",
    rating: "5.0",
    callsCompleted: 84,
    bio: "Lifelong football supporter and Marvel movie fan! I love hearing what teenagers around the world are passionate about and helping you sound natural in English.",
    bioHe:
      "אוהד כדורגל מושבע וחובב סרטי מארוול! אני אוהב לשמוע מבני נוער מכל העולם על התחביבים שלהם ולעזור לכם לדבר אנגלית בביטחון ובטבעיות.",
    avatarUrl: "/avatars/arthur.png",
    hobbies: [
      { name: "Football", nameHe: "כדורגל", icon: "⚽" },
      { name: "Classic Movies & Marvel", nameHe: "קולנוע ומארוול", icon: "🎬" },
      { name: "World History", nameHe: "היסטוריה עולמית", icon: "🏛️" },
    ],
    sharedHobbies: ["Football", "Classic Movies & Marvel"],
    availableSlots: [
      {
        id: "slot-arthur-1",
        utcStartISO: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
      },
      {
        id: "slot-arthur-2",
        utcStartISO: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    fullName: "Eleanor Vance",
    fullNameHe: "אלינור ואנס",
    age: 69,
    country: "Canada",
    countryHe: "קנדה",
    city: "Vancouver",
    cityHe: "ונקובר",
    formerRole: "Former Artisan Bakery Owner",
    formerRoleHe: "בעלת מאפייה בוטיק לשעבר",
    rating: "4.9",
    callsCompleted: 62,
    bio: "I spent 35 years running a neighborhood bakery. I love trading recipes, chatting about classic rock & vinyl records, and cheering on young English learners.",
    bioHe:
      "ניהלתי מאפייה שכונתית במשך 35 שנה. אני אוהבת להחליף מתכונים, לדבר על מוזיקה ותקליטים, ולעודד צעירים לתרגל אנגלית בכיף.",
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
        utcStartISO: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
      },
      {
        id: "slot-eleanor-2",
        utcStartISO: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    fullName: "Walter Miller",
    fullNameHe: "וולטר מילר",
    age: 78,
    country: "United States",
    countryHe: "ארצות הברית",
    city: "Denver, CO",
    cityHe: "דנבר, קולורדו",
    formerRole: "Retired National Park Ranger",
    formerRoleHe: "פקח פארקים לאומיים (בגמלאות)",
    rating: "5.0",
    callsCompleted: 119,
    bio: "Spent four decades in the Rocky Mountains. Chess enthusiast and storyteller who enjoys learning about your country, sports, and favorite games.",
    bioHe:
      "עבדתי 40 שנה בהרי הרוקי. חובב שחמט וסיפורי מסעות, ונהנה מאוד להכיר צעירים מכל העולם ולשמוע על המדינה והתחביבים שלכם.",
    avatarUrl: "/avatars/walter.png",
    hobbies: [
      { name: "Board Games & Chess", nameHe: "שחמט ומשחקי קופסה", icon: "♟️" },
      { name: "Travel Stories", nameHe: "סיפורי טיולים", icon: "✈️" },
      { name: "Football", nameHe: "כדורגל", icon: "⚽" },
    ],
    sharedHobbies: ["Football", "Board Games & Chess"],
    availableSlots: [
      {
        id: "slot-walter-1",
        utcStartISO: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
      {
        id: "slot-walter-2",
        utcStartISO: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

const HOBBY_FILTERS = [
  { id: "All", en: "All", he: "הכל" },
  { id: "Football", en: "Football", he: "כדורגל" },
  {
    id: "Classic Movies & Marvel",
    en: "Classic Movies & Marvel",
    he: "קולנוע ומארוול",
  },
  { id: "Music & Vinyl", en: "Music & Vinyl", he: "מוזיקה ותקליטים" },
  { id: "Baking & Cooking", en: "Baking & Cooking", he: "אפייה ובישול" },
  {
    id: "Board Games & Chess",
    en: "Board Games & Chess",
    he: "שחמט ומשחקי קופסה",
  },
];

export default function TeenExplorePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [selectedHobbyFilter, setSelectedHobbyFilter] = useState<string>("All");
  const [localTimezone, setLocalTimezone] = useState<string>("UTC");

  React.useEffect(() => {
    setLocalTimezone(
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    );
  }, []);

  const learnerName = "Mateo";
  const learnerHobbies = [
    "Football",
    "Classic Movies & Marvel",
    "Music & Vinyl",
  ];

  const filteredHosts =
    selectedHobbyFilter === "All"
      ? DEMO_HOSTS
      : DEMO_HOSTS.filter((h) =>
          h.hobbies.some((hb) => hb.name === selectedHobbyFilter)
        );

  const handleBooked = (bookingData: {
    meetingId: string;
    hostName: string;
    hostAvatar: string;
    learnerName: string;
    scheduledStartUTC: string;
    googleMeetLink: string;
    aiIcebreaker: string;
  }) => {
    const query = new URLSearchParams({
      host: bookingData.hostName,
      hostAvatar: bookingData.hostAvatar,
      learner: bookingData.learnerName,
      start: bookingData.scheduledStartUTC,
      meet: bookingData.googleMeetLink,
      icebreaker: bookingData.aiIcebreaker,
    });
    router.push(`/room/demo-session?${query.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Gamified Hero Banner with Learner Portrait */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#4A148C] via-[#340C66] to-[#190B2E] border border-purple-400/30 p-7 md:p-9 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 max-w-2xl">
            <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-[#FF6D00] shadow-xl shrink-0 bg-purple-950">
              <img
                src={withBasePath("/avatars/mateo.png")}
                alt="Mateo"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-100 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6D00]" />
                <span>
                  {lang === "he"
                    ? "התאמת תחביבים ב-AI • +50 XP לכל שיחה"
                    : "AI Hobby Matcher • +50 XP per 30-Min Call"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {lang === "he"
                  ? "היי מתיאו! מוכן לתרגל אנגלית היום?"
                  : `Hey ${learnerName}! Ready to practice English today?`}
              </h1>

              <p className="text-sm sm:text-[15px] text-purple-100/90 leading-relaxed">
                {lang === "he" ? (
                  <>
                    מצאנו עבורך מארחים דוברי אנגלית שפת אם שחולקים איתך אהבה ל
                    <span className="text-white font-semibold underline decoration-[#FF6D00] mx-1">
                      כדורגל
                    </span>
                    ,
                    <span className="text-white font-semibold underline decoration-[#FF6D00] mx-1">
                      סרטי מארוול
                    </span>
                    ו
                    <span className="text-white font-semibold underline decoration-[#FF6D00] mx-1">
                      מוזיקה
                    </span>
                    .
                  </>
                ) : (
                  <>
                    We matched you with native-speaking Hosts who share your
                    love for{" "}
                    <span className="text-white font-semibold underline decoration-[#FF6D00]">
                      Football
                    </span>
                    ,{" "}
                    <span className="text-white font-semibold underline decoration-[#FF6D00]">
                      Marvel Movies
                    </span>
                    , and{" "}
                    <span className="text-white font-semibold underline decoration-[#FF6D00]">
                      Music
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Local Timezone + Streak Status Card */}
          <div className="bg-black/35 backdrop-blur-xl border border-white/15 rounded-2xl p-5 text-xs text-slate-300 shrink-0 space-y-3 min-w-[240px]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-purple-200 font-bold">
                <Globe2 className="w-4 h-4 text-[#FF6D00]" />
                <span>{lang === "he" ? "אזור הזמן שלך" : "Your Timezone"}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold text-[11px]">
                {lang === "he" ? "מסונכרן אוטומטית" : "Auto-Synced"}
              </span>
            </div>
            <p dir="ltr" className="text-base font-extrabold text-white">
              {localTimezone}
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-orange-300 font-semibold">
              <Flame className="w-4 h-4 text-[#FF6D00] fill-[#FF6D00] shrink-0" />
              <span>
                {lang === "he"
                  ? "קבע עוד שיחה אחת כדי להגיע לרצף של 13 ימים!"
                  : "Book 1 more call to hit a 13-day streak!"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Hobby Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 me-2 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-purple-400" />
            <span>
              {lang === "he"
                ? "סינון לפי תחביב משותף:"
                : "Filter by Shared Hobby:"}
            </span>
          </span>
          {HOBBY_FILTERS.map((hobby) => {
            const active = selectedHobbyFilter === hobby.id;
            return (
              <button
                key={hobby.id}
                type="button"
                onClick={() => setSelectedHobbyFilter(hobby.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  active
                    ? "bg-[#4A148C] text-white border-purple-400 shadow-[0_0_16px_rgba(74,20,140,0.6)]"
                    : "bg-white/[0.03] text-slate-300 border-white/10 hover:border-white/25 hover:bg-white/[0.06]"
                }`}
              >
                {lang === "he" ? hobby.he : hobby.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Host Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHosts.map((host) => (
          <HostCard
            key={host.id}
            host={host}
            learnerName={learnerName}
            learnerHobbies={learnerHobbies}
            onBooked={handleBooked}
          />
        ))}
      </section>
    </div>
  );
}
