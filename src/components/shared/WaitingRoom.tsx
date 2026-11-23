"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatUTCInZone, safeTimeZone } from "@/lib/timezone";
import { useLanguage } from "@/context/LanguageContext";
import { useUserProfile } from "@/context/UserProfileContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { openAuthPromptModal } from "@/components/shared/AuthPromptModal";
import { withBasePath } from "@/lib/assets";
import {
  buildParticipantMessages,
  logNotificationsToSupabase,
  type MeetingLifecycleEvent,
} from "@/lib/notifications";
import {
  Video,
  Sparkles,
  Clock,
  Calendar,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mic,
  Volume2,
  ExternalLink,
  Mail,
  Smartphone,
  RefreshCw,
  XCircle,
  Copy,
  Check,
  PhoneOff,
  Camera,
} from "lucide-react";

interface WaitingRoomProps {
  meetingId?: string;
  hostName: string;
  hostEmail?: string;
  hostPhone?: string;
  hostTimezone?: string;
  hostAvatar?: string;
  learnerName: string;
  learnerEmail?: string;
  learnerPhone?: string;
  learnerTimezone?: string;
  learnerAvatar?: string;
  scheduledStartUTC: string;
  googleMeetLink: string;
  aiIcebreaker: string;
}

export default function WaitingRoom({
  meetingId = "demo-session",
  hostName,
  hostEmail = "arthur.pendelton@silverlingo.org",
  hostPhone = "+12125550191",
  hostTimezone = "America/New_York",
  hostAvatar = "/avatars/arthur.png",
  learnerName,
  learnerEmail = "learner@silverlingo.org",
  learnerPhone = "+13105550142",
  learnerTimezone = "America/Los_Angeles",
  learnerAvatar = "/avatars/mateo.png",
  scheduledStartUTC: initialScheduledStartUTC,
  googleMeetLink,
  aiIcebreaker,
}: WaitingRoomProps) {
  const { lang, isRTL } = useLanguage();
  const { profile, rescheduleMeeting, cancelMeeting } = useUserProfile();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const isSignedIn = Boolean(
    profile &&
      profile.id &&
      profile.fullName?.trim() &&
      (profile.email?.trim() || profile.phone?.trim() || profile.contact?.trim())
  );

  const [scheduledStartUTC, setScheduledStartUTC] = useState(
    initialScheduledStartUTC
  );
  const [eventType, setEventType] =
    useState<MeetingLifecycleEvent>("scheduled");
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [secondsUntilStart, setSecondsUntilStart] = useState<number>(240);

  // Embedded Live Video Room state
  const [inCall, setInCall] = useState(false);
  const [videoProvider, setVideoProvider] = useState<
    "ffmuc" | "jitsi" | "local_hardware"
  >("ffmuc");
  const [copiedInvite, setCopiedInvite] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localCameraError, setLocalCameraError] = useState<string | null>(null);

  const stopLocalHardwareStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((tr) => tr.stop());
      localStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (inCall && videoProvider === "local_hardware") {
      setLocalCameraError(null);
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }
        })
        .catch(() => {
          setLocalCameraError(
            lang === "he"
              ? "לא ניתן היה לגשת למצלמה או למיקרופון בדפדפן. בדקו הרשאות מצלמה."
              : "Could not access camera/microphone. Please allow browser camera permissions."
          );
        });
    } else {
      stopLocalHardwareStream();
    }
    return () => {
      stopLocalHardwareStream();
    };
  }, [inCall, videoProvider, stopLocalHardwareStream, lang]);

  // Extract a clean shared room slug so both Host and Learner join the exact same WebRTC room
  const rawSlug =
    googleMeetLink.split("/").pop()?.replace(/[^a-zA-Z0-9_-]/g, "") ||
    `SilverLingo-${meetingId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "LiveRoom"}`;
  const roomSlug = rawSlug.startsWith("SilverLingo")
    ? rawSlug
    : `SilverLingo-${rawSlug}`;

  const activeDisplayName = profile?.fullName || learnerName || "SilverLingo Guest";
  const encodedName = encodeURIComponent(activeDisplayName);
  const hashConfig = `#userInfo.displayName="${encodedName}"&config.prejoinConfig.enabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`;

  const embeddedVideoUrl =
    videoProvider === "jitsi"
      ? `https://meet.jit.si/${roomSlug}${hashConfig}`
      : `https://meet.ffmuc.net/${roomSlug}${hashConfig}`;

  const directShareableVideoUrl = `https://meet.ffmuc.net/${roomSlug}#config.disableDeepLinking=true`;

  const handleCopyInviteLink = async () => {
    try {
      const shareUrl =
        typeof window !== "undefined"
          ? window.location.href
          : directShareableVideoUrl;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 3000);
    } catch {}
  };

  const validHostTz = safeTimeZone(hostTimezone);
  const validLearnerTz = safeTimeZone(learnerTimezone);

  useEffect(() => {
    setScheduledStartUTC(initialScheduledStartUTC);
  }, [initialScheduledStartUTC]);

  useEffect(() => {
    const updateCountdown = () => {
      const diffMs = new Date(scheduledStartUTC).getTime() - Date.now();
      setSecondsUntilStart(Math.floor(diffMs / 1000));
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [scheduledStartUTC]);

  const minutesRemaining = Math.max(0, Math.floor(secondsUntilStart / 60));
  const secondsRemaining = Math.max(0, secondsUntilStart % 60);

  const hostZoned = formatUTCInZone(scheduledStartUTC, validHostTz, lang);
  const learnerZoned = formatUTCInZone(scheduledStartUTC, validLearnerTz, lang);

  const hostMsgs = buildParticipantMessages(
    {
      id: "host",
      name: hostName,
      role: "elderly",
      email: hostEmail,
      phone: hostPhone,
      timezone: validHostTz,
    },
    {
      id: "learner",
      name: learnerName,
      role: "teen",
      email: learnerEmail,
      phone: learnerPhone,
      timezone: validLearnerTz,
    },
    scheduledStartUTC,
    googleMeetLink,
    aiIcebreaker,
    eventType
  );

  const learnerMsgs = buildParticipantMessages(
    {
      id: "learner",
      name: learnerName,
      role: "teen",
      email: learnerEmail,
      phone: learnerPhone,
      timezone: validLearnerTz,
    },
    {
      id: "host",
      name: hostName,
      role: "elderly",
      email: hostEmail,
      phone: hostPhone,
      timezone: validHostTz,
    },
    scheduledStartUTC,
    googleMeetLink,
    aiIcebreaker,
    eventType
  );

  const handleRescheduleClick = async () => {
    if (!isSignedIn) {
      openAuthPromptModal({
        actionLabelEn: "reschedule this meeting",
        actionLabelHe: "לשנות את מועד הפגישה",
      });
      setActionBanner(
        lang === "he"
          ? "לא ניתן לשנות מועד פגישה ללא משתמש מחובר. יש להתחבר או להירשם תחילה."
          : "You cannot reschedule a meeting without a signed-in user. Please sign in or register first."
      );
      return;
    }

    const newStart = new Date(
      new Date(scheduledStartUTC).getTime() + 60 * 60 * 1000
    ).toISOString();
    setScheduledStartUTC(newStart);
    setEventType("changed");

    const updated = await rescheduleMeeting(meetingId, newStart);
    if (!updated) {
      await logNotificationsToSupabase({
        meetingId,
        eventType: "changed",
        host: {
          id: "host",
          name: hostName,
          role: "elderly",
          email: hostEmail,
          phone: hostPhone,
          timezone: validHostTz,
        },
        learner: {
          id: profile?.id || "learner",
          name: learnerName,
          role: "teen",
          email: learnerEmail,
          phone: learnerPhone,
          timezone: validLearnerTz,
        },
        scheduledStartUTC: newStart,
        googleMeetLink,
        aiIcebreaker,
      });
    }

    const newLearnerZoned = formatUTCInZone(newStart, validLearnerTz, lang);
    const newHostZoned = formatUTCInZone(newStart, validHostTz, lang);
    setActionBanner(
      lang === "he"
        ? `הפגישה שונתה לשעה ${newLearnerZoned.timeWithTz} (${newHostZoned.timeWithTz} אצל המארח). נשלחו הודעות SMS ואימייל חדשות לשני המשתתפים!`
        : `Meeting rescheduled to ${newLearnerZoned.timeWithTz} (${newHostZoned.timeWithTz} Host time). Updated SMS & Email notifications sent to both accounts!`
    );
  };

  const handleCancelClick = async () => {
    if (!isSignedIn) {
      openAuthPromptModal({
        actionLabelEn: "cancel this meeting",
        actionLabelHe: "לבטל את הפגישה",
      });
      setActionBanner(
        lang === "he"
          ? "לא ניתן לבטל פגישה ללא משתמש מחובר. יש להתחבר או להירשם תחילה."
          : "You cannot cancel a meeting without a signed-in user. Please sign in or register first."
      );
      return;
    }

    setEventType("canceled");
    const canceled = await cancelMeeting(meetingId);
    if (!canceled) {
      await logNotificationsToSupabase({
        meetingId,
        eventType: "canceled",
        host: {
          id: "host",
          name: hostName,
          role: "elderly",
          email: hostEmail,
          phone: hostPhone,
          timezone: validHostTz,
        },
        learner: {
          id: profile?.id || "learner",
          name: learnerName,
          role: "teen",
          email: learnerEmail,
          phone: learnerPhone,
          timezone: validLearnerTz,
        },
        scheduledStartUTC,
        googleMeetLink,
        aiIcebreaker,
      });
    }

    setActionBanner(
      lang === "he"
        ? "הפגישה בוטלה. הודעות ביטול ב-SMS ובאימייל נשלחו אוטומטית לשני המשתתפים!"
        : "Meeting Canceled. Cancellation SMS & Email notifications have been automatically sent to both participants!"
    );
  };

  const t = {
    en: {
      backExplore: "Back to Explore",
      meetReady:
        eventType === "canceled" ? "Meeting Canceled" : "Video Room Ready",
      lobbyPill: "1-on-1 Video Lobby",
      startsIn: `Starts in ${minutesRemaining}m ${String(
        secondsRemaining
      ).padStart(2, "0")}s`,
      liveNow: "Session Ready to Join",
      rescheduleBtn: "Change Time (+1 Hour)",
      cancelBtn: "Cancel Meeting",
      icebreakerTitle: "Your AI Icebreaker Question",
      icebreakerTip:
        "💡 Tip: Start your call by asking this question in English to break the ice right away!",
      notifHeader:
        eventType === "changed"
          ? "Updated SMS & Email Sent (Meeting Rescheduled)"
          : eventType === "canceled"
          ? "Cancellation SMS & Email Sent (Meeting Canceled)"
          : "SMS & Email Confirmations Sent to Both Accounts",
      notifSub:
        "Each participant receives the meeting date, local time in their own time zone, TZ abbreviation, and links:",
      hostRoleLabel: "Senior Host",
      learnerRoleLabel: "Teen Learner",
      sendSmsBtn: "Open SMS",
      sendEmailBtn: "Open Email",
      micReady: "Microphone & Camera Ready",
      roomReady: "Private Video Call Room Created",
      joinBtn: "Join Video Call Now",
      joinSub:
        "Tapping Join Video Call opens your 1-on-1 video room immediately on mobile or desktop.",
      footer: "SilverLingo • Connecting Generations Across Time Zones",
    },
    he: {
      backExplore: "חזרה לרשימת המארחים",
      meetReady:
        eventType === "canceled" ? "הפגישה בוטלה" : "חדר הווידאו מוכן",
      lobbyPill: "חדר המתנה לשיחת 1-על-1",
      startsIn: `מתחיל בעוד ${minutesRemaining} דק׳ ו-${String(
        secondsRemaining
      ).padStart(2, "0")} שנ׳`,
      liveNow: "השיחה מוכנה להצטרפות",
      rescheduleBtn: "שינוי שעת פגישה (+1 שעה)",
      cancelBtn: "ביטול פגישה",
      icebreakerTitle: "שאלת שבירת הקרח שלך (AI Icebreaker)",
      icebreakerTip:
        "💡 טיפ: פתחו את השיחה בשאלה הזו באנגלית כדי לשבור את הקרח מיד בהתחלה!",
      notifHeader:
        eventType === "changed"
          ? "נשלחו הודעות SMS ואימייל מעודכנות (שינוי מועד)"
          : eventType === "canceled"
          ? "נשלחו הודעות ביטול ב-SMS ובאימייל לשני המשתתפים"
          : "אישורי פגישה ותזכורות ב-SMS ובאימייל נשלחו לשני החשבונות",
      notifSub:
        "כל משתתף מקבל את תאריך הפגישה, השעה המדויקת באזור הזמן המקומי שלו, קיצור אזור הזמן וקישור לחדר הווידאו:",
      hostRoleLabel: "מארח/ת",
      learnerRoleLabel: "תלמיד/ה",
      sendSmsBtn: "פתיחת SMS",
      sendEmailBtn: "פתיחת אימייל",
      micReady: "מיקרופון ומצלמה מוכנים",
      roomReady: "חדר וידאו פרטי מוכן לשיחה",
      joinBtn: "הצטרפות לשיחת הווידאו",
      joinSub:
        "לחיצה על ׳הצטרפות לשיחת הווידאו׳ תפתח מיד את חדר הווידאו הפרטי שלכם בטלפון או במחשב.",
      footer: "SilverLingo • מחברים בין דורות ברחבי העולם",
    },
  }[lang];

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#280750] via-[#4A148C] to-[#1A0436] text-white flex flex-col justify-between p-3 sm:p-6 md:p-10">
      {/* Top Navigation Bar */}
      <div className="max-w-4xl w-full mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <Link
          href="/explore"
          className="min-h-[48px] sm:min-h-[56px] px-4 sm:px-5 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/25 text-white font-bold text-sm sm:text-[18px] inline-flex items-center gap-2 transition-colors"
        >
          <BackArrow className="w-5 h-5" />
          <span>{t.backExplore}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border font-bold text-xs sm:text-[16px] ${
              eventType === "canceled"
                ? "bg-red-500/20 border-red-400/40 text-red-200"
                : "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                eventType === "canceled"
                  ? "bg-red-400"
                  : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span>{t.meetReady}</span>
          </div>
        </div>
      </div>

      {/* Center Waiting Room Card */}
      <div className="my-4 sm:my-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto bg-[#FDFBF7] text-slate-950 rounded-3xl sm:rounded-[36px] p-4 sm:p-8 md:p-11 shadow-[0_28px_80px_-15px_rgba(0,0,0,0.65)] border-2 border-white space-y-6 sm:space-y-8"
        >
          {/* Top Header & Countdown Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 pb-5">
            <span className="inline-flex items-center gap-2 bg-[#4A148C] text-white font-extrabold px-4 py-2 rounded-full text-sm sm:text-[17px]">
              <Video className="w-4 h-4 text-[#FF6D00]" />
              <span>{t.lobbyPill}</span>
            </span>

            <div
              role="timer"
              aria-live="polite"
              className="px-4 py-2 rounded-full bg-purple-100 border-2 border-[#4A148C] text-[#4A148C] font-extrabold text-sm sm:text-[18px] inline-flex items-center gap-2"
            >
              <Clock className="w-5 h-5" />
              <span>{secondsUntilStart > 0 ? t.startsIn : t.liveNow}</span>
            </div>
          </div>

          {/* Participants Banner & Dual Timezone Conversion Box */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-[36px] font-extrabold text-slate-950 leading-tight tracking-tight">
                {learnerName} & {hostName}
              </h1>

              <div className="flex items-center -space-x-3 rtl:space-x-reverse shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden border-4 border-[#4A148C] shadow-lg bg-purple-900">
                  <img
                    src={withBasePath(hostAvatar)}
                    alt={hostName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden border-4 border-[#FF6D00] shadow-lg bg-orange-600">
                  <img
                    src={withBasePath(learnerAvatar)}
                    alt={learnerName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Automatic Local Time Zone Conversion Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-100 border-2 border-slate-300">
              <div className="bg-white p-3.5 rounded-xl border border-purple-200 space-y-1">
                <div className="text-xs font-extrabold uppercase text-[#4A148C] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#FF6D00]" />
                  <span>
                    {learnerName} ({validLearnerTz})
                  </span>
                </div>
                <div dir="ltr" className="text-base sm:text-lg font-extrabold text-slate-950">
                  {learnerZoned.dateLabel} •{" "}
                  <span className="text-[#4A148C]">
                    {learnerZoned.timeLabel} {learnerZoned.tzAbbrev}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-200 space-y-1">
                <div className="text-xs font-extrabold uppercase text-[#4A148C] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#4A148C]" />
                  <span>
                    {hostName} ({validHostTz})
                  </span>
                </div>
                <div dir="ltr" className="text-base sm:text-lg font-extrabold text-slate-950">
                  {hostZoned.dateLabel} •{" "}
                  <span className="text-[#4A148C]">
                    {hostZoned.timeLabel} {hostZoned.tzAbbrev}
                  </span>
                </div>
              </div>
            </div>

            {/* Reschedule / Cancel Buttons (Trigger Automatic Notifications) */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRescheduleClick}
                className="min-h-[46px] px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 border-2 border-[#4A148C] text-[#4A148C] font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t.rescheduleBtn}</span>
              </button>

              {eventType !== "canceled" && (
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="min-h-[46px] px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border-2 border-red-700 text-red-900 font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{t.cancelBtn}</span>
                </button>
              )}
            </div>

            {actionBanner && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-700 text-amber-950 text-sm sm:text-base font-extrabold">
                ✓ {actionBanner}
              </div>
            )}
          </div>

          {/* SMS & Email Notification Status Box for BOTH Accounts */}
          <section
            aria-label={t.notifHeader}
            className="bg-emerald-50 border-2 border-emerald-700 rounded-3xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base sm:text-[20px] font-extrabold text-emerald-950">
                  {t.notifHeader}
                </h2>
                <p className="text-xs sm:text-[15px] text-emerald-900 font-medium">
                  {t.notifSub}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Host Notification Card */}
              <div className="bg-white rounded-2xl p-4 border border-emerald-300 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-base text-slate-950 truncate">
                    {hostName}
                  </span>
                  <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-[#4A148C] shrink-0">
                    {t.hostRoleLabel} ({hostZoned.tzAbbrev})
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-800 space-y-1">
                  <div className="flex items-center gap-2" dir="ltr">
                    <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-semibold">{hostPhone}</span>
                  </div>
                  <div className="flex items-center gap-2" dir="ltr">
                    <Mail className="w-4 h-4 text-[#4A148C] shrink-0" />
                    <span className="font-semibold truncate">{hostEmail}</span>
                  </div>
                  <div
                    dir="ltr"
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-mono leading-snug"
                  >
                    {hostMsgs.smsBody}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={`sms:${hostPhone}?body=${encodeURIComponent(
                      hostMsgs.smsBody
                    )}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{t.sendSmsBtn}</span>
                  </a>
                  <a
                    href={`mailto:${hostEmail}?subject=${encodeURIComponent(
                      hostMsgs.emailSubject
                    )}&body=${encodeURIComponent(hostMsgs.emailBody)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4A148C] hover:bg-[#380E6B] text-white text-xs font-bold transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{t.sendEmailBtn}</span>
                  </a>
                </div>
              </div>

              {/* Learner Notification Card */}
              <div className="bg-white rounded-2xl p-4 border border-emerald-300 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-base text-slate-950 truncate">
                    {learnerName}
                  </span>
                  <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 shrink-0">
                    {t.learnerRoleLabel} ({learnerZoned.tzAbbrev})
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-800 space-y-1">
                  <div className="flex items-center gap-2" dir="ltr">
                    <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-semibold">{learnerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2" dir="ltr">
                    <Mail className="w-4 h-4 text-[#4A148C] shrink-0" />
                    <span className="font-semibold truncate">{learnerEmail}</span>
                  </div>
                  <div
                    dir="ltr"
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-mono leading-snug"
                  >
                    {learnerMsgs.smsBody}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={`sms:${learnerPhone}?body=${encodeURIComponent(
                      learnerMsgs.smsBody
                    )}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{t.sendSmsBtn}</span>
                  </a>
                  <a
                    href={`mailto:${learnerEmail}?subject=${encodeURIComponent(
                      learnerMsgs.emailSubject
                    )}&body=${encodeURIComponent(learnerMsgs.emailBody)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4A148C] hover:bg-[#380E6B] text-white text-xs font-bold transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{t.sendEmailBtn}</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* AI-Generated Icebreaker Spotlight Box */}
          <section
            aria-label="Conversation Icebreaker"
            className="relative overflow-hidden bg-gradient-to-br from-[#F5F0FA] to-purple-100/80 border-2 border-[#4A148C] rounded-3xl p-5 sm:p-8 space-y-3 shadow-inner"
          >
            <div className="inline-flex items-center gap-2 text-sm sm:text-[17px] font-extrabold uppercase tracking-wider text-[#4A148C]">
              <Sparkles className="w-5 h-5 text-[#FF6D00]" />
              <span>{t.icebreakerTitle}</span>
            </div>

            <p
              dir="ltr"
              className="text-xl sm:text-[28px] font-extrabold text-slate-950 leading-snug text-left"
            >
              “{aiIcebreaker}”
            </p>

            <p className="text-sm sm:text-[17px] text-slate-700 font-medium">
              {t.icebreakerTip}
            </p>
          </section>

          {/* Pre-Call Audio/Video Readiness Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
            <div className="min-h-[54px] px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-300 flex items-center gap-3 text-base sm:text-[17px] font-bold text-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <Mic className="w-5 h-5 text-[#4A148C] shrink-0" />
              <span>{t.micReady}</span>
            </div>

            <div className="min-h-[54px] px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-300 flex items-center gap-3 text-base sm:text-[17px] font-bold text-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <Volume2 className="w-5 h-5 text-[#4A148C] shrink-0" />
              <span>{t.roomReady}</span>
            </div>
          </div>

          {/* Massive Vibrant Orange CTA Button (#FF6D00) + Embedded Live 1-on-1 Video Call Room */}
          {eventType !== "canceled" && (
            <div className="pt-2 space-y-4">
              {!inCall ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSignedIn) {
                        openAuthPromptModal({
                          actionLabelEn: "join the 1-on-1 video call room",
                          actionLabelHe: "להצטרף לחדר שיחת הווידאו",
                        });
                        return;
                      }
                      setInCall(true);
                    }}
                    className="w-full min-h-[70px] sm:min-h-[80px] px-6 py-4 rounded-3xl bg-[#FF6D00] hover:bg-[#E65100] active:scale-[0.99] text-white font-extrabold text-xl sm:text-[28px] shadow-[0_18px_45px_-8px_rgba(255,109,0,0.7)] flex items-center justify-center gap-3 text-center transition-all"
                  >
                    <Video className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
                    <span>{t.joinBtn}</span>
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 border-2 border-[#4A148C] text-[#4A148C] font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors"
                    >
                      {copiedInvite ? (
                        <Check className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>
                        {copiedInvite
                          ? lang === "he"
                            ? "הקישור הועתק! פתחו אותו במכשיר שני לבדיקת שיחה"
                            : "Link Copied! Open on a 2nd device/tab to test live call"
                          : lang === "he"
                          ? "העתקת קישור לחדר לבדיקה ממכשיר שני / טלפון"
                          : "Copy Room Link to Test with a 2nd Device / Phone"}
                      </span>
                    </button>

                    <a
                      href={directShareableVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!isSignedIn) {
                          e.preventDefault();
                          openAuthPromptModal({
                            actionLabelEn: "open the external video call room",
                            actionLabelHe: "לפתוח את חדר הווידאו בחלונית חדשה",
                          });
                        }
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>
                        {lang === "he"
                          ? "פתיחת שיחת הווידאו בטאב נפרד"
                          : "Open Video Room in New Tab"}
                      </span>
                    </a>
                  </div>

                  <p className="text-sm sm:text-[17px] text-center text-slate-700 font-medium">
                    {t.joinSub}
                  </p>
                </>
              ) : (
                <div className="rounded-3xl bg-slate-950 text-white border-4 border-[#4A148C] overflow-hidden shadow-2xl space-y-0">
                  {/* Top Bar of Embedded Video Room */}
                  <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#2A0854] via-[#4A148C] to-[#1A0436] flex flex-wrap items-center justify-between gap-3 border-b border-white/15">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-extrabold text-sm sm:text-base text-white">
                        {lang === "he"
                          ? `שיחת וידאו חיה: ${roomSlug}`
                          : `Live 1-on-1 Video Room: ${roomSlug}`}
                      </span>
                    </div>

                    {/* Server / Mode Switcher */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVideoProvider("ffmuc")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                          videoProvider === "ffmuc"
                            ? "bg-[#FF6D00] text-white"
                            : "bg-white/10 text-purple-200 hover:bg-white/20"
                        }`}
                      >
                        {lang === "he"
                          ? "שרת מהיר (ללא התחברות)"
                          : "Instant Room (No Login)"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideoProvider("jitsi")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                          videoProvider === "jitsi"
                            ? "bg-[#FF6D00] text-white"
                            : "bg-white/10 text-purple-200 hover:bg-white/20"
                        }`}
                      >
                        Jitsi Cloud
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideoProvider("local_hardware")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-colors ${
                          videoProvider === "local_hardware"
                            ? "bg-[#FF6D00] text-white"
                            : "bg-white/10 text-purple-200 hover:bg-white/20"
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>
                          {lang === "he" ? "בדיקת מצלמה" : "Camera Check"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Embedded WebRTC Iframe or Local Camera Hardware Check */}
                  {videoProvider === "local_hardware" ? (
                    <div className="p-6 bg-slate-900 flex flex-col items-center justify-center space-y-4 min-h-[420px]">
                      <div className="w-full max-w-md aspect-video rounded-2xl overflow-hidden bg-black border-2 border-purple-400/50 relative">
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      </div>
                      {localCameraError ? (
                        <p className="text-sm text-red-300 font-bold text-center">
                          {localCameraError}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm text-emerald-300 font-bold text-center">
                          {lang === "he"
                            ? "✓ המצלמה והמיקרופון שלך פועלים! לחצו על ׳שרת מהיר (ללא התחברות)׳ למעלה לשיחה עם משתתף שני."
                            : "✓ Your local camera & microphone are active! Switch to 'Instant Room (No Login)' above to talk with a 2nd participant."}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-[480px] sm:h-[580px] bg-black">
                      <iframe
                        key={embeddedVideoUrl}
                        src={embeddedVideoUrl}
                        title="SilverLingo 1-on-1 Live Video Call"
                        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                        className="w-full h-full border-0"
                      />
                    </div>
                  )}

                  {/* Bottom Controls Bar of Video Player */}
                  <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyInviteLink}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors"
                      >
                        {copiedInvite ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-purple-300" />
                        )}
                        <span>
                          {copiedInvite
                            ? lang === "he"
                              ? "הקישור הועתק!"
                              : "Invite Link Copied!"
                            : lang === "he"
                            ? "העתק קישור למכשיר שני"
                            : "Copy Link for 2nd Device"}
                        </span>
                      </button>

                      <a
                        href={directShareableVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-amber-300" />
                        <span>
                          {lang === "he"
                            ? "פתח במסך מלא / טאב חדש"
                            : "Open in Full Browser Tab"}
                        </span>
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        stopLocalHardwareStream();
                        setInCall(false);
                      }}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-colors"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>
                        {lang === "he" ? "סיום שיחת וידאו" : "Leave Video Call"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <div className="text-center text-purple-200/80 text-xs sm:text-[16px]">
        {t.footer}
      </div>
    </main>
  );
}
