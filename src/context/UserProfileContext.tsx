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
  { id: "football", name: "Football / Soccer", nameHe: "כדורגל", icon: "⚽" },
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
  email?: string;
  phone?: string;
  age: number;
  country: string;
  city: string;
  formerRole: string;
  bio: string;
  avatarUrl: string;
  hobbies: string[]; // Array of hobby `name` strings
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ensureValidUuid(id?: string): string {
  if (id && UUID_REGEX.test(id)) return id;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

    // If Supabase is configured and user has an active session, sync profile from DB
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth
        .getUser()
        .then(async ({ data }) => {
          const authUser = data?.user;
          if (!authUser) return;

          const { data: dbUser } = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();

          if (dbUser) {
            const { data: dbHobbies } = await supabase
              .from("user_hobbies")
              .select("hobbies(name)")
              .eq("user_id", authUser.id);

            const hobbyNames =
              dbHobbies
                ?.map((row: any) => row.hobbies?.name)
                .filter(Boolean) || [];

            setProfile((prev) => {
              const merged: UserProfile = {
                id: dbUser.id,
                role: dbUser.role,
                fullName: dbUser.full_name,
                email: dbUser.email || authUser.email || prev?.email,
                phone: dbUser.phone || authUser.phone || prev?.phone,
                age: dbUser.age || prev?.age || 16,
                country: dbUser.country || prev?.country || "Israel",
                city: dbUser.city || prev?.city || "",
                formerRole:
                  dbUser.former_role ||
                  prev?.formerRole ||
                  (dbUser.role === "elderly"
                    ? "Native English Host"
                    : "Teen Learner"),
                bio: dbUser.bio || prev?.bio || "",
                avatarUrl:
                  prev?.avatarUrl ||
                  (dbUser.role === "elderly"
                    ? "/avatars/arthur.png"
                    : "/avatars/mateo.png"),
                hobbies:
                  hobbyNames.length > 0
                    ? hobbyNames
                    : prev?.hobbies || ["Football / Soccer"],
                contact:
                  dbUser.email ||
                  dbUser.phone ||
                  authUser.email ||
                  authUser.phone ||
                  prev?.contact,
                timezone: dbUser.timezone || "UTC",
              };
              window.localStorage.setItem(
                STORAGE_PROFILE_KEY,
                JSON.stringify(merged)
              );
              return merged;
            });
          }
        })
        .catch(() => {
          // Ignore unauthenticated session
        });
    }
  }, []);

  const saveProfile = async (newProfile: UserProfile) => {
    let finalProfile: UserProfile = {
      ...newProfile,
      id: ensureValidUuid(newProfile.id),
    };

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser?.id) {
          finalProfile.id = authUser.id;
        }

        // First try upserting with email & phone columns (from 0002 migration)
        const { error: extError } = await supabase.from("users").upsert({
          id: finalProfile.id,
          role: finalProfile.role,
          full_name: finalProfile.fullName,
          email: finalProfile.email || null,
          phone: finalProfile.phone || null,
          timezone: finalProfile.timezone,
          age: finalProfile.age,
          country: finalProfile.country,
        });

        if (extError) {
          // Fallback to base columns if 0002 migration hasn't been run yet
          await supabase.from("users").upsert({
            id: finalProfile.id,
            role: finalProfile.role,
            full_name: finalProfile.fullName,
            timezone: finalProfile.timezone,
            age: finalProfile.age,
            country: finalProfile.country,
          });
        }

        // Sync hobbies in public.user_hobbies
        const { data: allHobbies } = await supabase
          .from("hobbies")
          .select("id, name");

        if (allHobbies && allHobbies.length > 0) {
          await supabase
            .from("user_hobbies")
            .delete()
            .eq("user_id", finalProfile.id);

          const hobbyMappings = finalProfile.hobbies
            .map((hName) => {
              const match = allHobbies.find(
                (dbH) =>
                  dbH.name.toLowerCase() === hName.toLowerCase() ||
                  dbH.name.toLowerCase().includes(hName.toLowerCase())
              );
              return match
                ? { user_id: finalProfile.id, hobby_id: String(match.id) }
                : null;
            })
            .filter(
              (m): m is { user_id: string; hobby_id: string } => m !== null
            );

          if (hobbyMappings.length > 0) {
            await supabase.from("user_hobbies").insert(hobbyMappings);
          }
        }
      } catch {
        // Fallback to localStorage profile
      }
    }

    setProfile(finalProfile);
    window.localStorage.setItem(
      STORAGE_PROFILE_KEY,
      JSON.stringify(finalProfile)
    );

    if (finalProfile.role === "elderly") {
      setCustomHosts((prev) => {
        const filtered = prev.filter((h) => h.id !== finalProfile.id);
        const updated = [finalProfile, ...filtered];
        window.localStorage.setItem(STORAGE_HOSTS_KEY, JSON.stringify(updated));
        return updated;
      });
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
    throw new Error(
      "useUserProfile must be used inside a UserProfileProvider"
    );
  }
  return ctx;
}
