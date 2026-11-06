/**
 * Timezone utilities for SilverLingo.
 * All dates/times are saved in the database in UTC, and converted
 * to each participant's registered IANA timezone (with full DST support).
 */

export interface UTCSlotRecord {
  day_of_week: number; // 0 (Sun) - 6 (Sat) in UTC
  start_time: string; // "HH:mm:00" in UTC
  end_time: string; // "HH:mm:00" in UTC
}

export interface FormattedZonedDateTime {
  dateLabel: string; // e.g., "Fri, Nov 6, 2026"
  dayShortLabel: string; // e.g., "Fri, Nov 6"
  timeLabel: string; // e.g., "7:00 AM"
  tzAbbrev: string; // e.g., "PST", "EDT", "IST"
  timeWithTz: string; // e.g., "7:00 AM PST"
  fullDisplay: string; // e.g., "Fri, Nov 6, 2026 • 7:00 AM PST"
  timeZone: string;
}

export function safeTimeZone(tz?: string): string {
  if (!tz || tz === "Local Time") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
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
 * Extracts the short timezone abbreviation (e.g. EST, EDT, PST, PDT, IST, IDT, GMT)
 * for a specific Date in an IANA timeZone (automatically accounts for Daylight Saving Time).
 */
export function getTimeZoneAbbreviation(
  date: Date,
  timeZone?: string
): string {
  const validTz = safeTimeZone(timeZone);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: validTz,
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || validTz;
  } catch {
    return validTz;
  }
}

/**
 * Given a wall-clock date/time in a specific IANA timeZone (e.g., 10:00 AM in "America/New_York"),
 * returns the exact UTC ISO string, accurately accounting for Daylight Saving Time (DST) on that date.
 */
export function wallTimeInZoneToUTC(
  year: number,
  monthZeroIndexed: number,
  day: number,
  hour24: number,
  minute: number,
  timeZone: string
): Date {
  const validTz = safeTimeZone(timeZone);
  const approxUTC = new Date(
    Date.UTC(year, monthZeroIndexed, day, hour24, minute, 0, 0)
  );

  // Measure the offset of validTz at approxUTC
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: validTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const getOffsetMs = (d: Date) => {
    const parts = fmt.formatToParts(d);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== "literal") map[p.type] = parseInt(p.value, 10);
    }
    const hourVal = map.hour === 24 ? 0 : map.hour;
    const zonedAsUTC = Date.UTC(
      map.year,
      (map.month || 1) - 1,
      map.day || 1,
      hourVal || 0,
      map.minute || 0,
      map.second || 0
    );
    return zonedAsUTC - d.getTime();
  };

  const firstOffset = getOffsetMs(approxUTC);
  const firstCandidate = new Date(approxUTC.getTime() - firstOffset);
  // Re-evaluate offset at candidate in case we crossed a DST boundary
  const secondOffset = getOffsetMs(firstCandidate);
  return new Date(approxUTC.getTime() - secondOffset);
}

/**
 * Creates a future UTC ISO timestamp for the next occurrence (or today) of `hour24:minute`
 * in the specified `hostTimeZone`.
 * For example, 10:00 AM in "America/New_York" -> 7:00 AM in "America/Los_Angeles".
 */
export function nextWallTimeInZoneToUTCISO(
  daysAhead: number,
  hour24: number,
  minute: number,
  hostTimeZone: string
): string {
  const validTz = safeTimeZone(hostTimeZone);
  const target = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: validTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(target);

  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = parseInt(p.value, 10);
  }

  return wallTimeInZoneToUTC(
    map.year || target.getUTCFullYear(),
    (map.month || target.getUTCMonth() + 1) - 1,
    map.day || target.getUTCDate(),
    hour24,
    minute,
    validTz
  ).toISOString();
}

/**
 * Formats an ISO UTC timestamp into a specific IANA `timeZone` with date, local time, and TZ abbreviation.
 */
export function formatUTCInZone(
  utcIsoString: string,
  timeZone?: string,
  lang: "en" | "he" = "en"
): FormattedZonedDateTime {
  const date = new Date(utcIsoString);
  const validTz = safeTimeZone(timeZone);
  const locale = lang === "he" ? "he-IL" : "en-US";

  if (isNaN(date.getTime())) {
    return {
      dateLabel: "Invalid Date",
      dayShortLabel: "Invalid Date",
      timeLabel: "--:--",
      tzAbbrev: "UTC",
      timeWithTz: "--:-- UTC",
      fullDisplay: "Invalid Date",
      timeZone: validTz,
    };
  }

  const dateLabel = new Intl.DateTimeFormat(locale, {
    timeZone: validTz,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  const dayShortLabel = new Intl.DateTimeFormat(locale, {
    timeZone: validTz,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: validTz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  const tzAbbrev = getTimeZoneAbbreviation(date, validTz);
  const timeWithTz = `${timeLabel} ${tzAbbrev}`;
  const fullDisplay = `${dateLabel} • ${timeWithTz}`;

  return {
    dateLabel,
    dayShortLabel,
    timeLabel,
    tzAbbrev,
    timeWithTz,
    fullDisplay,
    timeZone: validTz,
  };
}

/**
 * Converts a local (dayOfWeek, "HH:mm") 30-minute slot in `timeZone` into its corresponding
 * UTC (day_of_week, start_time, end_time) record for Supabase storage.
 */
export function localSlotToUTC(
  localDay: number,
  localTime24: string,
  timeZone?: string
): UTCSlotRecord {
  const [hours, minutes] = localTime24.split(":").map(Number);
  const validTz = safeTimeZone(timeZone);

  // Reference Sunday: Jan 4, 2026
  const refDate = wallTimeInZoneToUTC(
    2026,
    0,
    4 + localDay,
    hours,
    minutes,
    validTz
  );
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
 * Converts a stored UTC (day_of_week, "HH:mm:ss") back into the user's Local slot key ("dayIndex-HH:mm")
 * in `timeZone`.
 */
export function utcSlotToLocalKey(
  utcDay: number,
  utcStartTime: string,
  timeZone?: string
): string {
  const [hours, minutes] = utcStartTime.split(":").map(Number);
  const refUTC = new Date(Date.UTC(2026, 0, 4 + utcDay, hours, minutes, 0));
  const validTz = safeTimeZone(timeZone);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: validTz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(refUTC);

  const weekdayStr = parts.find((p) => p.type === "weekday")?.value || "Sun";
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const localDay = dayMap[weekdayStr] ?? refUTC.getDay();
  let localHH = parts.find((p) => p.type === "hour")?.value || "09";
  if (localHH === "24") localHH = "00";
  const localMM = parts.find((p) => p.type === "minute")?.value || "00";

  return `${localDay}-${localHH.padStart(2, "0")}:${localMM.padStart(2, "0")}`;
}

/**
 * Formats an ISO UTC timestamp into the user's specified (or browser) timezone.
 */
export function formatUTCToLocalDisplay(
  utcIsoString: string,
  timeZone?: string,
  lang: "en" | "he" = "en"
): string {
  return formatUTCInZone(utcIsoString, timeZone, lang).fullDisplay;
}
