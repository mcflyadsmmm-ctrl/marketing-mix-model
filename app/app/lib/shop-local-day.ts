/**
 * Shop-local calendar day key (YYYY-MM-DD) for a UTC instant, per IANA timezone.
 * Used for SalesDayFact, live by-day bucketing, and period edges so boundaries are
 * honest to the merchant's store timezone rather than the server's local clock.
 */
export function shopLocalDayKey(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export interface ShopLocalDayRange {
  start: Date;
  end: Date;
  label: string;
}

/** UTC offset (minutes, localTime = UTC + offset) in effect for `instant` in `timeZone`. */
function tzOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/**
 * UTC instant range covering exactly one shop-local calendar day (YYYY-MM-DD).
 * Offset is resolved at local noon (stable across the rare day that itself
 * contains a DST transition) rather than at midnight.
 */
export function shopLocalDayRange(
  dateKey: string,
  timeZone: string,
): ShopLocalDayRange {
  const [y, m, d] = dateKey.split("-").map(Number);
  const noonGuess = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const offsetMin = tzOffsetMinutes(noonGuess, timeZone);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMin * 60_000);
  const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0) - offsetMin * 60_000 - 1);
  return { start, end, label: dateKey };
}

/**
 * Last `count` CLOSED shop-local calendar days (excludes the in-progress local
 * "today"), oldest first. Never uses server-local time — always resolves "today"
 * in `timeZone` so the window boundary matches the merchant's store day.
 */
export function listRecentClosedShopLocalDays(
  timeZone: string,
  count: number,
  now: Date = new Date(),
): string[] {
  const todayKey = shopLocalDayKey(now, timeZone);
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const days: string[] = [];
  for (let i = count; i >= 1; i--) {
    // Noon anchor avoids landing on a DST-skipped/repeated local hour when we
    // subtract whole days in UTC before re-deriving the local day key.
    const cursor = new Date(Date.UTC(ty, tm - 1, td - i, 12, 0, 0));
    days.push(shopLocalDayKey(cursor, timeZone));
  }
  return days;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Calendar YYYY-MM-DD from Y/M/D (1-indexed month). */
export function dateKeyFromYmd(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/**
 * Shop-local Y/M/D parts for an instant. Prefer this over `Date#getFullYear`
 * when bucketing or resolving period edges for a merchant store.
 */
export function shopLocalYmd(
  instant: Date,
  timeZone: string,
): { y: number; m: number; d: number } {
  const key = shopLocalDayKey(instant, timeZone);
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

/** Next shop-local calendar day key after `dateKey` (noon-anchor arithmetic). */
export function nextShopLocalDayKey(dateKey: string, timeZone: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
  return shopLocalDayKey(cursor, timeZone);
}

/** UTC midnight Date for a YYYY-MM-DD calendar key (SalesDayFact / CSV day stamp). */
export function utcMidnightFromDayKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
