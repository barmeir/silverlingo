"use client";

import React, { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import {
  useUserProfile,
  PREDEFINED_HOBBIES,
  type UserRole,
} from "@/context/UserProfileContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import {
  COUNTRY_CALLING_CODES,
  COUNTRIES_OF_RESIDENCE,
  US_STATES,
  resolveTimezoneForLocation,
  validatePhoneForCountryCode,
} from "@/lib/location-timezone";
import { formatUTCInZone } from "@/lib/timezone";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  UserCheck,
  Camera,
  Upload,
  Globe2,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const SUPPORTED_IMAGE_EXTENSIONS =
  /\.(jpe?g|png|gif|webp|avif|heic|heif|bmp|svg|tiff?|ico|jfif|pjpeg|pjp)$/i;

function isHeicOrHeif(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  return (
    mime.includes("heic") ||
    mime.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

async function convertFileToRenderableBlob(file: File): Promise<Blob> {
  if (!isHeicOrHeif(file)) {
    return file;
  }

  try {
    const heic2anyModule = await import("heic2any");
    const heic2any = heic2anyModule.default || heic2anyModule;
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.88,
    });
    return Array.isArray(converted) ? converted[0] : converted;
  } catch {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/photo-convert", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new Error("HEIC conversion failed");
    }
    const { dataUrl } = await res.json();
    const fetched = await fetch(dataUrl);
    return await fetched.blob();
  }
}

function resizeUploadedImage(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const renderableBlob = await convertFileToRenderableBlob(file);
      const objectUrl = URL.createObjectURL(renderableBlob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        const size = 360;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);

        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };

      img.onerror = async () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/photo-convert", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const { dataUrl } = await res.json();
            resolve(dataUrl);
            return;
          }
        } catch {}
        reject(new Error("Unsupported image format"));
      };

      img.src = objectUrl;
    } catch (err) {
      reject(err);
    }
  });
}

function OnboardingFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, isRTL } = useLanguage();
  const { profile, saveProfile } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const ForwardArrow = isRTL ? ArrowLeft : ArrowRight;
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const initialContact = searchParams.get("contact") || "";
  const isInitialEmail = initialContact.includes("@");

  const [role, setRole] = useState<UserRole>("teen");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(isInitialEmail ? initialContact : "");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [phoneNational, setPhoneNational] = useState("");
  const [age, setAge] = useState<string>("16");
  const [country, setCountry] = useState("United States");
  const [usState, setUsState] = useState("New York");
  const [city, setCity] = useState("New York");
  const [formerRole, setFormerRole] = useState("High School Student");
  const [bio, setBio] = useState(
    "I love practicing spoken English and talking about sports, movies, and music!"
  );

  // Mandatory user-provided profile picture (starts empty until user uploads or takes a photo)
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Live Camera WebRTC state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([
    "Football / Soccer",
    "Classic Movies & Marvel",
    "Music & Vinyl",
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nowPreview, setNowPreview] = useState<string>("");

  // Automatically compute the user's IANA timezone from Country + US State
  const resolvedTimezone = resolveTimezoneForLocation(
    country,
    country === "United States" ? usState : undefined
  );

  useEffect(() => {
    const updateClock = () => {
      const formatted = formatUTCInZone(
        new Date().toISOString(),
        resolvedTimezone,
        lang
      );
      setNowPreview(`${formatted.timeLabel} ${formatted.tzAbbrev}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, [resolvedTimezone, lang]);

  // Pre-populate if user already registered a profile previously
  useEffect(() => {
    if (profile) {
      setRole(profile.role);
      setFullName(profile.fullName);
      if (profile.email) setEmail(profile.email);
      if (profile.phoneCountryCode) {
        setPhoneCountryCode(profile.phoneCountryCode);
      }
      if (profile.phoneNational) {
        setPhoneNational(profile.phoneNational);
      } else if (profile.phone) {
        const matchedCode = COUNTRY_CALLING_CODES.find((c) =>
          profile.phone?.startsWith(c.code)
        );
        if (matchedCode) {
          setPhoneCountryCode(matchedCode.code);
          setPhoneNational(profile.phone.slice(matchedCode.code.length));
        } else {
          setPhoneNational(profile.phone);
        }
      }
      setAge(String(profile.age));
      setCountry(profile.country || "United States");
      if (profile.usState) setUsState(profile.usState);
      setCity(profile.city || "");
      setFormerRole(profile.formerRole || "");
      setBio(profile.bio || "");
      if (
        profile.avatarUrl &&
        profile.avatarUrl.startsWith("data:image/") &&
        !profile.avatarUrl.startsWith("data:image/heic")
      ) {
        setAvatarUrl(profile.avatarUrl);
      }
      setSelectedHobbies(profile.hobbies);
    }
  }, [profile]);

  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const startLiveCamera = async (
    nextFacingMode: "user" | "environment" = facingMode
  ) => {
    setCameraError(null);
    stopCameraStream();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      // Fallback to native mobile camera input
      cameraFallbackInputRef.current?.click();
      return;
    }

    try {
      setCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: nextFacingMode,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraOpen(false);
      // Automatically open mobile hardware camera fallback if browser blocks WebRTC
      cameraFallbackInputRef.current?.click();
    }
  };

  const handleFlipCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startLiveCamera(next);
  };

  const handleCaptureCameraFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const size = 360;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const minDim = Math.min(vw, vh);
    const sx = (vw - minDim) / 2;
    const sy = (vh - minDim) / 2;

    if (facingMode === "user") {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);

    const capturedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setAvatarUrl(capturedDataUrl);
    setErrorMsg(null);
    stopCameraStream();
    setCameraOpen(false);
  };

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    if (nextRole === "elderly") {
      if (age === "16") setAge("72");
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
      if (formerRole.includes("Retired") || formerRole.includes("בגמלאות")) {
        setFormerRole(lang === "he" ? "תלמיד/ת תיכון" : "High School Student");
      }
    }
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const found = COUNTRIES_OF_RESIDENCE.find((c) => c.name === newCountry);
    if (found) {
      setPhoneCountryCode(found.defaultCallingCode);
    }
    if (newCountry === "United States" && !usState) {
      setUsState("New York");
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
          ? "נא לבחור קובץ תמונה תקין (JPG, PNG, HEIC, WEBP)."
          : "Please select a valid photo file (JPG, PNG, HEIC, WEBP)."
      );
      return;
    }

    setUploadingPhoto(true);
    setErrorMsg(null);

    try {
      const dataUrl = await resizeUploadedImage(file);
      setAvatarUrl(dataUrl);
    } catch {
      setErrorMsg(
        lang === "he"
          ? "לא ניתן היה לעבד את התמונה. נסו להעלות תמונה אחרת."
          : "Could not process the selected photo. Please try another photo."
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraFallbackInputRef.current)
        cameraFallbackInputRef.current.value = "";
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

    // 1. Validate Mandatory Profile Picture
    if (!avatarUrl) {
      setErrorMsg(
        lang === "he"
          ? "חובה להעלות תמונת פרופיל או לצלם תמונה באמצעות המצלמה כדי להשלים את ההרשמה."
          : "A profile picture is mandatory! Please upload a photo from your device or take a photo with your camera."
      );
      return;
    }

    // 2. Validate Full Name
    if (!fullName.trim()) {
      setErrorMsg(
        lang === "he" ? "נא להזין שם מלא." : "Please enter your full name."
      );
      return;
    }

    // 3. Validate Email Address
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg(
        lang === "he"
          ? "נא להזין כתובת אימייל תקינה."
          : "Please enter a valid email address."
      );
      return;
    }

    // 4. Validate Phone Number against selected Country Calling Code
    const phoneCheck = validatePhoneForCountryCode(
      phoneNational,
      phoneCountryCode
    );
    if (!phoneCheck.valid) {
      setErrorMsg(
        (lang === "he" ? phoneCheck.errorHe : phoneCheck.errorEn) ||
          "Invalid phone number for selected country calling code."
      );
      return;
    }

    // 5. Validate Country & US State
    if (!country) {
      setErrorMsg(
        lang === "he"
          ? "נא לבחור מדינת מגורים."
          : "Please select your country of residence."
      );
      return;
    }
    if (country === "United States" && !usState) {
      setErrorMsg(
        lang === "he"
          ? "נא לבחור מדינה בארה״ב (State) לקביעת אזור הזמן."
          : "Please select your US State so we can set your accurate time zone."
      );
      return;
    }

    // 6. Validate Hobbies
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
      await saveProfile({
        id: profile?.id || "",
        role,
        fullName: fullName.trim(),
        email: cleanEmail,
        phoneCountryCode,
        phoneNational: phoneCheck.nationalNumber,
        phone: phoneCheck.e164,
        age: Number(age) || (role === "elderly" ? 70 : 16),
        country,
        usState: country === "United States" ? usState : undefined,
        city: city.trim() || (country === "United States" ? usState : country),
        formerRole:
          formerRole.trim() ||
          (role === "elderly" ? "Native English Host" : "Teen Learner"),
        bio: bio.trim(),
        avatarUrl,
        hobbies: selectedHobbies,
        contact: cleanEmail,
        timezone: resolvedTimezone,
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

  const selectedCodeObj =
    COUNTRY_CALLING_CODES.find((c) => c.code === phoneCountryCode) ||
    COUNTRY_CALLING_CODES[0];

  const t = {
    en: {
      backHome: "Back to Home",
      alreadyRegistered: "Already Registered? Sign In",
      pill: "User Registration & Identification",
      title: "Create Your SilverLingo Account",
      subtitle:
        "No password required. Register with your Email, Country Calling Code + Phone, Photo, and Location for automatic Time Zone matching.",
      step1: "1. Choose Your Role:",
      teenTitle: "🎧 Teen Learner",
      teenDesc: "Practice spoken English with native-speaking senior hosts",
      elderlyTitle: "👴🏼 Senior Host",
      elderlyDesc: "Fluent English speaker excited to chat & share stories",
      step2: "2. Mandatory Profile Picture (Required):",
      photoRequiredBadge: "Required to complete registration",
      photoReadyBadge: "Profile Picture Ready ✓",
      uploadFromDeviceBtn: uploadingPhoto
        ? "Processing Photo..."
        : "Upload Photo from Device",
      openCameraBtn: "Open Camera & Take Photo",
      captureBtn: "Take Photo Now",
      flipCameraBtn: "Switch Camera",
      cancelCameraBtn: "Cancel",
      photoHint:
        "Upload a photo from your phone/computer OR open your device camera directly.",
      step3: "3. Identification & Contact Details:",
      nameLabel: "Full Name",
      namePlaceholder: "e.g., Bar Meir",
      ageLabel: "Age",
      emailLabel: "Email Address (for Meeting Confirmations & Reminders)",
      emailPlaceholder: "name@example.com",
      callingCodeLabel: "Country Calling Code",
      phoneLabel: "Mobile Phone Number (for SMS Notifications)",
      step4Location: "4. Country, State & Automatic Time Zone:",
      countryLabel: "Country of Residence",
      usStateLabel: "US State (Required for United States Time Zone)",
      cityLabel: "City",
      detectedTzTitle: "Automatically Assigned Time Zone:",
      detectedTzSub:
        "All meeting times, calendar slots, and SMS/Email reminders will be converted automatically to this time zone (including Daylight Saving Time).",
      roleLabel:
        role === "elderly"
          ? "Former Profession / Title"
          : "School / Short Title",
      bioLabel: "Short Bio",
      step5Hobbies: "5. Pick Your Favorite Hobbies:",
      submitTeen: "Complete Registration & Explore Hosts",
      submitElderly: "Complete Registration & Open My Schedule",
      saving: "Registering your account...",
    },
    he: {
      backHome: "חזרה לדף הבית",
      alreadyRegistered: "כבר רשומים? התחברות",
      pill: "הרשמה וזיהוי משתמש",
      title: "יצירת חשבון ב-SilverLingo",
      subtitle:
        "ללא צורך בסיסמה. הירשמו עם אימייל, קידומת מדינה + מספר טלפון, תמונת פרופיל ומיקום לזיהוי אוטומטי של אזור הזמן.",
      step1: "1. בחרו את התפקיד שלכם:",
      teenTitle: "🎧 תלמיד/ה (Teen Learner)",
      teenDesc: "תרגול אנגלית מדוברת עם מארחים דוברי אנגלית שפת אם",
      elderlyTitle: "👴🏼 מארח/ת ותיק/ה (Senior Host)",
      elderlyDesc: "דובר/ת אנגלית המעוניין/ת לשוחח ולשתף סיפורי חיים",
      step2: "2. תמונת פרופיל (חובה להשלמת ההרשמה):",
      photoRequiredBadge: "חובה להעלות או לצלם תמונה",
      photoReadyBadge: "תמונת הפרופיל מוכנה ✓",
      uploadFromDeviceBtn: uploadingPhoto
        ? "מעבד תמונה..."
        : "העלאת תמונה מהמכשיר",
      openCameraBtn: "פתיחת מצלמה וצילום תמונה",
      captureBtn: "צלם תמונה עכשיו",
      flipCameraBtn: "החלף מצלמה",
      cancelCameraBtn: "ביטול",
      photoHint:
        "בחרו תמונה קיימת מהטלפון/מחשב או פתחו את המצלמה לצילום ישיר דרך האתר.",
      step3: "3. פרטי זיהוי והתקשרות (אימייל וטלפון):",
      nameLabel: "שם מלא",
      namePlaceholder: "לדוגמה: בר מאיר",
      ageLabel: "גיל",
      emailLabel: "כתובת אימייל (לקבלת אישורי פגישות ותזכורות)",
      emailPlaceholder: "name@example.com",
      callingCodeLabel: "קידומת חיוג בינלאומית",
      phoneLabel: "מספר טלפון נייד (לקבלת התראות SMS)",
      step4Location: "4. מדינת מגורים ואזור זמן אוטומטי:",
      countryLabel: "מדינת מגורים",
      usStateLabel: "מדינה בארה״ב (State — חובה עבור ארצות הברית)",
      cityLabel: "עיר",
      detectedTzTitle: "אזור הזמן שזוהה אוטומטית:",
      detectedTzSub:
        "כל שעות הפגישות והתזכורות ב-SMS ובאימייל יומרו ויוצגו אוטומטית לפי אזור הזמן שלך (כולל שעון קיץ/חורף).",
      roleLabel:
        role === "elderly" ? "מקצוע קודם / תיאור" : "בית ספר / תיאור קצר",
      bioLabel: "קצת עליי",
      step5Hobbies: "5. בחרו תחביבים משותפים:",
      submitTeen: "השלמת הרשמה ומעבר לרשימת המארחים",
      submitElderly: "השלמת הרשמה ומעבר ליומן הזמינות שלי",
      saving: "שומר ומקים את החשבון...",
    },
  }[lang];

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#2A0854] via-[#4A148C] to-[#1D053A] text-white flex flex-col justify-between px-3 sm:px-6 py-5 sm:py-10">
      {/* Top Bar (Mobile-optimized) */}
      <div className="max-w-4xl w-full mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <Link
          href="/"
          className="min-h-[48px] sm:min-h-[56px] px-4 sm:px-5 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/25 text-white font-bold text-base sm:text-[18px] inline-flex items-center gap-2 transition-all"
        >
          <BackArrow className="w-5 h-5" />
          <span>{t.backHome}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="min-h-[48px] sm:min-h-[56px] px-4 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-sm sm:text-base inline-flex items-center"
          >
            {t.alreadyRegistered}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="my-4 sm:my-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto bg-[#FDFBF7] text-slate-950 rounded-3xl sm:rounded-[36px] p-4 sm:p-8 md:p-11 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border-2 border-white"
        >
          <header className="mb-6 sm:mb-8 space-y-2.5 border-b-2 border-slate-200 pb-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 border border-[#4A148C]/30 text-[#4A148C] font-extrabold text-sm sm:text-[16px]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{t.pill}</span>
            </div>

            <h1 className="text-2xl sm:text-[36px] font-extrabold leading-tight text-slate-950 tracking-tight">
              {t.title}
            </h1>

            <p className="text-base sm:text-[19px] text-slate-700 leading-relaxed">
              {t.subtitle}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-7 sm:space-y-8" noValidate>
            {/* Step 1: Role Selection */}
            <div className="space-y-3">
              <label className="block text-lg sm:text-[21px] font-extrabold text-slate-950">
                {t.step1}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("teen")}
                  aria-pressed={role === "teen"}
                  className={`min-h-[84px] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 text-start transition-all flex items-start justify-between gap-3 ${
                    role === "teen"
                      ? "bg-[#4A148C] text-white border-[#4A148C] shadow-xl ring-4 ring-[#4A148C]/25"
                      : "bg-white text-slate-900 border-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-lg sm:text-[21px] font-extrabold">
                      {t.teenTitle}
                    </div>
                    <p
                      className={`text-sm sm:text-[16px] leading-snug ${
                        role === "teen" ? "text-purple-100" : "text-slate-600"
                      }`}
                    >
                      {t.teenDesc}
                    </p>
                  </div>
                  {role === "teen" && (
                    <span className="w-7 h-7 rounded-full bg-white text-[#4A148C] flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSwitch("elderly")}
                  aria-pressed={role === "elderly"}
                  className={`min-h-[84px] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 text-start transition-all flex items-start justify-between gap-3 ${
                    role === "elderly"
                      ? "bg-[#4A148C] text-white border-[#4A148C] shadow-xl ring-4 ring-[#4A148C]/25"
                      : "bg-white text-slate-900 border-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-lg sm:text-[21px] font-extrabold">
                      {t.elderlyTitle}
                    </div>
                    <p
                      className={`text-sm sm:text-[16px] leading-snug ${
                        role === "elderly"
                          ? "text-purple-100"
                          : "text-slate-600"
                      }`}
                    >
                      {t.elderlyDesc}
                    </p>
                  </div>
                  {role === "elderly" && (
                    <span className="w-7 h-7 rounded-full bg-white text-[#4A148C] flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Step 2: Mandatory Profile Picture (Device Upload OR Direct Camera Capture) */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-lg sm:text-[21px] font-extrabold text-slate-950">
                  {t.step2} *
                </label>
                {avatarUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-700 text-emerald-900 text-xs sm:text-sm font-extrabold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>{t.photoReadyBadge}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-700 text-amber-950 text-xs sm:text-sm font-extrabold">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>{t.photoRequiredBadge}</span>
                  </span>
                )}
              </div>

              <div className="p-4 sm:p-6 rounded-3xl bg-purple-50/90 border-2 border-purple-200 space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Avatar Preview Circle/Square */}
                  <div
                    className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 shadow-lg shrink-0 flex items-center justify-center ${
                      avatarUrl
                        ? "border-emerald-600 bg-white"
                        : "border-dashed border-[#4A148C] bg-white/80"
                    }`}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Uploaded User Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-500">
                        <Camera className="w-9 h-9 mx-auto text-[#4A148C] mb-1" />
                        <span className="text-xs font-bold block leading-tight">
                          {lang === "he" ? "נדרשת תמונה" : "Photo Required"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-3">
                    <p className="text-sm sm:text-[16px] text-slate-700 font-medium text-center sm:text-start">
                      {t.photoHint}
                    </p>

                    {/* Hidden File Inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <input
                      ref={cameraFallbackInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />

                    {/* Two Explicit Options: 1) Upload from Device, 2) Open Camera */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[58px] px-4 py-3 rounded-2xl bg-[#4A148C] hover:bg-[#380E6B] text-white font-extrabold text-base sm:text-[17px] shadow-md flex items-center justify-center gap-2.5 transition-all"
                      >
                        <Upload className="w-5 h-5 shrink-0" />
                        <span>{t.uploadFromDeviceBtn}</span>
                      </button>

                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={() => startLiveCamera("user")}
                        className="min-h-[58px] px-4 py-3 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-base sm:text-[17px] shadow-md flex items-center justify-center gap-2.5 transition-all"
                      >
                        <Camera className="w-5 h-5 shrink-0" />
                        <span>{t.openCameraBtn}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live In-Browser Camera Capture View */}
                {cameraOpen && (
                  <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-4 border-2 border-[#4A148C]">
                    <div className="relative w-full max-w-xs mx-auto aspect-square rounded-2xl overflow-hidden bg-black border-2 border-white/20">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${
                          facingMode === "user" ? "scale-x-[-1]" : ""
                        }`}
                      />
                    </div>
                    {cameraError && (
                      <p className="text-sm text-amber-300 text-center">
                        {cameraError}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleCaptureCameraFrame}
                        className="min-h-[54px] px-6 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] text-white font-extrabold text-base flex items-center gap-2 shadow-lg"
                      >
                        <Camera className="w-5 h-5" />
                        <span>{t.captureBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFlipCamera}
                        className="min-h-[54px] px-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>{t.flipCameraBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          stopCameraStream();
                          setCameraOpen(false);
                        }}
                        className="min-h-[54px] px-4 rounded-2xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>{t.cancelCameraBtn}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Identification & Contact Details (Name, Age, Email, Calling Code + Phone) */}
            <div className="space-y-5">
              <h2 className="text-lg sm:text-[21px] font-extrabold text-slate-950">
                {t.step3}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-base sm:text-[17px] font-bold text-slate-900">
                    {t.nameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full min-h-[56px] px-4 rounded-2xl bg-white border-2 border-slate-700 text-lg font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-base sm:text-[17px] font-bold text-slate-900">
                    {t.ageLabel} *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={110}
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full min-h-[56px] px-4 rounded-2xl bg-white border-2 border-slate-700 text-lg font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-base sm:text-[17px] font-bold text-slate-900">
                  {t.emailLabel} *
                </label>
                <input
                  dir="ltr"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full min-h-[56px] px-4 rounded-2xl bg-white border-2 border-slate-700 text-lg font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                />
              </div>

              {/* Country Calling Code Dropdown + Mobile Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5 space-y-1.5">
                  <label
                    htmlFor="calling-code-select"
                    className="block text-base sm:text-[17px] font-bold text-slate-900"
                  >
                    {t.callingCodeLabel} *
                  </label>
                  <select
                    id="calling-code-select"
                    dir="ltr"
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                    className="w-full min-h-[56px] px-3.5 rounded-2xl bg-white border-2 border-slate-700 text-base sm:text-[17px] font-bold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                  >
                    {COUNTRY_CALLING_CODES.map((cc) => (
                      <option key={cc.id} value={cc.code}>
                        {cc.flag}{" "}
                        {lang === "he" ? cc.countryHe : cc.countryEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-7 space-y-1.5">
                  <label
                    htmlFor="phone-national-input"
                    className="block text-base sm:text-[17px] font-bold text-slate-900"
                  >
                    {t.phoneLabel} *
                  </label>
                  <div className="flex items-center gap-2" dir="ltr">
                    <span className="min-h-[56px] px-4 rounded-2xl bg-purple-100 border-2 border-[#4A148C] text-[#4A148C] font-extrabold text-lg flex items-center justify-center shrink-0">
                      {phoneCountryCode}
                    </span>
                    <input
                      id="phone-national-input"
                      dir="ltr"
                      type="tel"
                      required
                      value={phoneNational}
                      onChange={(e) => setPhoneNational(e.target.value)}
                      placeholder={selectedCodeObj.placeholder}
                      className="w-full min-h-[56px] px-4 rounded-2xl bg-white border-2 border-slate-700 text-lg font-semibold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Country of Residence, US State Dropdown, and Automatic Time Zone */}
            <div className="space-y-5 p-4 sm:p-6 rounded-3xl bg-slate-100 border-2 border-slate-300">
              <h2 className="text-lg sm:text-[21px] font-extrabold text-slate-950">
                {t.step4Location}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Country of Residence Dropdown */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="country-select"
                    className="block text-base sm:text-[17px] font-bold text-slate-900"
                  >
                    {t.countryLabel} *
                  </label>
                  <select
                    id="country-select"
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full min-h-[56px] px-4 rounded-2xl bg-white border-2 border-slate-700 text-base sm:text-lg font-bold text-slate-950 focus:outline-none focus:border-[#4A148C]"
                  >
                    {COUNTRIES_OF_RESIDENCE.map((c) => (
                      <option key={c.name} value={c.name}>
                        {lang === "he" ? c.nameHe : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* US State Dropdown — Dynamically appears when United States is selected */}
                {country === "United States" ? (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="us-state-select"
                      className="block text-base sm:text-[17px] font-bold text-[#4A148C]"
                    >
                      {t.usStateLabel} *
                    </label>
                    <select
                      id="us-state-select"
                      value={usState}
                      onChange={(e) => {
                        setUsState(e.target.value);
                        setCity(e.target.value);
                      }}
                      className="w-full min-h-[56px] px-4 rounded-2xl bg-purple-50 border-2 border-[#4A148C] text-base sm:text-lg font-extrabold text-slate-950 focus:outline-none focus:ring-4 focus:ring-[#4A148C]/25"
                    >
                      {US_STATES.map((st) => (
                        <option key={st.code} value={st.name}>
                          {st.name} ({st.code}) — {st.tzLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-base sm:text-[17px] font-bold text-slate-900">
                      {t.cityLabel}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full min-h-[56px] px-4 rounded-2xl bg-white border-2 border-slate-700 text-base sm:text-lg font-semibold text-slate-950"
                    />
                  </div>
                )}
              </div>

              {/* Automatic Time Zone Confirmation Box */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#4A148C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#4A148C] font-extrabold text-base sm:text-[17px]">
                    <Globe2 className="w-5 h-5 text-[#FF6D00] shrink-0" />
                    <span>{t.detectedTzTitle}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-snug">
                    {t.detectedTzSub}
                  </p>
                </div>
                <div
                  dir="ltr"
                  className="px-4 py-2.5 rounded-xl bg-[#4A148C] text-white font-extrabold text-sm sm:text-base text-center shrink-0"
                >
                  <div>{resolvedTimezone}</div>
                  {nowPreview && (
                    <div className="text-xs text-amber-300 font-bold">
                      Now: {nowPreview}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-base font-bold text-slate-900">
                    {t.roleLabel}
                  </label>
                  <input
                    type="text"
                    value={formerRole}
                    onChange={(e) => setFormerRole(e.target.value)}
                    className="w-full min-h-[52px] px-4 rounded-2xl bg-white border-2 border-slate-700 text-base font-semibold text-slate-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-base font-bold text-slate-900">
                    {t.bioLabel}
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full min-h-[52px] px-4 rounded-2xl bg-white border-2 border-slate-700 text-base font-semibold text-slate-950"
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Hobbies Selection */}
            <div className="space-y-3">
              <label className="block text-lg sm:text-[21px] font-extrabold text-slate-950">
                {t.step5Hobbies}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {PREDEFINED_HOBBIES.map((hobby) => {
                  const isSelected = selectedHobbies.includes(hobby.name);
                  return (
                    <button
                      key={hobby.id}
                      type="button"
                      onClick={() => toggleHobby(hobby.name)}
                      aria-pressed={isSelected}
                      className={`min-h-[56px] px-4 py-2.5 rounded-2xl border-2 font-extrabold text-base sm:text-[17px] transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-[#4A148C] text-white border-[#4A148C] shadow-md"
                          : "bg-white text-slate-900 border-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-xl">{hobby.icon}</span>
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
                className="p-4 sm:p-5 rounded-2xl bg-red-50 border-2 border-red-800 text-red-950 text-base sm:text-[18px] font-bold flex items-start gap-3"
              >
                <AlertCircle className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full min-h-[64px] sm:min-h-[72px] px-6 rounded-2xl bg-[#FF6D00] hover:bg-[#E65100] active:scale-[0.99] text-white font-extrabold text-lg sm:text-[22px] shadow-[0_14px_34px_-6px_rgba(255,109,0,0.65)] transition-all flex items-center justify-center gap-3"
              >
                <UserCheck className="w-6 h-6 shrink-0" />
                <span>
                  {saving
                    ? t.saving
                    : role === "elderly"
                    ? t.submitElderly
                    : t.submitTeen}
                </span>
                <ForwardArrow className="w-6 h-6 shrink-0" />
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
