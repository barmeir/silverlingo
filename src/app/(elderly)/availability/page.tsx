"use client";

import React, { useEffect, useState } from "react";
import AvailabilityCalendar from "@/components/elderly/AvailabilityCalendar";
import { createClient } from "@/lib/supabase/client";

export default function ElderlyAvailabilityPage() {
  const [hostId, setHostId] = useState("00000000-0000-0000-0000-000000000001");

  useEffect(() => {
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
  }, []);

  return <AvailabilityCalendar hostId={hostId} />;
}
