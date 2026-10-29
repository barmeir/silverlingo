"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type UserRole = "elderly" | "teen";

export interface HobbyOption {
  id: string;
  name: string;
  nameHe: string;
  icon: string;
}

export const PREDEFINED_HOBBIES: HobbyOption[] = [
  { id: "football", name: "Football", nameHe: "כדורגל", icon: "⚽" },
  {
    id: "marvel",
    name: "Classic Movies & Marvel",
    nameHe: "קולנוע ומארוול",
    icon: "🎬",
  },
  { id: "music", name: "Music & Vinyl", nameHe: "מוזיקה ותקליטים", icon: "🎸" },
  {
    id: "baking",
    name: "Baking & Cooking",
    nameHe: "אפייה ובישול",
    icon: "🥐",
  },
  {
    id: "history",
    name: "World History",
    nameHe: "היסטוריה עולמית",
    icon: "🏛️",
  },
  {
    id: "chess",
    name: "Board Games & Chess",
    nameHe: "שחמט ומשחקי קופסה",
    icon: "♟️",
  },
  { id: "gardening", name: "Gardening", nameHe: "גינון", icon: "🌻" },
  {
    id: "travel",
    name: "Travel Stories",
    nameHe: "סיפורי טיולים",
    icon: "✈️",
  },
];

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string;
  age: number;
  country: string;
  city: string;
  formerRole: string;
  bio: string;
  avatarUrl: string;
  hobbies: string[]; // Array of hobby `name` strings (e.g. ["Football", "Music & Vinyl"])
  contact?: string;
  timezone: string;
}

interface UserProfileContextValue {
  profile: UserProfile | null;
  customHosts: UserProfile[];
  saveProfile: (newProfile: UserProfile) => Promise<void>;
  clearProfile: () => void;
}

const STORAGE_PROFILE_KEY = "silverlingo_user_profile";
const STORAGE_HOSTS_KEY = "silverlingo_custom_hosts";

const UserProfileContext = createContext<UserProfileContextValue | undefined>(
  undefined
);

export function UserProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [customHosts, setCustomHosts] = useState<UserProfile[]>([]);

  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem(STORAGE_PROFILE_KEY);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
      const savedHosts = window.localStorage.getItem(STORAGE_HOSTS_KEY);
      if (savedHosts) {
        setCustomHosts(JSON.parse(savedHosts));
      }
    } catch {
      // Ignore storage parse errors
    }
  }, []);

  const saveProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    window.localStorage.setItem(
      STORAGE_PROFILE_KEY,
      JSON.stringify(newProfile)
    );

    if (newProfile.role === "elderly") {
      setCustomHosts((prev) => {
        const filtered = prev.filter((h) => h.id !== newProfile.id);
        const updated = [newProfile, ...filtered];
        window.localStorage.setItem(STORAGE_HOSTS_KEY, JSON.stringify(updated));
        return updated;
      });
    }

    // Also persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from("users").upsert({
          id: newProfile.id,
          role: newProfile.role,
          full_name: newProfile.fullName,
          timezone: newProfile.timezone,
          age: newProfile.age,
          country: newProfile.country,
        });
      } catch {
        // Fallback to localStorage profile
      }
    }
  };

  const clearProfile = () => {
    setProfile(null);
    window.localStorage.removeItem(STORAGE_PROFILE_KEY);
  };

  return (
    <UserProfileContext.Provider
      value={{ profile, customHosts, saveProfile, clearProfile }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return ctx;
}
