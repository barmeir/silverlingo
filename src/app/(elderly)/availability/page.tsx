import React from "react";
import AvailabilityCalendar from "@/components/elderly/AvailabilityCalendar";
import { createClient } from "@/lib/supabase/server";

export default async function ElderlyAvailabilityPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fallback demo UUID when previewing before Supabase Auth is connected
  const hostId = user?.id ?? "00000000-0000-0000-0000-000000000001";

  return <AvailabilityCalendar hostId={hostId} />;
}
