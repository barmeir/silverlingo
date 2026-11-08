"use client";

import React, { useEffect, useState } from "react";
import AvailabilityCalendar from "@/components/elderly/AvailabilityCalendar";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useUserProfile } from "@/context/UserProfileContext";

export default function ElderlyAvailabilityPage() {
  const { profile } = useUserProfile();
  const [hostId, setHostId] = useState("00000000-0000-0000-0000-000000000001");

  useEffect(() => {
    if (profile?.id) {
      setHostId(profile.id);
      return;
    }
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data?.user?.id) {
          setHostId(data.user.id);
        }
      })
      .catch(() => {
        // Keep demo UUID fallback
      });
  }, [profile?.id]);

  return <AvailabilityCalendar hostId={profile?.id || hostId} />;
}
