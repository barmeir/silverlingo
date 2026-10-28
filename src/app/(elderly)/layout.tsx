import React from "react";
import Link from "next/link";
import { Calendar, Video, HeartHandshake, Home } from "lucide-react";

/**
 * Elderly Interface (Hosts) Layout:
 * - Strict WCAG AAA compliance
 * - Minimum 18px body text, 24px+ headers
 * - Minimum 60px height for all buttons, at least 24px margin/gap between clickable elements
 * - No complex menus, no infinite scroll. Absolute simplicity.
 */
export default function ElderlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#380E6B] via-[#4A148C] to-[#2A0854] text-white font-sans">
      {/* Calm, High-Contrast Top Bar with >=60px buttons and 24px (gap-6) spacing */}
      <header className="bg-[#240646]/95 backdrop-blur-md border-b-2 border-white/20 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <Link
            href="/"
            className="min-h-[60px] px-4 rounded-2xl flex items-center gap-4 focus:outline-none focus:ring-4 focus:ring-[#FF6D00]"
          >
            <img
              src="/avatars/arthur.png"
              alt="Arthur Pendelton"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#FF6D00] shadow-md"
            />
            <div>
              <span className="text-[26px] font-extrabold text-white tracking-tight block leading-none">
                SilverLingo
              </span>
              <span className="text-[18px] text-purple-200 font-semibold">
                Host: Arthur Pendelton
              </span>
            </div>
          </Link>

          {/* Simple Navigation: 60px+ height, 24px gap (gap-6) */}
          <nav
            aria-label="Host Navigation"
            className="flex flex-wrap items-center gap-6"
          >
            <Link
              href="/"
              className="min-h-[60px] px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-[20px] flex items-center gap-3 border-2 border-white/30 transition-colors"
            >
              <Home className="w-6 h-6" />
              <span>Home</span>
            </Link>

            <Link
              href="/availability"
              className="min-h-[60px] px-7 rounded-2xl bg-white text-slate-950 font-extrabold text-[20px] flex items-center gap-3 shadow-md hover:bg-purple-50 transition-colors"
            >
              <Calendar className="w-6 h-6 text-[#4A148C]" />
              <span>My Weekly Schedule</span>
            </Link>

            <Link
              href="/room/demo-session"
              className="min-h-[60px] px-7 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-[20px] flex items-center gap-3 shadow-lg transition-colors"
            >
              <Video className="w-6 h-6" />
              <span>Next Call Waiting Room</span>
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
