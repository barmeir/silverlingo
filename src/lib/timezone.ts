/**
 * Timezone utilities for SilverLingo.
 * All dates/times are saved in the database in UTC, and displayed
 * to the user in their local browser timezone.
 */

export interface UTCSlotRecord {
  day_of_week: number; // 0 (Sun) - 6 (Sat) in UTC
  start_time: string;  // "HH:mm:00" in UTC
  end_time: string;    // "HH:mm:00" in UTC
}

/**
 * Formats a 24-hour time string ("14:30") into 12-hour format ("2:30 PM").
 */
export function format12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${suffix}`;
}

/**
 * Converts a local (dayOfWeek, "HH:mm") 30-minute slot into its corresponding
 * UTC (day_of_week, start_time, end_time) record for Supabase storage.
 */
export function localSlotToUTC(
  localDay: number,
  localTime24: string
): UTCSlotRecord {
  const [hours, minutes] = localTime24.split(":").map(Number);

  // Reference Sunday: Jan 4, 2026
  const refDate = new Date(2026, 0, 4 + localDay, hours, minutes, 0, 0);
  const endDate = new Date(refDate.getTime() + 30 * 60 * 1000);

  const utcDay = refDate.getUTCDay();
  const utcStart = `${String(refDate.getUTCHours()).padStart(2, "0")}:${String(
    refDate.getUTCMinutes()
  ).padStart(2, "0")}:00`;
  const utcEnd = `${String(endDate.getUTCHours()).padStart(2, "0")}:${String(
    endDate.getUTCMinutes()
  ).padStart(2, "0")}:00`;

  return {
    day_of_week: utcDay,
    start_time: utcStart,
    end_time: utcEnd,
  };
}

/**
 * Converts a stored UTC (day_of_week, "HH:mm:ss") back into the user's Local slot key ("dayIndex-HH:mm").
 */
export function utcSlotToLocalKey(
  utcDay: number,
  utcStartTime: string
): string {
  const [hours, minutes] = utcStartTime.split(":").map(Number);
  const refUTC = new Date(Date.UTC(2026, 0, 4 + utcDay, hours, minutes, 0));

  const localDay = refUTC.getDay();
  const localHH = String(refUTC.getHours()).padStart(2, "0");
  const localMM = String(refUTC.getMinutes()).padStart(2, "0");

  return `${localDay}-${localHH}:${localMM}`;
}

/**
 * Formats an ISO UTC timestamp into the user's local browser timezone.
 */
export function formatUTCToLocalDisplay(utcIsoString: string): string {
  const date = new Date(utcIsoString);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
