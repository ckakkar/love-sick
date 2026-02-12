/**
 * Common IANA timezones for onboarding. User's browser timezone is detected separately.
 * Grouped by region for easier selection.
 */
export const TIMEZONE_GROUPS: { label: string; zones: { value: string; label: string }[] }[] = [
  {
    label: "Americas",
    zones: [
      { value: "America/New_York", label: "Eastern (New York)" },
      { value: "America/Chicago", label: "Central (Chicago)" },
      { value: "America/Denver", label: "Mountain (Denver)" },
      { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
      { value: "America/Anchorage", label: "Alaska" },
      { value: "Pacific/Honolulu", label: "Hawaii" },
      { value: "America/Toronto", label: "Toronto" },
      { value: "America/Vancouver", label: "Vancouver" },
      { value: "America/Mexico_City", label: "Mexico City" },
      { value: "America/Sao_Paulo", label: "São Paulo" },
      { value: "America/Buenos_Aires", label: "Buenos Aires" },
    ],
  },
  {
    label: "Europe",
    zones: [
      { value: "Europe/London", label: "London" },
      { value: "Europe/Paris", label: "Paris" },
      { value: "Europe/Berlin", label: "Berlin" },
      { value: "Europe/Amsterdam", label: "Amsterdam" },
      { value: "Europe/Madrid", label: "Madrid" },
      { value: "Europe/Rome", label: "Rome" },
      { value: "Europe/Stockholm", label: "Stockholm" },
      { value: "Europe/Moscow", label: "Moscow" },
      { value: "Europe/Istanbul", label: "Istanbul" },
    ],
  },
  {
    label: "Asia & Pacific",
    zones: [
      { value: "Asia/Dubai", label: "Dubai" },
      { value: "Asia/Kolkata", label: "India (Mumbai, Delhi)" },
      { value: "Asia/Bangkok", label: "Bangkok" },
      { value: "Asia/Singapore", label: "Singapore" },
      { value: "Asia/Hong_Kong", label: "Hong Kong" },
      { value: "Asia/Shanghai", label: "Shanghai" },
      { value: "Asia/Tokyo", label: "Tokyo" },
      { value: "Asia/Seoul", label: "Seoul" },
      { value: "Australia/Sydney", label: "Sydney" },
      { value: "Australia/Melbourne", label: "Melbourne" },
      { value: "Pacific/Auckland", label: "Auckland" },
    ],
  },
  {
    label: "Africa",
    zones: [
      { value: "Africa/Cairo", label: "Cairo" },
      { value: "Africa/Lagos", label: "Lagos" },
      { value: "Africa/Johannesburg", label: "Johannesburg" },
    ],
  },
  {
    label: "Other",
    zones: [{ value: "UTC", label: "UTC" }],
  },
];

export const ALL_TIMEZONE_VALUES = TIMEZONE_GROUPS.flatMap((g) => g.zones.map((z) => z.value));

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Get browser's current IANA timezone, or UTC if unavailable. */
export function getBrowserTimezone(): string {
  if (typeof Intl === "undefined" || !Intl.DateTimeFormat) return "UTC";
  const resolved = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return resolved && isValidTimezone(resolved) ? resolved : "UTC";
}
