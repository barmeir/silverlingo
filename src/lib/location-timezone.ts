export interface CallingCodeOption {
  id: string;
  code: string;
  countryEn: string;
  countryHe: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
}

export const COUNTRY_CALLING_CODES: CallingCodeOption[] = [
  {
    id: "US",
    code: "+1",
    countryEn: "United States / Canada (+1)",
    countryHe: "ארה״ב / קנדה (+1)",
    flag: "🇺🇸",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "212-555-0147",
  },
  {
    id: "IL",
    code: "+972",
    countryEn: "Israel (+972)",
    countryHe: "ישראל (+972)",
    flag: "🇮🇱",
    minDigits: 8,
    maxDigits: 9,
    placeholder: "50-123-4567",
  },
  {
    id: "GB",
    code: "+44",
    countryEn: "United Kingdom (+44)",
    countryHe: "בריטניה (+44)",
    flag: "🇬🇧",
    minDigits: 9,
    maxDigits: 10,
    placeholder: "7700-900077",
  },
  {
    id: "AU",
    code: "+61",
    countryEn: "Australia (+61)",
    countryHe: "אוסטרליה (+61)",
    flag: "🇦🇺",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "412-345-678",
  },
  {
    id: "DE",
    code: "+49",
    countryEn: "Germany (+49)",
    countryHe: "גרמניה (+49)",
    flag: "🇩🇪",
    minDigits: 9,
    maxDigits: 11,
    placeholder: "1512-3456789",
  },
  {
    id: "FR",
    code: "+33",
    countryEn: "France (+33)",
    countryHe: "צרפת (+33)",
    flag: "🇫🇷",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "6-12-34-56-78",
  },
  {
    id: "ES",
    code: "+34",
    countryEn: "Spain (+34)",
    countryHe: "ספרד (+34)",
    flag: "🇪🇸",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "612-345-678",
  },
  {
    id: "IT",
    code: "+39",
    countryEn: "Italy (+39)",
    countryHe: "איטליה (+39)",
    flag: "🇮🇹",
    minDigits: 9,
    maxDigits: 10,
    placeholder: "312-345-6789",
  },
  {
    id: "BR",
    code: "+55",
    countryEn: "Brazil (+55)",
    countryHe: "ברזיל (+55)",
    flag: "🇧🇷",
    minDigits: 10,
    maxDigits: 11,
    placeholder: "11-91234-5678",
  },
  {
    id: "MX",
    code: "+52",
    countryEn: "Mexico (+52)",
    countryHe: "מקסיקו (+52)",
    flag: "🇲🇽",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "55-1234-5678",
  },
  {
    id: "AR",
    code: "+54",
    countryEn: "Argentina (+54)",
    countryHe: "ארגנטינה (+54)",
    flag: "🇦🇷",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "911-1234-5678",
  },
  {
    id: "IN",
    code: "+91",
    countryEn: "India (+91)",
    countryHe: "הודו (+91)",
    flag: "🇮🇳",
    minDigits: 10,
    maxDigits: 10,
    placeholder: "98765-43210",
  },
  {
    id: "JP",
    code: "+81",
    countryEn: "Japan (+81)",
    countryHe: "יפן (+81)",
    flag: "🇯🇵",
    minDigits: 9,
    maxDigits: 10,
    placeholder: "90-1234-5678",
  },
  {
    id: "KR",
    code: "+82",
    countryEn: "South Korea (+82)",
    countryHe: "דרום קוריאה (+82)",
    flag: "🇰🇷",
    minDigits: 9,
    maxDigits: 10,
    placeholder: "10-1234-5678",
  },
  {
    id: "NL",
    code: "+31",
    countryEn: "Netherlands (+31)",
    countryHe: "הולנד (+31)",
    flag: "🇳🇱",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "6-12345678",
  },
  {
    id: "CH",
    code: "+41",
    countryEn: "Switzerland (+41)",
    countryHe: "שווייץ (+41)",
    flag: "🇨🇭",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "78-123-45-67",
  },
  {
    id: "SE",
    code: "+46",
    countryEn: "Sweden (+46)",
    countryHe: "שוודיה (+46)",
    flag: "🇸🇪",
    minDigits: 7,
    maxDigits: 10,
    placeholder: "70-123-45-67",
  },
  {
    id: "PL",
    code: "+48",
    countryEn: "Poland (+48)",
    countryHe: "פולין (+48)",
    flag: "🇵🇱",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "512-345-678",
  },
  {
    id: "ZA",
    code: "+27",
    countryEn: "South Africa (+27)",
    countryHe: "דרום אפריקה (+27)",
    flag: "🇿🇦",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "82-123-4567",
  },
  {
    id: "NZ",
    code: "+64",
    countryEn: "New Zealand (+64)",
    countryHe: "ניו זילנד (+64)",
    flag: "🇳🇿",
    minDigits: 8,
    maxDigits: 9,
    placeholder: "21-123-4567",
  },
  {
    id: "AE",
    code: "+971",
    countryEn: "UAE (+971)",
    countryHe: "איחוד האמירויות (+971)",
    flag: "🇦🇪",
    minDigits: 9,
    maxDigits: 9,
    placeholder: "50-123-4567",
  },
];

export interface CountryOption {
  name: string;
  nameHe: string;
  defaultCallingCode: string;
  defaultTimezone: string;
}

export const COUNTRIES_OF_RESIDENCE: CountryOption[] = [
  {
    name: "United States",
    nameHe: "ארצות הברית (United States)",
    defaultCallingCode: "+1",
    defaultTimezone: "America/New_York",
  },
  {
    name: "Israel",
    nameHe: "ישראל (Israel)",
    defaultCallingCode: "+972",
    defaultTimezone: "Asia/Jerusalem",
  },
  {
    name: "United Kingdom",
    nameHe: "בריטניה (United Kingdom)",
    defaultCallingCode: "+44",
    defaultTimezone: "Europe/London",
  },
  {
    name: "Canada",
    nameHe: "קנדה (Canada)",
    defaultCallingCode: "+1",
    defaultTimezone: "America/Toronto",
  },
  {
    name: "Australia",
    nameHe: "אוסטרליה (Australia)",
    defaultCallingCode: "+61",
    defaultTimezone: "Australia/Sydney",
  },
  {
    name: "Germany",
    nameHe: "גרמניה (Germany)",
    defaultCallingCode: "+49",
    defaultTimezone: "Europe/Berlin",
  },
  {
    name: "France",
    nameHe: "צרפת (France)",
    defaultCallingCode: "+33",
    defaultTimezone: "Europe/Paris",
  },
  {
    name: "Spain",
    nameHe: "ספרד (Spain)",
    defaultCallingCode: "+34",
    defaultTimezone: "Europe/Madrid",
  },
  {
    name: "Italy",
    nameHe: "איטליה (Italy)",
    defaultCallingCode: "+39",
    defaultTimezone: "Europe/Rome",
  },
  {
    name: "Brazil",
    nameHe: "ברזיל (Brazil)",
    defaultCallingCode: "+55",
    defaultTimezone: "America/Sao_Paulo",
  },
  {
    name: "Mexico",
    nameHe: "מקסיקו (Mexico)",
    defaultCallingCode: "+52",
    defaultTimezone: "America/Mexico_City",
  },
  {
    name: "Argentina",
    nameHe: "ארגנטינה (Argentina)",
    defaultCallingCode: "+54",
    defaultTimezone: "America/Argentina/Buenos_Aires",
  },
  {
    name: "India",
    nameHe: "הודו (India)",
    defaultCallingCode: "+91",
    defaultTimezone: "Asia/Kolkata",
  },
  {
    name: "Japan",
    nameHe: "יפן (Japan)",
    defaultCallingCode: "+81",
    defaultTimezone: "Asia/Tokyo",
  },
  {
    name: "South Korea",
    nameHe: "דרום קוריאה (South Korea)",
    defaultCallingCode: "+82",
    defaultTimezone: "Asia/Seoul",
  },
  {
    name: "Netherlands",
    nameHe: "הולנד (Netherlands)",
    defaultCallingCode: "+31",
    defaultTimezone: "Europe/Amsterdam",
  },
  {
    name: "Switzerland",
    nameHe: "שווייץ (Switzerland)",
    defaultCallingCode: "+41",
    defaultTimezone: "Europe/Zurich",
  },
  {
    name: "Sweden",
    nameHe: "שוודיה (Sweden)",
    defaultCallingCode: "+46",
    defaultTimezone: "Europe/Stockholm",
  },
  {
    name: "Poland",
    nameHe: "פולין (Poland)",
    defaultCallingCode: "+48",
    defaultTimezone: "Europe/Warsaw",
  },
  {
    name: "South Africa",
    nameHe: "דרום אפריקה (South Africa)",
    defaultCallingCode: "+27",
    defaultTimezone: "Africa/Johannesburg",
  },
  {
    name: "New Zealand",
    nameHe: "ניו זילנד (New Zealand)",
    defaultCallingCode: "+64",
    defaultTimezone: "Pacific/Auckland",
  },
  {
    name: "United Arab Emirates",
    nameHe: "איחוד האמירויות (UAE)",
    defaultCallingCode: "+971",
    defaultTimezone: "Asia/Dubai",
  },
];

export interface USStateOption {
  name: string;
  code: string;
  timezone: string;
  tzLabel: string;
}

export const US_STATES: USStateOption[] = [
  { name: "Alabama", code: "AL", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Alaska", code: "AK", timezone: "America/Anchorage", tzLabel: "Alaska Time (AKT)" },
  { name: "Arizona", code: "AZ", timezone: "America/Phoenix", tzLabel: "Mountain Standard Time (MST - No DST)" },
  { name: "Arkansas", code: "AR", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "California", code: "CA", timezone: "America/Los_Angeles", tzLabel: "Pacific Time (PT)" },
  { name: "Colorado", code: "CO", timezone: "America/Denver", tzLabel: "Mountain Time (MT)" },
  { name: "Connecticut", code: "CT", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Delaware", code: "DE", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "District of Columbia", code: "DC", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Florida", code: "FL", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Georgia", code: "GA", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Hawaii", code: "HI", timezone: "Pacific/Honolulu", tzLabel: "Hawaii-Aleutian Time (HST)" },
  { name: "Idaho", code: "ID", timezone: "America/Boise", tzLabel: "Mountain Time (MT)" },
  { name: "Illinois", code: "IL", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Indiana", code: "IN", timezone: "America/Indiana/Indianapolis", tzLabel: "Eastern Time (ET)" },
  { name: "Iowa", code: "IA", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Kansas", code: "KS", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Kentucky", code: "KY", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Louisiana", code: "LA", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Maine", code: "ME", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Maryland", code: "MD", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Massachusetts", code: "MA", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Michigan", code: "MI", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Minnesota", code: "MN", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Mississippi", code: "MS", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Missouri", code: "MO", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Montana", code: "MT", timezone: "America/Denver", tzLabel: "Mountain Time (MT)" },
  { name: "Nebraska", code: "NE", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Nevada", code: "NV", timezone: "America/Los_Angeles", tzLabel: "Pacific Time (PT)" },
  { name: "New Hampshire", code: "NH", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "New Jersey", code: "NJ", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "New Mexico", code: "NM", timezone: "America/Denver", tzLabel: "Mountain Time (MT)" },
  { name: "New York", code: "NY", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "North Carolina", code: "NC", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "North Dakota", code: "ND", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Ohio", code: "OH", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Oklahoma", code: "OK", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Oregon", code: "OR", timezone: "America/Los_Angeles", tzLabel: "Pacific Time (PT)" },
  { name: "Pennsylvania", code: "PA", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Rhode Island", code: "RI", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "South Carolina", code: "SC", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "South Dakota", code: "SD", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Tennessee", code: "TN", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Texas", code: "TX", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Utah", code: "UT", timezone: "America/Denver", tzLabel: "Mountain Time (MT)" },
  { name: "Vermont", code: "VT", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Virginia", code: "VA", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Washington", code: "WA", timezone: "America/Los_Angeles", tzLabel: "Pacific Time (PT)" },
  { name: "West Virginia", code: "WV", timezone: "America/New_York", tzLabel: "Eastern Time (ET)" },
  { name: "Wisconsin", code: "WI", timezone: "America/Chicago", tzLabel: "Central Time (CT)" },
  { name: "Wyoming", code: "WY", timezone: "America/Denver", tzLabel: "Mountain Time (MT)" },
];

/**
 * Automatically resolves the exact IANA Time Zone from the selected Country and US State.
 */
export function resolveTimezoneForLocation(
  country: string,
  usState?: string
): string {
  if (country === "United States") {
    const foundState = US_STATES.find(
      (s) =>
        s.name.toLowerCase() === (usState || "").toLowerCase() ||
        s.code.toLowerCase() === (usState || "").toLowerCase()
    );
    return foundState ? foundState.timezone : "America/New_York";
  }

  const foundCountry = COUNTRIES_OF_RESIDENCE.find(
    (c) => c.name.toLowerCase() === (country || "").toLowerCase()
  );
  if (foundCountry) {
    return foundCountry.defaultTimezone;
  }

  return "UTC";
}

/**
 * Validates a local phone number against the selected country calling code.
 */
export function validatePhoneForCountryCode(
  rawPhone: string,
  callingCode: string
): {
  valid: boolean;
  e164: string;
  nationalNumber: string;
  errorEn?: string;
  errorHe?: string;
} {
  const codeOption =
    COUNTRY_CALLING_CODES.find((c) => c.code === callingCode) ||
    COUNTRY_CALLING_CODES[0];

  // Strip spaces, dashes, parentheses, dots
  let cleaned = rawPhone.replace(/[\s\-().]/g, "");

  // If user pasted the calling code inside the phone field, strip it first
  const numericCode = callingCode.replace("+", "");
  if (cleaned.startsWith(callingCode)) {
    cleaned = cleaned.slice(callingCode.length);
  } else if (cleaned.startsWith(`00${numericCode}`)) {
    cleaned = cleaned.slice(numericCode.length + 2);
  }

  // Strip leading trunk '0' for countries that use a domestic trunk prefix (e.g., Israel 050..., UK 07..., etc.)
  if (callingCode !== "+1" && cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  if (!/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      e164: "",
      nationalNumber: cleaned,
      errorEn: "Phone number must contain digits only.",
      errorHe: "מספר הטלפון חייב להכיל ספרות בלבד.",
    };
  }

  if (
    cleaned.length < codeOption.minDigits ||
    cleaned.length > codeOption.maxDigits
  ) {
    const expectedText =
      codeOption.minDigits === codeOption.maxDigits
        ? `${codeOption.minDigits}`
        : `${codeOption.minDigits}–${codeOption.maxDigits}`;
    return {
      valid: false,
      e164: "",
      nationalNumber: cleaned,
      errorEn: `For ${codeOption.countryEn}, please enter a valid ${expectedText}-digit phone number (e.g. ${codeOption.placeholder}).`,
      errorHe: `עבור ${codeOption.countryHe}, נא להזין מספר טלפון תקין בן ${expectedText} ספרות (לדוגמה: ${codeOption.placeholder}).`,
    };
  }

  return {
    valid: true,
    e164: `${callingCode}${cleaned}`,
    nationalNumber: cleaned,
  };
}
