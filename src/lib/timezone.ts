/**
 * Timezone utilities — detection, search, and display.
 * Uses the built-in Intl API exclusively. No external dependencies.
 */

/** Detects the user's timezone from the browser. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Returns a Date whose local methods (getFullYear, getMonth, getDate, etc.)
 * reflect the wall-clock time in the given IANA timezone.
 *
 * This works by formatting `now` in the target timezone, then constructing
 * a new Date from those parts. The returned Date's UTC value is meaningless —
 * only use .getFullYear(), .getMonth(), .getDate(), .getHours(), etc.
 */
export function getNowInTimezone(timezone: string): Date {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
    return new Date(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") === 24 ? 0 : get("hour"),
      get("minute"),
      get("second"),
    );
  } catch {
    return now;
  }
}

/** Extracts the city name from an IANA timezone ID. "America/New_York" → "New York" */
function cityFromId(id: string): string {
  const parts = id.split("/");
  const city = parts[parts.length - 1];
  return city.replace(/_/g, " ");
}

/** Gets the current UTC offset string for a timezone. e.g. "UTC+8" or "UTC-5" */
function getUtcOffset(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    if (tzPart) {
      // Format is like "GMT+8" or "GMT-5:30" — normalize to "UTC+8"
      return tzPart.value.replace("GMT", "UTC");
    }
  } catch {
    // Fall through
  }
  return "";
}

export interface TimezoneOption {
  /** IANA timezone ID, e.g. "America/New_York" */
  id: string;
  /** City display name, e.g. "New York" */
  city: string;
  /** Region, e.g. "America" */
  region: string;
  /** UTC offset string, e.g. "UTC-5" */
  offset: string;
  /** Display label, e.g. "New York (UTC-5)" */
  label: string;
}

/** Cached list of all timezone options. */
let cachedOptions: TimezoneOption[] | null = null;

/** Returns all available IANA timezones as searchable options. */
function getAllTimezones(): TimezoneOption[] {
  if (cachedOptions) return cachedOptions;

  let ids: string[];
  try {
    ids = (Intl as unknown as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf("timeZone");
  } catch {
    // Fallback for older browsers
    ids = FALLBACK_TIMEZONES;
  }

  cachedOptions = ids
    .filter((id) => id.includes("/") && !id.startsWith("Etc/"))
    .map((id) => {
      const city = cityFromId(id);
      const region = id.split("/")[0];
      const offset = getUtcOffset(id);
      return {
        id,
        city,
        region,
        offset,
        label: `${city} (${offset})`,
      };
    });

  return cachedOptions;
}

/**
 * Searches timezones by city name. Case-insensitive partial match.
 * Returns up to `limit` results, sorted by relevance (exact prefix first).
 */
export function searchTimezones(query: string, limit = 8): TimezoneOption[] {
  if (!query.trim()) return [];

  const q = query.toLowerCase().trim();
  const all = getAllTimezones();

  const matches = all.filter(
    (tz) =>
      tz.city.toLowerCase().includes(q) ||
      tz.id.toLowerCase().includes(q),
  );

  // Sort: exact prefix matches first, then by city name
  matches.sort((a, b) => {
    const aPrefix = a.city.toLowerCase().startsWith(q) ? 0 : 1;
    const bPrefix = b.city.toLowerCase().startsWith(q) ? 0 : 1;
    if (aPrefix !== bPrefix) return aPrefix - bPrefix;
    return a.city.localeCompare(b.city);
  });

  return matches.slice(0, limit);
}

/** Formats a timezone ID for display. e.g. "America/New_York" → "New York (UTC-5)" */
export function formatTimezoneDisplay(timezone: string): string {
  const city = cityFromId(timezone);
  const offset = getUtcOffset(timezone);
  return `${city} (${offset})`;
}

/** Common IANA timezone IDs — fallback when Intl.supportedValuesOf is unavailable. */
const FALLBACK_TIMEZONES = [
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Anchorage",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Chicago",
  "America/Denver",
  "America/Halifax",
  "America/Lima",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Phoenix",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/St_Johns",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Bangkok",
  "Asia/Colombo",
  "Asia/Dhaka",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Istanbul",
  "Asia/Jakarta",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Kuala_Lumpur",
  "Asia/Manila",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Taipei",
  "Asia/Tehran",
  "Asia/Tokyo",
  "Atlantic/Reykjavik",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Athens",
  "Europe/Berlin",
  "Europe/Brussels",
  "Europe/Dublin",
  "Europe/Helsinki",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Prague",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Zurich",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Honolulu",
];
