"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useUserProfile, ensureValidUuid } from "@/context/UserProfileContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { withBasePath } from "@/lib/assets";
import { formatUTCInZone, safeTimeZone } from "@/lib/timezone";
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
  timezone: string; // Host's IANA timezone (e.g., "America/New_York")
  usState?: string;
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
  learnerTimezone: string;
  learnerHobbies: string[];
  onBooked: (bookingData: {
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
  }) => void;
}

export default function HostCard({
  host,
  learnerName,
  learnerTimezone,
  learnerHobbies,
  onBooked,
}: HostCardProps) {
  const { lang, isRTL } = useLanguage();
  const { profile, recordMeetingBooked } = useUserProfile();
  const DirectionalArrow = isRTL ? ArrowLeft : ArrowRight;

  const [selectedSlot, setSelectedSlot] = useState<HostSlot | null>(
    host.availableSlots[0] || null
  );
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeViewerTz = safeTimeZone(learnerTimezone);
  const hostTz = safeTimeZone(host.timezone || "America/New_York");

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
      let meetingId = ensureValidUuid();
      let scheduledStart = selectedSlot.utcStartISO;
      const endDate = new Date(
        new Date(scheduledStart).getTime() + 30 * 60 * 1000
      );
      const scheduledEnd = endDate.toISOString();

      let googleMeetLink = `https://meet.jit.si/SilverLingo-${meetingId.slice(
        0,
        8
      )}`;
      const sharedHobby =
        host.sharedHobbies[0] || host.hobbies[0]?.name || "favorite hobbies";
      let aiIcebreaker = `${learnerName}, ask ${
        host.fullName.split(" ")[0]
      } what first sparked their love for ${sharedHobby}!`;

      // Resolve email, phone & timezone for both accounts from Supabase DB table (public.users) + profile
      const participants = await resolveParticipantsFromDB({
        hostId: host.id,
        hostName: host.fullName,
        hostEmail:
          host.email ||
          `${host.fullName.toLowerCase().replace(/\s+/g, ".")}@silverlingo.org`,
        hostPhone: host.phone || "+12125550191",
        hostTimezone: hostTz,
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
            : "+13105550142"),
        learnerTimezone: activeViewerTz,
      });

      let hostEmail = participants.host.email;
      let hostPhone = participants.host.phone;
      let learnerEmail = participants.learner.email;
      let learnerPhone = participants.learner.phone;

      // 1. Save meeting directly to Supabase public.meetings if configured
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data: inserted } = await supabase
            .from("meetings")
            .insert({
              id: meetingId,
              host_id: ensureValidUuid(host.id),
              learner_id: ensureValidUuid(participants.learner.id),
              scheduled_start: scheduledStart,
              scheduled_end: scheduledEnd,
              google_meet_link: googleMeetLink,
              ai_icebreaker: aiIcebreaker,
              status: "scheduled",
            })
            .select()
            .single();

          if (inserted?.id) {
            meetingId = inserted.id;
          }
        } catch {}
      }

      // 2. Also call server API route if available
      try {
        const response = await fetch(withBasePath("/api/meetings/book"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostId: host.id,
            hostName: host.fullName,
            hostEmail,
            hostPhone,
            hostTimezone: hostTz,
            hostHobbies: host.hobbies.map((h) => h.name),
            learnerId: participants.learner.id,
            learnerName,
            learnerEmail,
            learnerPhone,
            learnerTimezone: activeViewerTz,
            learnerHobbies,
            scheduledStartUTC: selectedSlot.utcStartISO,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.meeting?.id) meetingId = data.meeting.id;
          if (data.meeting?.scheduled_start)
            scheduledStart = data.meeting.scheduled_start;
          if (data.meeting?.google_meet_link)
            googleMeetLink = data.meeting.google_meet_link;
          if (data.meeting?.ai_icebreaker)
            aiIcebreaker = data.meeting.ai_icebreaker;
          if (data.hostEmail) hostEmail = data.hostEmail;
          if (data.hostPhone) hostPhone = data.hostPhone;
          if (data.learnerEmail) learnerEmail = data.learnerEmail;
          if (data.learnerPhone) learnerPhone = data.learnerPhone;
        }
      } catch {
        // Static deployment uses direct Supabase client & notification dispatch below
      }

      // 3. Log & dispatch SMS + Email notifications for BOTH accounts in their respective time zones
      await logNotificationsToSupabase({
        meetingId,
        eventType: "scheduled",
        host: {
          ...participants.host,
          email: hostEmail,
          phone: hostPhone,
          timezone: hostTz,
        },
        learner: {
          ...participants.learner,
          email: learnerEmail,
          phone: learnerPhone,
          timezone: activeViewerTz,
        },
        scheduledStartUTC: scheduledStart,
        googleMeetLink,
        aiIcebreaker,
      });

      // 4. Record meeting in UserProfileContext so user can view, reschedule, or cancel it
      await recordMeetingBooked({
        id: meetingId,
        hostId: host.id,
        hostName: host.fullName,
        hostEmail,
        hostPhone,
        hostTimezone: hostTz,
        hostAvatar: host.avatarUrl,
        learnerId: participants.learner.id,
        learnerName,
        learnerEmail,
        learnerPhone,
        learnerTimezone: activeViewerTz,
        learnerAvatar: profile?.avatarUrl || "/avatars/mateo.png",
        scheduledStartUTC: scheduledStart,
        scheduledEndUTC: scheduledEnd,
        googleMeetLink,
        aiIcebreaker,
        status: "scheduled",
        updatedAt: new Date().toISOString(),
      });

      onBooked({
        meetingId,
        hostId: host.id,
        hostName: host.fullName,
        hostEmail,
        hostPhone,
        hostTimezone: hostTz,
        hostAvatar: host.avatarUrl,
        learnerId: participants.learner.id,
        learnerName,
        learnerEmail,
        learnerPhone,
        learnerTimezone: activeViewerTz,
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-gradient-to-b from-[#19102C] to-[#110B20] border border-white/10 hover:border-purple-400/50 rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] transition-all"
    >
      <div>
        {/* Top Row: AI Hobby Match Tag + Rating */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#4A148C] to-purple-800 border border-purple-400/40 text-purple-100 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6D00] shrink-0" />
            <span>
              {lang === "he"
                ? `גם ${firstName} אוהב/ת ${sharedHobbyLabel}!`
                : `${firstName} also likes ${sharedHobbyLabel}!`}
            </span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{host.rating}</span>
            <span className="text-slate-400">({host.callsCompleted})</span>
          </div>
        </div>

        {/* Host Photographic Portrait & Identity */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-purple-400/40 shadow-lg shrink-0 bg-purple-950">
            <img
              src={withBasePath(host.avatarUrl)}
              alt={displayName}
              className="w-full h-full object-cover"
            />
            <span
              title="Online & Ready"
              className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#19102C]"
            />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
              {displayName},{" "}
              <span className="text-purple-300 font-bold">{host.age}</span>
            </h3>
            <p className="text-xs font-semibold text-purple-200/80 mb-1 truncate">
              {displayRole}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#FF6D00] shrink-0" />
              <span>
                {displayCity}, {displayCountry} ({hostTz})
              </span>
            </p>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          “{displayBio}”
        </p>

        {/* Hobby Pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {host.hobbies.map((hobby) => {
            const isShared = host.sharedHobbies.includes(hobby.name);
            const hobbyTitle =
              lang === "he" && hobby.nameHe ? hobby.nameHe : hobby.name;

            return (
              <span
                key={hobby.name}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
                  isShared
                    ? "bg-purple-500/25 text-purple-100 border border-purple-400/50 shadow-sm"
                    : "bg-white/[0.04] text-slate-300 border border-white/10"
                }`}
              >
                <span>{hobby.icon}</span>
                <span>{hobbyTitle}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Timezone-Converted Slot Picker + Primary CTA */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>
              {lang === "he"
                ? `מוצג באזור הזמן שלך (${activeViewerTz}):`
                : `Shown in your timezone (${activeViewerTz}):`}
            </span>
          </span>
          <span className="text-purple-300 font-bold">
            {lang === "he" ? "30 דק׳" : "30 min"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {host.availableSlots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            const viewerFormatted = formatUTCInZone(
              slot.utcStartISO,
              activeViewerTz,
              lang
            );
            const hostFormatted = formatUTCInZone(
              slot.utcStartISO,
              hostTz,
              lang
            );

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`p-3 rounded-xl border text-start transition-all ${
                  isSelected
                    ? "bg-[#4A148C] border-purple-300 text-white shadow-md ring-2 ring-purple-400/30"
                    : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:border-white/25"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold opacity-85 mb-0.5">
                  <span>{viewerFormatted.dayShortLabel}</span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  )}
                </div>
                <div
                  dir="ltr"
                  className="text-sm font-extrabold tracking-tight text-white"
                >
                  {viewerFormatted.timeLabel} {viewerFormatted.tzAbbrev}
                </div>
                {activeViewerTz !== hostTz && (
                  <div
                    dir="ltr"
                    className="text-[11px] text-purple-200/80 font-medium mt-0.5"
                  >
                    ({hostFormatted.timeLabel} {hostFormatted.tzAbbrev} Host)
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/50 border border-red-800/50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!selectedSlot || booking}
          onClick={handleBookSlot}
          className="w-full min-h-[54px] py-3 px-5 rounded-2xl bg-[#FF6D00] hover:bg-[#F56200] active:scale-[0.99] text-white font-extrabold text-sm shadow-[0_10px_25px_-5px_rgba(255,109,0,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <MessageCircleHeart className="w-4 h-4 shrink-0" />
          <span>
            {booking
              ? lang === "he"
                ? "קובע שיחה ושולח SMS + אימייל..."
                : "Booking & Sending SMS + Email..."
              : lang === "he"
              ? `קביעת שיחת 30 דק׳ עם ${firstName}`
              : `Book 30-Min Chat with ${firstName}`}
          </span>
          <DirectionalArrow className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </motion.article>
  );
}
