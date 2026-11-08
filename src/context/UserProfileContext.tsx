"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { resolveTimezoneForLocation } from "@/lib/location-timezone";
import {
  logNotificationsToSupabase,
  resolveParticipantsFromDB,
  type DispatchedNotificationRecord,
} from "@/lib/notifications";

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
    id: "basketball",
    name: "Basketball & NBA",
    nameHe: "כדורסל ו-NBA",
    icon: "🏀",
  },
  {
    id: "tennis",
    name: "Tennis & Pickleball",
    nameHe: "טניס ופאדל",
    icon: "🎾",
  },
  {
    id: "marvel",
    name: "Classic Movies & Marvel",
    nameHe: "קולנוע ומארוול",
    icon: "🎬",
  },
  {
    id: "tv-anime",
    name: "TV Shows & Anime",
    nameHe: "סדרות טלוויזיה ואנימה",
    icon: "📺",
  },
  { id: "music", name: "Music & Vinyl", nameHe: "מוזיקה ותקליטים", icon: "🎸" },
  {
    id: "instruments",
    name: "Playing Musical Instruments",
    nameHe: "נגינה על כלי נגינה",
    icon: "🎹",
  },
  {
    id: "baking",
    name: "Baking & Cooking",
    nameHe: "אפייה ובישול",
    icon: "🥐",
  },
  {
    id: "coffee",
    name: "Coffee, Tea & Cafes",
    nameHe: "קפה, תה ובתי קפה",
    icon: "☕",
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
  {
    id: "gaming",
    name: "Video Games & Gaming",
    nameHe: "משחקי וידאו וגיימינג",
    icon: "🎮",
  },
  { id: "gardening", name: "Gardening", nameHe: "גינון וצמחים", icon: "🌻" },
  {
    id: "travel",
    name: "Travel Stories",
    nameHe: "סיפורי טיולים",
    icon: "✈️",
  },
  {
    id: "books",
    name: "Books & Literature",
    nameHe: "ספרים וקריאה",
    icon: "📚",
  },
  {
    id: "pets",
    name: "Dogs, Cats & Pets",
    nameHe: "כלבים, חתולים וחיות מחמד",
    icon: "🐶",
  },
  {
    id: "photography",
    name: "Photography & Art",
    nameHe: "צילום ואמנות",
    icon: "📷",
  },
  {
    id: "painting",
    name: "Painting, Drawing & Crafts",
    nameHe: "ציור, איור ויצירה",
    icon: "🎨",
  },
  {
    id: "science",
    name: "Science, Space & Astronomy",
    nameHe: "מדע, חלל ואסטרונומיה",
    icon: "🔬",
  },
  {
    id: "tech",
    name: "Technology & AI",
    nameHe: "טכנולוגיה ו-AI",
    icon: "💻",
  },
  {
    id: "hiking",
    name: "Hiking, Camping & Nature",
    nameHe: "טיולי טבע וקמפינג",
    icon: "🥾",
  },
  {
    id: "fitness",
    name: "Fitness, Running & Yoga",
    nameHe: "כושר, ריצה ויוגה",
    icon: "🏃",
  },
  {
    id: "cars",
    name: "Classic Cars & Motorsports",
    nameHe: "רכבי אספנות וספורט מוטורי",
    icon: "🚗",
  },
  {
    id: "theater",
    name: "Theater, Comedy & Podcasts",
    nameHe: "תיאטרון, קומדיה ופודקאסטים",
    icon: "🎭",
  },
];

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string;
  email?: string;
  phoneCountryCode?: string;
  phoneNational?: string;
  phone?: string;
  age: number;
  country: string;
  usState?: string;
  city: string;
  formerRole: string;
  bio: string;
  avatarUrl: string;
  hobbies: string[];
  contact?: string;
  timezone: string;
}

export interface ScheduledMeeting {
  id: string;
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
  learnerAvatar: string;
  scheduledStartUTC: string;
  scheduledEndUTC: string;
  googleMeetLink: string;
  aiIcebreaker: string;
  status: "scheduled" | "cancelled";
  updatedAt: string;
}

interface UserProfileContextValue {
  profile: UserProfile | null;
  customHosts: UserProfile[];
  meetings: ScheduledMeeting[];
  notifications: DispatchedNotificationRecord[];
  saveProfile: (newProfile: UserProfile) => Promise<UserProfile>;
  identifyExistingUser: (params: {
    email?: string;
    phoneE164?: string;
  }) => Promise<UserProfile | null>;
  recordMeetingBooked: (meeting: ScheduledMeeting) => Promise<void>;
  rescheduleMeeting: (
    meetingId: string,
    newScheduledStartUTC: string
  ) => Promise<ScheduledMeeting | null>;
  cancelMeeting: (meetingId: string) => Promise<ScheduledMeeting | null>;
  clearProfile: () => void;
}

const STORAGE_PROFILE_KEY = "silverlingo_user_profile";
const STORAGE_ACCOUNTS_KEY = "silverlingo_registered_accounts";
const STORAGE_HOSTS_KEY = "silverlingo_custom_hosts";
const STORAGE_MEETINGS_KEY = "silverlingo_scheduled_meetings";
const STORAGE_NOTIFS_KEY = "silverlingo_notification_log";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ensureValidUuid(id?: string): string {
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
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [notifications, setNotifications] = useState<
    DispatchedNotificationRecord[]
  >([]);

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
      const savedMeetings = window.localStorage.getItem(STORAGE_MEETINGS_KEY);
      if (savedMeetings) {
        setMeetings(JSON.parse(savedMeetings));
      }
      const savedNotifs = window.localStorage.getItem(STORAGE_NOTIFS_KEY);
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }
    } catch {
      // Ignore storage parse errors
    }

    if (isSupabaseConfigured()) {
      const supabase = createClient();

      // Fetch any Senior Hosts registered in Supabase public.users
      supabase
        .from("users")
        .select("*")
        .eq("role", "elderly")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data: dbHosts }) => {
          if (dbHosts && dbHosts.length > 0) {
            setCustomHosts((prev) => {
              const byId = new Map<string, UserProfile>();
              prev.forEach((h) => byId.set(h.id, h));
              dbHosts.forEach((row: any) => {
                if (!byId.has(row.id)) {
                  byId.set(row.id, {
                    id: row.id,
                    role: "elderly",
                    fullName: row.full_name,
                    email: row.email || undefined,
                    phone: row.phone || undefined,
                    age: row.age || 72,
                    country: row.country || "United States",
                    city: row.city || "New York",
                    formerRole: row.former_role || "Native English Speaker",
                    bio:
                      row.bio ||
                      "Excited to chat with learners over shared hobbies!",
                    avatarUrl: row.avatar_url || "/avatars/arthur.png",
                    hobbies: ["Football / Soccer", "Classic Movies & Marvel"],
                    timezone: row.timezone || "America/New_York",
                  });
                }
              });
              const merged = Array.from(byId.values());
              window.localStorage.setItem(
                STORAGE_HOSTS_KEY,
                JSON.stringify(merged)
              );
              return merged;
            });
          }
        }, () => {});

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
                phoneCountryCode: prev?.phoneCountryCode || "+1",
                phoneNational: prev?.phoneNational || "",
                age: dbUser.age || prev?.age || 16,
                country: dbUser.country || prev?.country || "United States",
                usState: prev?.usState,
                city: dbUser.city || prev?.city || "",
                formerRole:
                  dbUser.former_role ||
                  prev?.formerRole ||
                  (dbUser.role === "elderly"
                    ? "Native English Host"
                    : "Teen Learner"),
                bio: dbUser.bio || prev?.bio || "",
                avatarUrl:
                  dbUser.avatar_url ||
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
                timezone:
                  dbUser.timezone ||
                  resolveTimezoneForLocation(
                    dbUser.country || "United States",
                    prev?.usState
                  ),
              };
              window.localStorage.setItem(
                STORAGE_PROFILE_KEY,
                JSON.stringify(merged)
              );
              return merged;
            });
          }
        }, () => {});
    }
  }, []);

  const saveProfile = async (newProfile: UserProfile): Promise<UserProfile> => {
    const computedTz = resolveTimezoneForLocation(
      newProfile.country,
      newProfile.usState
    );

    let finalProfile: UserProfile = {
      ...newProfile,
      id: ensureValidUuid(newProfile.id),
      timezone: computedTz,
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

        const { error: extError } = await supabase.from("users").upsert({
          id: finalProfile.id,
          role: finalProfile.role,
          full_name: finalProfile.fullName,
          email: finalProfile.email || null,
          phone: finalProfile.phone || null,
          timezone: finalProfile.timezone,
          age: finalProfile.age,
          country: finalProfile.country,
          city: finalProfile.usState
            ? `${finalProfile.city}, ${finalProfile.usState}`
            : finalProfile.city,
          former_role: finalProfile.formerRole,
          bio: finalProfile.bio,
          avatar_url: finalProfile.avatarUrl.startsWith("data:")
            ? "/avatars/mateo.png"
            : finalProfile.avatarUrl,
        });

        if (extError) {
          await supabase.from("users").upsert({
            id: finalProfile.id,
            role: finalProfile.role,
            full_name: finalProfile.fullName,
            timezone: finalProfile.timezone,
            age: finalProfile.age,
            country: finalProfile.country,
          });
        }

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

    // Also persist in registered accounts list so user can Sign Out and Sign In again by email/phone
    try {
      const existingRaw = window.localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      const existingAccounts: UserProfile[] = existingRaw
        ? JSON.parse(existingRaw)
        : [];
      const filteredAccounts = existingAccounts.filter(
        (acc) =>
          acc.id !== finalProfile.id &&
          (!finalProfile.email ||
            acc.email?.toLowerCase() !== finalProfile.email.toLowerCase()) &&
          (!finalProfile.phone || acc.phone !== finalProfile.phone)
      );
      const updatedAccounts = [finalProfile, ...filteredAccounts];
      window.localStorage.setItem(
        STORAGE_ACCOUNTS_KEY,
        JSON.stringify(updatedAccounts)
      );
    } catch {}

    if (finalProfile.role === "elderly") {
      setCustomHosts((prev) => {
        const filtered = prev.filter((h) => h.id !== finalProfile.id);
        const updated = [finalProfile, ...filtered];
        window.localStorage.setItem(STORAGE_HOSTS_KEY, JSON.stringify(updated));
        return updated;
      });
    }

    return finalProfile;
  };

  const identifyExistingUser = async (params: {
    email?: string;
    phoneE164?: string;
  }): Promise<UserProfile | null> => {
    const cleanEmail = params.email?.trim().toLowerCase();
    const cleanPhone = params.phoneE164?.trim();

    // 1. Check active profile first
    if (profile) {
      if (
        (cleanEmail && profile.email?.toLowerCase() === cleanEmail) ||
        (cleanPhone && profile.phone === cleanPhone)
      ) {
        return profile;
      }
    }

    // 2. Check registered accounts & customHosts in localStorage (preserves uploaded camera/device photo after Sign Out)
    try {
      const accountsRaw = window.localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      const storedAccounts: UserProfile[] = accountsRaw
        ? JSON.parse(accountsRaw)
        : [];
      const allLocalPool = [...storedAccounts, ...customHosts];
      const matchedLocal = allLocalPool.find(
        (acc) =>
          (cleanEmail && acc.email?.toLowerCase() === cleanEmail) ||
          (cleanPhone && acc.phone === cleanPhone)
      );
      if (matchedLocal) {
        setProfile(matchedLocal);
        window.localStorage.setItem(
          STORAGE_PROFILE_KEY,
          JSON.stringify(matchedLocal)
        );
        return matchedLocal;
      }
    } catch {}

    // 3. Check Supabase public.users
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase.from("users").select("*");
        if (cleanEmail) {
          query = query.ilike("email", cleanEmail);
        } else if (cleanPhone) {
          query = query.eq("phone", cleanPhone);
        }

        const { data: foundUsers } = await query.limit(1);
        const dbUser = foundUsers?.[0];
        if (dbUser) {
          const { data: dbHobbies } = await supabase
            .from("user_hobbies")
            .select("hobbies(name)")
            .eq("user_id", dbUser.id);

          const hobbyNames =
            dbHobbies?.map((r: any) => r.hobbies?.name).filter(Boolean) || [];

          const loadedProfile: UserProfile = {
            id: dbUser.id,
            role: dbUser.role,
            fullName: dbUser.full_name,
            email: dbUser.email || cleanEmail,
            phone: dbUser.phone || cleanPhone,
            age: dbUser.age || 18,
            country: dbUser.country || "United States",
            city: dbUser.city || "New York",
            formerRole:
              dbUser.former_role ||
              (dbUser.role === "elderly"
                ? "Native English Host"
                : "Teen Learner"),
            bio: dbUser.bio || "",
            avatarUrl:
              dbUser.avatar_url ||
              (dbUser.role === "elderly"
                ? "/avatars/arthur.png"
                : "/avatars/mateo.png"),
            hobbies:
              hobbyNames.length > 0 ? hobbyNames : ["Football / Soccer"],
            contact: dbUser.email || dbUser.phone,
            timezone: dbUser.timezone || "America/New_York",
          };

          setProfile(loadedProfile);
          window.localStorage.setItem(
            STORAGE_PROFILE_KEY,
            JSON.stringify(loadedProfile)
          );
          return loadedProfile;
        }
      } catch {
        // Ignore if email/phone columns not yet added
      }
    }

    return null;
  };

  const recordMeetingBooked = async (meeting: ScheduledMeeting) => {
    setMeetings((prev) => {
      const filtered = prev.filter((m) => m.id !== meeting.id);
      const updated = [meeting, ...filtered];
      window.localStorage.setItem(
        STORAGE_MEETINGS_KEY,
        JSON.stringify(updated)
      );
      return updated;
    });

    try {
      const savedRaw = window.localStorage.getItem(STORAGE_NOTIFS_KEY);
      if (savedRaw) {
        setNotifications(JSON.parse(savedRaw));
      }
    } catch {}
  };

  const rescheduleMeeting = async (
    meetingId: string,
    newScheduledStartUTC: string
  ): Promise<ScheduledMeeting | null> => {
    const target = meetings.find((m) => m.id === meetingId);
    if (!target) return null;

    const startDate = new Date(newScheduledStartUTC);
    if (isNaN(startDate.getTime())) return null;
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    const updatedMeeting: ScheduledMeeting = {
      ...target,
      scheduledStartUTC: startDate.toISOString(),
      scheduledEndUTC: endDate.toISOString(),
      status: "scheduled",
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && UUID_REGEX.test(meetingId)) {
      try {
        const supabase = createClient();
        await supabase
          .from("meetings")
          .update({
            scheduled_start: updatedMeeting.scheduledStartUTC,
            scheduled_end: updatedMeeting.scheduledEndUTC,
            status: "scheduled",
          })
          .eq("id", meetingId);
      } catch {}
    }

    const participants = await resolveParticipantsFromDB({
      hostId: updatedMeeting.hostId,
      hostName: updatedMeeting.hostName,
      hostEmail: updatedMeeting.hostEmail,
      hostPhone: updatedMeeting.hostPhone,
      hostTimezone: updatedMeeting.hostTimezone,
      learnerId: updatedMeeting.learnerId,
      learnerName: updatedMeeting.learnerName,
      learnerEmail: updatedMeeting.learnerEmail,
      learnerPhone: updatedMeeting.learnerPhone,
      learnerTimezone: updatedMeeting.learnerTimezone,
    });

    const newNotifs = await logNotificationsToSupabase({
      meetingId: updatedMeeting.id,
      eventType: "changed",
      host: participants.host,
      learner: participants.learner,
      scheduledStartUTC: updatedMeeting.scheduledStartUTC,
      googleMeetLink: updatedMeeting.googleMeetLink,
      aiIcebreaker: updatedMeeting.aiIcebreaker,
    });

    setNotifications((prev) => [...newNotifs, ...prev].slice(0, 40));
    setMeetings((prev) => {
      const next = prev.map((m) => (m.id === meetingId ? updatedMeeting : m));
      window.localStorage.setItem(STORAGE_MEETINGS_KEY, JSON.stringify(next));
      return next;
    });

    return updatedMeeting;
  };

  const cancelMeeting = async (
    meetingId: string
  ): Promise<ScheduledMeeting | null> => {
    const target = meetings.find((m) => m.id === meetingId);
    if (!target) return null;

    const canceledMeeting: ScheduledMeeting = {
      ...target,
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && UUID_REGEX.test(meetingId)) {
      try {
        const supabase = createClient();
        await supabase
          .from("meetings")
          .update({ status: "cancelled" })
          .eq("id", meetingId);
      } catch {}
    }

    const participants = await resolveParticipantsFromDB({
      hostId: canceledMeeting.hostId,
      hostName: canceledMeeting.hostName,
      hostEmail: canceledMeeting.hostEmail,
      hostPhone: canceledMeeting.hostPhone,
      hostTimezone: canceledMeeting.hostTimezone,
      learnerId: canceledMeeting.learnerId,
      learnerName: canceledMeeting.learnerName,
      learnerEmail: canceledMeeting.learnerEmail,
      learnerPhone: canceledMeeting.learnerPhone,
      learnerTimezone: canceledMeeting.learnerTimezone,
    });

    const newNotifs = await logNotificationsToSupabase({
      meetingId: canceledMeeting.id,
      eventType: "canceled",
      host: participants.host,
      learner: participants.learner,
      scheduledStartUTC: canceledMeeting.scheduledStartUTC,
      googleMeetLink: canceledMeeting.googleMeetLink,
      aiIcebreaker: canceledMeeting.aiIcebreaker,
    });

    setNotifications((prev) => [...newNotifs, ...prev].slice(0, 40));
    setMeetings((prev) => {
      const next = prev.map((m) => (m.id === meetingId ? canceledMeeting : m));
      window.localStorage.setItem(STORAGE_MEETINGS_KEY, JSON.stringify(next));
      return next;
    });

    return canceledMeeting;
  };

  const clearProfile = () => {
    setProfile(null);
    window.localStorage.removeItem(STORAGE_PROFILE_KEY);
  };

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        customHosts,
        meetings,
        notifications,
        saveProfile,
        identifyExistingUser,
        recordMeetingBooked,
        rescheduleMeeting,
        cancelMeeting,
        clearProfile,
      }}
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
