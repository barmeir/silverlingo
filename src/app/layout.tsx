import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Heebo } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import { UserProfileProvider } from "@/context/UserProfileContext";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title:
    "SilverLingo — Intergenerational Language Exchange | חילופי שפה בין-דוריים",
  description:
    "Connect over shared hobbies via 30-minute 1-on-1 video calls between elderly native English speakers and teen learners.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${heebo.variable}`}>
      <body className="font-sans antialiased selection:bg-[#FF6D00] selection:text-white">
        <LanguageProvider>
          <UserProfileProvider>{children}</UserProfileProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
