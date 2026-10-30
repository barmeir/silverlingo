"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import {
  useUserProfile,
  PREDEFINED_HOBBIES,
  UserRole,
} from "@/context/UserProfileContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { withBasePath } from "@/lib/assets";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  UserCheck,
  Upload,
  Camera,
} from "lucide-react";

const AVATAR_CHOICES = [
  { id: "mateo", url: "/avatars/mateo.png", labelEn: "Preset 1", labelHe: "דוגמה 1" },
  { id: "arthur", url: "/avatars/arthur.png", labelEn: "Preset 2", labelHe: "דוגמה 2" },
  { id: "eleanor", url: "/avatars/eleanor.png", labelEn: "Preset 3", labelHe: "דוגמה 3" },
  { id: "walter", url: "/avatars/walter.png", labelEn: "Preset 4", labelHe: "דוגמה 4" },
];

const SUPPORTED_IMAGE_EXTENSIONS =
  /\.(jpg|jpeg|png|apng|webp|avif|heic|heif|gif|svg|bmp|tif|tiff|jfif|pjpeg|pjp|ico|raw|dng)$/i;

/**
 * Center-crops an image Data URL or Blob URL into a 360x360 JPEG data URL.
 * Rejects if the browser cannot decode the image (e.g. raw HEIC in Chrome).
 */
function cropImageSourceToSquare(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const size = 360;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);

        const minSide = Math.min(img.width || size, img.height || size);
        const sx = ((img.width || size) - minSide) / 2;
        const sy = ((img.height || size) - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Browser could not decode image"));
    img.src = src;
  });
}

function fileToDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts & center-crops any uploaded image (including iPhone .HEIC/.HEIF)
 * so it displays properly in Chrome, Edge, Firefox, and Safari.
 */
async function resizeUploadedImage(file: File): Promise<string> {
  const isHeic =
    /\.(heic|heif|tif|tiff)$/i.test(file.name) ||
    file.type === "image/heic" ||
    file.type === "image/heif";

  // Keep SVGs and GIFs intact
  if (
    file.type === "image/svg+xml" ||
    file.type === "image/gif" ||
    /\.svg$/i.test(file.name)
  ) {
    return fileToDataURL(file);
  }

  // If it's a HEIC/HEIF file, Chrome/Firefox cannot decode it natively in <img>.
  // 1) Try client-side `heic2any` decoder first (works on static GitHub Pages & locally).
  // 2) If `heic2any` fails (e.g. newer iOS 18 HEIC codec), fall back to `/api/photo-convert`.
  if (isHeic) {
    try {
      const heic2anyModule = await import("heic2any");
      const heic2any = heic2anyModule.default || heic2anyModule;
      const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.88,
      });
      const targetBlob = Array.isArray(converted) ? converted[0] : converted;
      const jpegDataUrl = await fileToDataURL(targetBlob);
      return await cropImageSourceToSquare(jpegDataUrl);
    } catch {
      // Fallback to server-side native converter if available
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(withBasePath("/api/photo-convert"), {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.dataUrl) {
          return await cropImageSourceToSquare(data.dataUrl);
        }
      }
      throw new Error("Could not convert HEIC file");
    }
  }

  // Standard image formats (JPG, PNG, WEBP, AVIF, BMP, etc.)
  const rawDataUrl = await fileToDataURL(file);
  try {
    return await cropImageSourceToSquare(rawDataUrl);
  } catch {
    // If browser couldn't decode it directly, try `/api/photo-convert`
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(withBasePath("/api/photo-convert"), {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.dataUrl) {
        return await cropImageSourceToSquare(data.dataUrl);
      }
    }
    throw new Error("Unsupported image encoding");
  }
}

function OnboardingFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, isRTL } = useLanguage();
  const { profile, saveProfile } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ForwardArrow = isRTL ? ArrowLeft : ArrowRight;
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const initialContact = searchParams.get("contact") || "";

  const [role, setRole] = useState<UserRole>("teen");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<string>("16");
  const [country, setCountry] = useState("Israel");
  const [city, setCity] = useState("Tel Aviv");
  const [formerRole, setFormerRole] = useState("High School Student");
  const [bio, setBio] = useState(
    "I love practicing spoken English and talking about sports, movies, and music!"
  );
  const [avatarUrl, setAvatarUrl] = useState("/avatars/mateo.png");
  const [customUploadedAvatar, setCustomUploadedAvatar] = useState<string | null>(
    null
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([
    "Football / Soccer",
    "Classic Movies & Marvel",
    "Music & Vinyl",
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-populate if user already created a profile previously
  useEffect(() => {
    if (profile) {
      setRole(profile.role);
      setFullName(profile.fullName);
      setAge(String(profile.age));
      setCountry(profile.country);
      setCity(profile.city);
      setFormerRole(profile.formerRole);
      setBio(profile.bio);
      // Only restore custom data URL if it's a valid browser-renderable image (not raw data:image/heic)
      if (
        profile.avatarUrl &&
        !profile.avatarUrl.startsWith("data:image/heic") &&
        !profile.avatarUrl.startsWith("data:application/octet-stream")
      ) {
        setAvatarUrl(profile.avatarUrl);
        if (profile.avatarUrl.startsWith("data:image/")) {
          setCustomUploadedAvatar(profile.avatarUrl);
        }
      }
      setSelectedHobbies(profile.hobbies);
    }
  }, [profile]);

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    if (nextRole === "elderly") {
      if (age === "16") setAge("72");
      if (!customUploadedAvatar && avatarUrl === "/avatars/mateo.png") {
        setAvatarUrl("/avatars/arthur.png");
      }
      if (formerRole === "High School Student") {
        setFormerRole(
          lang === "he" ? "מורה בגמלאות" : "Retired Teacher & Storyteller"
        );
      }
      if (bio.includes("practicing spoken English")) {
        setBio(
          lang === "he"
            ? "אני אוהב/ת לשוחח באנגלית עם בני נוער מהעולם ולחלוק סיפורי חיים ותחביבים!"
            : "I enjoy chatting with teenagers around the world and sharing stories over our favorite hobbies!"
        );
      }
    } else {
      if (Number(age) > 40) setAge("16");
      if (!customUploadedAvatar && avatarUrl === "/avatars/arthur.png") {
        setAvatarUrl("/avatars/mateo.png");
      }
      if (formerRole.includes("Retired") || formerRole.includes("בגמלאות")) {
        setFormerRole(lang === "he" ? "תלמיד/ת תיכון" : "High School Student");
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImageMime = file.type.startsWith("image/");
    const isImageExt = SUPPORTED_IMAGE_EXTENSIONS.test(file.name);

    if (!isImageMime && !isImageExt) {
      setErrorMsg(
        lang === "he"
          ? "נא לבחור קובץ תמונה (JPG, PNG, HEIC, WEBP, AVIF, GIF, SVG, BMP, TIFF)."
          : "Please select a valid photo file (JPG, PNG, HEIC, WEBP, AVIF, GIF, SVG, BMP, TIFF)."
      );
      return;
    }

    setUploadingPhoto(true);
    setErrorMsg(null);

    try {
      const dataUrl = await resizeUploadedImage(file);
      setCustomUploadedAvatar(dataUrl);
      setAvatarUrl(dataUrl);
    } catch {
      setErrorMsg(
        lang === "he"
          ? "לא ניתן היה להמיר את התמונה. נסו להעלות אותה שוב או לבחור תמונה אחרת."
          : "Could not convert the selected photo. Please try again or pick another photo."
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const toggleHobby = (hobbyName: string) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobbyName)
        ? prev.filter((h) => h !== hobbyName)
        : [...prev, hobbyName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg(
        lang === "he" ? "נא להזין שם מלא." : "Please enter your full name."
      );
      return;
    }

    if (selectedHobbies.length === 0) {
      setErrorMsg(
        lang === "he"
          ? "נא לבחור לפחות תחביב אחד."
          : "Please select at least one hobby."
      );
      return;
    }

    setSaving(true);
    try {
      const tz =
        typeof window !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
          : "UTC";

      await saveProfile({
        id: profile?.id || `user-${Date.now()}`,
        role,
        fullName: fullName.trim(),
        age: Number(age) || (role === "elderly" ? 70 : 16),
        country: country.trim() || "Israel",
        city: city.trim() || "Tel Aviv",
        formerRole:
          formerRole.trim() ||
          (role === "elderly" ? "Native English Host" : "Teen Learner"),
        bio: bio.trim(),
        avatarUrl,
        hobbies: selectedHobbies,
        contact: initialContact || profile?.contact,
        timezone: tz,
      });

      if (role === "elderly") {
        router.push("/availability");
      } else {
        router.push("/explore");
      }
    } finally {
      setSaving(false);
    }
  };

  const t = {
    en: {
      backHome: "Back to Home",
      pill: "Create Your SilverLingo Profile",
      title: "Tell us a little about yourself!",
      subtitle:
        "Choose your role, upload your photo, pick your favorite hobbies, and start connecting immediately.",
      step1: "1. Who are you joining as?",
      teenTitle: "🎧 Teen Learner",
      teenDesc: "I want to practice speaking English with friendly hosts",
      elderlyTitle: "👴🏼 Senior Host",
      elderlyDesc: "I am a fluent English speaker excited to chat & share stories",
      step2: "2. Choose or upload your profile photo:",
      uploadBtn: uploadingPhoto
        ? "Converting Photo..."
        : "Upload Your Own Photo",
      uploadSub:
        "Supports all formats: JPG, PNG, HEIC (iPhone), WEBP, AVIF, GIF, SVG, BMP, TIFF & Camera",
      uploadedLabel: "Your Photo",
      orPresets: "Or choose a preset portrait:",
      step3: "3. Your Details:",
      nameLabel: "Full Name",
      namePlaceholder: "e.g., Bar Meir",
      ageLabel: "Age",
      countryLabel: "Country",
      cityLabel: "City",
      roleLabel:
        role === "elderly"
          ? "Former Profession / Title"
          : "School / Short Title",
      bioLabel: "Short Bio (What do you love talking about?)",
      step4: "4. Pick your favorite hobbies (Used for AI Matching & Icebreakers):",
      submitTeen: "Save My Profile & Explore Hosts",
      submitElderly: "Save My Profile & Open My Calendar",
      saving: "Saving your profile...",
    },
    he: {
      backHome: "חזרה לדף הבית",
      pill: "יצירת פרופיל אישי ב-SilverLingo",
      title: "ספרו לנו קצת על עצמכם!",
      subtitle:
        "בחרו את התפקיד שלכם, העלו תמונה, סמנו תחביבים משותפים והתחילו מיד.",
      step1: "1. בתור מי תרצו להצטרף?",
      teenTitle: "🎧 תלמיד/ה (Teen Learner)",
      teenDesc: "אני רוצה לתרגל שיחה באנגלית עם מארחים דוברי שפת אם",
      elderlyTitle: "👴🏼 מארח/ת ותיק/ה (Senior Host)",
      elderlyDesc: "אני דובר/ת אנגלית ורוצה לשוחח ולשתף סיפורי חיים",
      step2: "2. בחרו או העלו תמונת פרופיל:",
      uploadBtn: uploadingPhoto
        ? "ממיר ומעבד תמונה..."
        : "העלאת תמונה מהמכשיר / מצלמה",
      uploadSub:
        "תומך בכל סוגי התמונות: JPG, PNG, HEIC (אייפון), WEBP, AVIF, GIF, SVG, BMP, TIFF ומצלמה",
      uploadedLabel: "התמונה שלך",
      orPresets: "או בחרו מתוך תמונות הדוגמה:",
      step3: "3. הפרטים האישיים שלכם:",
      nameLabel: "שם מלא",
      namePlaceholder: "לדוגמה: בר מאיר",
      ageLabel: "גיל",
      countryLabel: "מדינה",
      cityLabel: "עיר",
      roleLabel:
        role === "elderly" ? "מקצוע קודם / תיאור קצר" : "בית ספר / תיאור קצר",
      bioLabel: "קצת עליי (על מה כיף לך לדבר?)",
      step4: "4. בחרו את התחביבים שלכם (עבור התאמת AI ושאלות פתיחה):",
      submitTeen: "שמירת פרופיל ומציאת מארחים לשיחה",
      submitElderly: "שמירת פרופיל ומעבר ליומן הזמינות שלי",
      saving: "שומר את הפרופיל שלך...",
    },
  }[lang];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#2A0854] via-[#4A148C] to-[#1D053A] text-white flex flex-col justify-between px-6 py-10">
      {/* Top Bar */}
      <div className="max-w-4xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="min-h-[60px] px-6 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/25 text-white font-bold text-[19px] inline-flex items-center gap-3 transition-all"
        >
          <BackArrow className="w-6 h-6" />
          <span>{t.backHome}</span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher size="elderly" />
        </div>
      </div>

      {/* Main Profile Creation Card */}
      <div className="my-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto bg-[#FDFBF7] text-slate-950 rounded-[36px] p-8 sm:p-12 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border-2 border-white"
        >
          <header className="mb-8 space-y-3 border-b-2 border-slate-200 pb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-[#4A148C]/30 text-[#4A148C] font-extrabold text-[18px]">
              <Sparkles className="w-5 h-5" />
              <span>{t.pill}</span>
            </div>

            <h1 className="text-[32px] sm:text-[38px] font-extrabold leading-tight text-slate-950 tracking-tight">
              {t.title}
            </h1>

            <p className="text-[20px] text-slate-700 leading-relaxed">
              {t.subtitle}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Role Selection */}
            <div className="space-y-4">
              <label className="block text-[22px] font-extrabold text-slate-950">
                {t.step1}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("teen")}
                  aria-pressed={role === "teen"}
                  className={`min-h-[96px] p-6 rounded-3xl border-2 text-start transition-all flex items-start justify-between gap-4 ${
                    role === "teen"
                      ? "bg-[#4A148C] text-white border-[#4A148C] shadow-xl ring-4 ring-[#4A148C]/25"
                      : "bg-white text-slate-900 border-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-[22px] font-extrabold">
                      {t.teenTitle}
                    </div>
                    <p
                      className={`text-[17px] leading-snug ${
                        role === "teen" ? "text-purple-100" : "text-slate-600"
                      }`}
                    >
                      {t.teenDesc}
                    </p>
                  </div>
                  {role === "teen" && (
                    <span className="w-8 h-8 rounded-full bg-white text-[#4A148C] flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSwitch("elderly")}
                  aria-pressed={role === "elderly"}
                  className={`min-h-[96px] p-6 rounded-3xl border-2 text-start transition-all flex items-start justify-between gap-4 ${
                    role === "elderly"
                      ? "bg-[#4A148C] text-white border-[#4A148C] shadow-xl ring-4 ring-[#4A148C]/25"
                      : "bg-white text-slate-900 border-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-[22px] font-extrabold">
                      {t.elderlyTitle}
                    </div>
                    <p
                      className={`text-[17px] leading-snug ${
                        role === "elderly"
                          ? "text-purple-100"
                          : "text-slate-600"
                      }`}
                    >
                      {t.elderlyDesc}
                    </p>
                  </div>
                  {role === "elderly" && (
                    <span className="w-8 h-8 rounded-full bg-white text-[#4A148C] flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Step 2: Upload Custom Photo OR Pick a Preset Portrait */}
            <div className="space-y-5">
              <label className="block text-[22px] font-extrabold text-slate-950">
                {t.step2}
              </label>

              {/* Upload Photo Card + Active Preview */}
              <div className="p-6 rounded-3xl bg-purple-50/80 border-2 border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-4 border-[#4A148C] shadow-lg bg-white shrink-0">
                    <img
                      src={withBasePath(avatarUrl)}
                      alt="Selected Profile Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[20px] font-extrabold text-slate-950 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-[#4A148C]" />
                      <span>{t.uploadBtn}</span>
                    </div>
                    <p className="text-[17px] text-slate-700">{t.uploadSub}</p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.apng,.webp,.avif,.heic,.heif,.gif,.svg,.bmp,.tif,.tiff,.jfif,.pjpeg,.pjp,.ico"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto min-h-[64px] px-7 rounded-2xl bg-[#4A148C] hover:bg-[#380E6B] text-white font-extrabold text-[19px] shadow-md flex items-center justify-center gap-3 transition-all shrink-0 focus:outline-none focus:ring-4 focus:ring-[#4A148C]/40 disabled:opacity-60"
                >
                  <Upload className="w-6 h-6" />
                  <span>{t.uploadBtn}</span>
                </button>
              </div>

              {/* Preset Portraits Row */}
              <div className="space-y-3">
                <span className="block text-[18px] font-bold text-slate-700">
                  {t.orPresets}
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {customUploadedAvatar && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(customUploadedAvatar)}
                      className={`p-3 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                        avatarUrl === customUploadedAvatar
                          ? "bg-purple-50 border-[#4A148C] ring-4 ring-[#4A148C]/25 shadow-md"
                          : "bg-white border-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <img
                        src={customUploadedAvatar}
                        alt={t.uploadedLabel}
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-300"
                      />
                      <span className="text-[16px] font-bold text-[#4A148C]">
                        ✓ {t.uploadedLabel}
                      </span>
                    </button>
                  )}

                  {AVATAR_CHOICES.map((av) => {
                    const active = avatarUrl === av.url;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatarUrl(av.url)}
                        className={`p-3 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                          active
                            ? "bg-purple-50 border-[#4A148C] ring-4 ring-[#4A148C]/25 shadow-md"
                            : "bg-white border-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <img
                          src={withBasePath(av.url)}
                          alt={av.labelEn}
                          className="w-20 h-20 rounded-2xl object-cover border border-slate-300"
                        />
                        <span className="text-[16px] font-bold text-slate-900">
                          {lang === "he" ? av.labelHe : av.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Personal Info Inputs */}
            <div className="space-y-6">
              <h2 className="text-[22px] font-extrabold text-slate-950">
                {t.step3}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-[18px] font-bold text-slate-900">
                    {t.nameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full min-h-[60px] px-5 rounded-2xl bg-white border-2 border-slate-700 text-[20px] font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C] focus:ring-4 focus:ring-[#4A148C]/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[18px] font-bold text-slate-900">
                    {t.ageLabel} *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={110}
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full min-h-[60px] px-5 rounded-2xl bg-white border-2 border-slate-700 text-[20px] font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C] focus:ring-4 focus:ring-[#4A148C]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-[18px] font-bold text-slate-900">
                    {t.countryLabel}
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full min-h-[60px] px-5 rounded-2xl bg-white border-2 border-slate-700 text-[19px] font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[18px] font-bold text-slate-900">
                    {t.cityLabel}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full min-h-[60px] px-5 rounded-2xl bg-white border-2 border-slate-700 text-[19px] font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[18px] font-bold text-slate-900">
                    {t.roleLabel}
                  </label>
                  <input
                    type="text"
                    value={formerRole}
                    onChange={(e) => setFormerRole(e.target.value)}
                    className="w-full min-h-[60px] px-5 rounded-2xl bg-white border-2 border-slate-700 text-[19px] font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[18px] font-bold text-slate-900">
                  {t.bioLabel}
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white border-2 border-slate-700 text-[19px] font-medium text-slate-950 focus:outline-none focus:border-[#4A148C]"
                />
              </div>
            </div>

            {/* Step 4: Hobbies Selection (60px+ touch targets, 24px gap) */}
            <div className="space-y-4">
              <label className="block text-[22px] font-extrabold text-slate-950">
                {t.step4}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {PREDEFINED_HOBBIES.map((hobby) => {
                  const isSelected = selectedHobbies.includes(hobby.name);
                  return (
                    <button
                      key={hobby.id}
                      type="button"
                      onClick={() => toggleHobby(hobby.name)}
                      aria-pressed={isSelected}
                      className={`min-h-[64px] px-5 py-3 rounded-2xl border-2 font-extrabold text-[18px] transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-[#4A148C] text-white border-[#4A148C] shadow-md"
                          : "bg-white text-slate-900 border-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span className="text-2xl">{hobby.icon}</span>
                        <span className="truncate">
                          {lang === "he" ? hobby.nameHe : hobby.name}
                        </span>
                      </span>
                      {isSelected && <Check className="w-5 h-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-5 rounded-2xl bg-red-50 border-2 border-red-800 text-red-950 text-[20px] font-bold"
              >
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Exclusive Vibrant Orange Primary CTA (#FF6D00) */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full min-h-[76px] px-8 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] active:scale-[0.99] text-white font-extrabold text-[24px] shadow-[0_14px_34px_-6px_rgba(255,109,0,0.65)] transition-all flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-[#FF6D00]"
              >
                <UserCheck className="w-7 h-7 shrink-0" />
                <span>
                  {saving
                    ? t.saving
                    : role === "elderly"
                    ? t.submitElderly
                    : t.submitTeen}
                </span>
                <ForwardArrow className="w-7 h-7 shrink-0" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#4A148C]" />}>
      <OnboardingFormContent />
    </Suspense>
  );
}
