"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { withBasePath } from "@/lib/assets";
import {
  resolveParticipantsFromDB,
  logNotificationsToSupabase,
} from "@/lib/notifications";
import {
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Star,
  MessageCircleHeart,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export interface HostSlot {
  id: string;
  utcStartISO: string; // Stored/transmitted in UTC
}

export interface HostProfile {
  id: string;
  fullName: string;
  fullNameHe?: string;
  email?: string;
  phone?: string;
  age: number;
  country: string;
  countryHe?: string;
  city: string;
  cityHe?: string;
  formerRole: string;
  formerRoleHe?: string;
  rating: string;
  callsCompleted: number;
  bio: string;
  bioHe?: string;
  avatarUrl: string;
  hobbies: { name: string; nameHe?: string; icon: string }[];
  sharedHobbies: string[];
  availableSlots: HostSlot[];
}

interface HostCardProps {
  host: HostProfile;
  learnerName: string;
  learnerHobbies: string[];
  onBooked: (bookingData: {
    meetingId: string;
    hostName: string;
    hostEmail: string;
    hostPhone: string;
    hostAvatar: string;
    learnerName: string;
    learnerEmail: string;
    learnerPhone: string;
    scheduledStartUTC: string;
    googleMeetLink: string;
    aiIcebreaker: string;
  }) => void;
}

function formatSlotInLocalTimezone(
  utcISO: string,
  lang: "en" | "he"
): {
  dayLabel: string;
  timeLabel: string;
  isStartingSoon: boolean;
} {
  const date = new Date(utcISO);
  const diffMins = (date.getTime() - Date.now()) / 60000;
  const locale = lang === "he" ? "he-IL" : undefined;

  const dayLabel =
    diffMins <= 30 && diffMins >= -5
      ? lang === "he"
        ? "היום • הדגמה חיה"
        : "Today • Live Demo"
      : new Intl.DateTimeFormat(locale, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(date);

  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return { dayLabel, timeLabel, isStartingSoon: diffMins <= 15 };
}

export default function HostCard({
  host,
  learnerName,
  learnerHobbies,
  onBooked,
}: HostCardProps) {
  const { lang, isRTL } = useLanguage();
  const { profile } = useUserProfile();
  const DirectionalArrow = isRTL ? ArrowLeft : ArrowRight;

  const [selectedSlot, setSelectedSlot] = useState<HostSlot | null>(
    host.availableSlots[0] || null
  );
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sharedHobbyObj =
    host.hobbies.find((h) => host.sharedHobbies.includes(h.name)) ||
    host.hobbies[0];

  const displayName =
    lang === "he" && host.fullNameHe ? host.fullNameHe : host.fullName;
  const firstName = displayName.split(" ")[0];
  const displayRole =
    lang === "he" && host.formerRoleHe ? host.formerRoleHe : host.formerRole;
  const displayCity =
    lang === "he" && host.cityHe ? host.cityHe : host.city;
  const displayCountry =
    lang === "he" && host.countryHe ? host.countryHe : host.country;
  const displayBio = lang === "he" && host.bioHe ? host.bioHe : host.bio;
  const sharedHobbyLabel =
    lang === "he" && sharedHobbyObj?.nameHe
      ? sharedHobbyObj.nameHe
      : sharedHobbyObj?.name || "Stories";

  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    setError(null);

    try {
      let meetingId = "demo-session";
      let scheduledStart = selectedSlot.utcStartISO;
      let googleMeetLink = "https://meet.google.com/slv-demo-room";
      const sharedHobby =
        host.sharedHobbies[0] || host.hobbies[0]?.name || "favorite hobbies";
      let aiIcebreaker = `${learnerName}, ask ${
        host.fullName.split(" ")[0]
      } what first sparked their love for ${sharedHobby}!`;

      // Resolve email & phone for both accounts from Supabase DB table (public.users) + profile
      const participants = await resolveParticipantsFromDB({
        hostId: host.id,
        hostName: host.fullName,
        hostEmail:
          host.email ||
          `${host.fullName.toLowerCase().replace(/\s+/g, ".")}@silverlingo.org`,
        hostPhone: host.phone || "+1-800-555-0191",
        learnerId: profile?.id || "00000000-0000-0000-0000-000000000002",
        learnerName,
        learnerEmail:
          profile?.email ||
          (profile?.contact?.includes("@")
            ? profile.contact
            : "learner@silverlingo.org"),
        learnerPhone:
          profile?.phone ||
          (profile?.contact && !profile.contact.includes("@")
            ? profile.contact
            : "+972-50-123-4567"),
      });

      let hostEmail = participants.host.email;
      let hostPhone = participants.host.phone;
      let learnerEmail = participants.learner.email;
      let learnerPhone = participants.learner.phone;

      try {
        const response = await fetch(withBasePath("/api/meetings/book"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostId: host.id,
            hostName: host.fullName,
            hostEmail,
            hostPhone,
            hostHobbies: host.hobbies.map((h) => h.name),
            learnerId: participants.learner.id,
            learnerName,
            learnerEmail,
            learnerPhone,
            learnerHobbies,
            scheduledStartUTC: selectedSlot.utcStartISO,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          meetingId = data.meeting.id;
          scheduledStart = data.meeting.scheduled_start;
          googleMeetLink = data.meeting.google_meet_link;
          aiIcebreaker = data.meeting.ai_icebreaker;
          if (data.hostEmail) hostEmail = data.hostEmail;
          if (data.hostPhone) hostPhone = data.hostPhone;
          if (data.learnerEmail) learnerEmail = data.learnerEmail;
          if (data.learnerPhone) learnerPhone = data.learnerPhone;
        }
      } catch {
        // Static deployment fallback
        await new Promise((r) => setTimeout(r, 350));
      }

      // Log SMS & Email notifications for BOTH accounts into Supabase public.meeting_notifications
      await logNotificationsToSupabase({
        meetingId,
        host: {
          ...participants.host,
          email: hostEmail,
          phone: hostPhone,
        },
        learner: {
          ...participants.learner,
          email: learnerEmail,
          phone: learnerPhone,
        },
        scheduledStartUTC: scheduledStart,
        googleMeetLink,
        aiIcebreaker,
      });

      onBooked({
        meetingId,
        hostName: host.fullName,
        hostEmail,
        hostPhone,
        hostAvatar: host.avatarUrl,
        learnerName,
        learnerEmail,
        learnerPhone,
        scheduledStartUTC: scheduledStart,
        googleMeetLink,
        aiIcebreaker,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group relative bg-gradient-to-b from-[#19102C] to-[#110B20] border border-white/10 hover:border-purple-400/50 rounded-3xl p-6 flex flex-col justify-between shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] transition-all"
    >
      <div>
        {/* Top Row: AI Hobby Match Tag + Rating */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#4A148C] to-purple-800 border border-purple-400/40 text-purple-100 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6D00] shrink-0" />
            <span>
              {lang === "he"
                ? `גם ${firstName} אוהב/ת ${sharedHobbyLabel}!`
                : `${firstName} also likes ${sharedHobbyLabel}!`}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{host.rating}</span>
          </div>
        </div>

        {/* Host Photographic Portrait & Identity */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-purple-400/40 shadow-lg bg-[#4A148C]">
            <img
              src={withBasePath(host.avatarUrl)}
              alt={displayName}
              className="w-full h-full object-cover"
            />
            <span
              title="Online & Available"
              className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#19102C]"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-white truncate">
              {displayName},{" "}
              <span className="text-purple-300 font-semibold">{host.age}</span>
            </h2>
            <p className="text-xs text-purple-200/90 font-medium mt-0.5">
              {displayRole}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">
                {displayCity}, {displayCountry}
              </span>
            </p>
          </div>
        </div>

        {/* Bio */}
        <p className="text-[14px] text-slate-300 mt-4 leading-relaxed line-clamp-3">
          “{displayBio}”
        </p>

        {/* Hobby Pills */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {host.hobbies.map((hobby) => {
            const isShared = host.sharedHobbies.includes(hobby.name);
            const label =
              lang === "he" && hobby.nameHe ? hobby.nameHe : hobby.name;
            return (
              <span
                key={hobby.name}
                className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-colors ${
                  isShared
                    ? "bg-[#4A148C]/50 border-purple-400/50 text-purple-100 font-semibold"
                    : "bg-white/[0.03] border-white/10 text-slate-300"
                }`}
              >
                <span>{hobby.icon}</span>
                <span>{label}</span>
              </span>
            );
          })}
        </div>

        {/* Local Timezone 30-Min Slot Picker */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Clock className="w-3.5 h-3.5 text-[#FF6D00]" />
              <span>
                {lang === "he"
                  ? "בחרו שעה ל-30 דק׳ (לפי השעון שלכם)"
                  : "Pick a 30-min slot (Your Local Time)"}
              </span>
            </span>
            <span className="text-[11px] text-purple-300 font-medium">
              {lang === "he"
                ? `${host.callsCompleted} שיחות`
                : `${host.callsCompleted} chats hosted`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {host.availableSlots.map((slot) => {
              const { dayLabel, timeLabel, isStartingSoon } =
                formatSlotInLocalTimezone(slot.utcStartISO, lang);
              const isSelected = selectedSlot?.id === slot.id;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-3.5 py-2.5 rounded-xl text-start text-xs border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-[#4A148C] border-purple-300 text-white font-semibold shadow-[0_0_20px_rgba(74,20,140,0.6)]"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/[0.06]"
                  }`}
                >
                  <div>
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isStartingSoon ? "text-amber-300" : "text-purple-200/80"
                      }`}
                    >
                      {dayLabel}
                    </div>
                    <div
                      dir="ltr"
                      className="text-sm font-extrabold text-white mt-0.5"
                    >
                      {timeLabel}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#FF6D00] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-3 font-medium">{error}</p>
      )}

      {/* Exclusive Vibrant Orange Primary CTA (#FF6D00) for Booking */}
      <button
        type="button"
        disabled={!selectedSlot || booking}
        onClick={handleBookSlot}
        className="mt-6 w-full py-3.5 px-5 rounded-2xl bg-[#FF6D00] hover:bg-[#F56200] active:scale-[0.99] text-white font-extrabold text-sm shadow-[0_10px_25px_-5px_rgba(255,109,0,0.55)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {booking ? (
          <span>
            {lang === "he"
              ? "יוצר קישור Google Meet ושאלת פתיחה ב-AI..."
              : "Creating Google Meet & AI Icebreaker..."}
          </span>
        ) : (
          <>
            <MessageCircleHeart className="w-4 h-4 shrink-0" />
            <span>
              {lang === "he"
                ? `קביעת שיחת 30 דק׳ עם ${firstName}`
                : `Book 30-Min Call with ${firstName}`}
            </span>
            <DirectionalArrow className="w-4 h-4 shrink-0" />
          </>
        )}
      </button>
    </motion.article>
  );
}
