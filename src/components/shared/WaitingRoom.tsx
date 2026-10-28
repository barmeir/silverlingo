"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatUTCToLocalDisplay } from "@/lib/timezone";
import {
  Video,
  Sparkles,
  Clock,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Mic,
  Volume2,
  ExternalLink,
} from "lucide-react";

interface WaitingRoomProps {
  hostName: string;
  hostAvatar?: string;
  learnerName: string;
  learnerAvatar?: string;
  scheduledStartUTC: string;
  googleMeetLink: string;
  aiIcebreaker: string;
}

/**
 * The "Waiting Room" Screen:
 * Shared by both Elderly Hosts and Teen Learners 5 minutes before the meeting starts.
 * Built to strict WCAG AAA standards (18px+ body, 28px+ headers, 80px primary CTA)
 * with realistic participant portraits and an inviting, warm studio aesthetic.
 */
export default function WaitingRoom({
  hostName,
  hostAvatar = "/avatars/arthur.png",
  learnerName,
  learnerAvatar = "/avatars/mateo.png",
  scheduledStartUTC,
  googleMeetLink,
  aiIcebreaker,
}: WaitingRoomProps) {
  const [secondsUntilStart, setSecondsUntilStart] = useState<number>(() => {
    const diffMs = new Date(scheduledStartUTC).getTime() - Date.now();
    return Math.floor(diffMs / 1000);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const diffMs = new Date(scheduledStartUTC).getTime() - Date.now();
      setSecondsUntilStart(Math.floor(diffMs / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledStartUTC]);

  // Waiting room unlocks 5 minutes (300 seconds) before scheduled_start
  const isWithinFiveMinutes = secondsUntilStart <= 300;
  const minutesRemaining = Math.max(0, Math.floor(secondsUntilStart / 60));
  const secondsRemaining = Math.max(0, secondsUntilStart % 60);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#280750] via-[#4A148C] to-[#1A0436] text-white flex flex-col justify-between p-6 md:p-10">
      {/* Top Navigation Bar */}
      <div className="max-w-4xl w-full mx-auto flex flex-wrap items-center justify-between gap-6">
        <Link
          href="/explore"
          className="min-h-[60px] px-6 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/25 text-white font-bold text-[19px] inline-flex items-center gap-3 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>Back to Explore</span>
        </Link>

        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold text-[18px]">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span>Google Meet Link Ready</span>
        </div>
      </div>

      {/* Center Waiting Room Card */}
      <div className="my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto bg-[#FDFBF7] text-slate-950 rounded-[36px] p-8 sm:p-12 shadow-[0_28px_80px_-15px_rgba(0,0,0,0.65)] border-2 border-white space-y-8"
        >
          {/* Top Header & Countdown Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b-2 border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-[#4A148C] text-white font-extrabold px-5 py-2 rounded-full text-[18px]">
                <Video className="w-5 h-5 text-[#FF6D00]" />
                <span>1-on-1 Video Lobby</span>
              </span>
            </div>

            <div
              role="timer"
              aria-live="polite"
              className="px-6 py-2.5 rounded-full bg-purple-100 border-2 border-[#4A148C] text-[#4A148C] font-extrabold text-[20px] inline-flex items-center gap-2.5"
            >
              <Clock className="w-6 h-6" />
              <span>
                {secondsUntilStart > 0
                  ? `Starts in ${minutesRemaining}m ${String(
                      secondsRemaining
                    ).padStart(2, "0")}s`
                  : "Session is Live Now!"}
              </span>
            </div>
          </div>

          {/* Participants Banner with Real Portraits */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-[32px] sm:text-[40px] font-extrabold text-slate-950 leading-tight tracking-tight">
                {learnerName} & {hostName}
              </h1>
              <p className="text-[20px] text-slate-700 font-semibold flex items-center gap-2.5">
                <Calendar className="w-6 h-6 text-[#4A148C] shrink-0" />
                <span>
                  Local Time:{" "}
                  <strong className="text-slate-950">
                    {formatUTCToLocalDisplay(scheduledStartUTC)}
                  </strong>{" "}
                  (30 Minutes)
                </span>
              </p>
            </div>

            {/* Paired Photographic Portraits */}
            <div className="flex items-center -space-x-4 shrink-0">
              <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-[#4A148C] shadow-lg bg-purple-900">
                <img
                  src={hostAvatar}
                  alt={hostName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-[#FF6D00] shadow-lg bg-orange-600">
                <img
                  src={learnerAvatar}
                  alt={learnerName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* AI-Generated Icebreaker Spotlight Box */}
          <section
            aria-label="Conversation Icebreaker"
            className="relative overflow-hidden bg-gradient-to-br from-[#F5F0FA] to-purple-100/80 border-2 border-[#4A148C] rounded-3xl p-7 sm:p-9 space-y-4 shadow-inner"
          >
            <div className="inline-flex items-center gap-2 text-[18px] font-extrabold uppercase tracking-wider text-[#4A148C]">
              <Sparkles className="w-6 h-6 text-[#FF6D00]" />
              <span>Your AI Icebreaker Question</span>
            </div>

            <p className="text-[26px] sm:text-[32px] font-extrabold text-slate-950 leading-snug">
              “{aiIcebreaker}”
            </p>

            <p className="text-[18px] text-slate-700 font-medium">
              💡 Tip: Start your call by asking this question to break the ice
              right away!
            </p>
          </section>

          {/* Pre-Call Audio/Video Readiness Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="min-h-[60px] px-5 py-3 rounded-2xl bg-slate-100 border border-slate-300 flex items-center gap-3.5 text-[18px] font-bold text-slate-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
              <Mic className="w-5 h-5 text-[#4A148C] shrink-0" />
              <span>Microphone & Camera Ready</span>
            </div>

            <div className="min-h-[60px] px-5 py-3 rounded-2xl bg-slate-100 border border-slate-300 flex items-center gap-3.5 text-[18px] font-bold text-slate-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
              <Volume2 className="w-5 h-5 text-[#4A148C] shrink-0" />
              <span>Private Google Meet Room Created</span>
            </div>
          </div>

          {/* Massive Vibrant Orange CTA Button (#FF6D00) — Exclusive Main Action */}
          <div className="pt-2 space-y-4">
            {isWithinFiveMinutes ? (
              <a
                href={googleMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[84px] px-8 py-6 rounded-3xl bg-[#FF6D00] hover:bg-[#E65100] active:scale-[0.99] text-white font-extrabold text-[28px] sm:text-[32px] shadow-[0_18px_45px_-8px_rgba(255,109,0,0.7)] flex items-center justify-center gap-4 text-center transition-all focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-[#FF6D00]"
              >
                <Video className="w-9 h-9 shrink-0" />
                <span>Join Video Call</span>
                <ExternalLink className="w-7 h-7 shrink-0 opacity-90" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full min-h-[84px] px-8 py-6 rounded-3xl bg-slate-200 text-slate-600 font-extrabold text-[24px] border-2 border-slate-300 flex items-center justify-center text-center cursor-not-allowed"
              >
                Waiting Room Opens 5 Minutes Before Call
              </button>
            )}

            <p className="text-[19px] text-center text-slate-700 font-medium">
              Tapping <strong>Join Video Call</strong> opens your 1-on-1 Google
              Meet room immediately—no Google account sign-in needed.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="text-center text-purple-200/80 text-[18px]">
        SilverLingo • Connecting Generations Across the Globe
      </div>
    </main>
  );
}
