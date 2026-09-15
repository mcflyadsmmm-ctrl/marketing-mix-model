/**
 * Period honesty — long windows must not look like a full live Shopify year.
 *
 * Cash Total ROAS = Shopify sales ÷ logged ad spend. Desk MER is facts-first
 * (SalesDayFact). Shopify `read_orders` live coverage is ~60 days. L12M / 3yr /
 * YTD / custom ranges past that window are stored facts (or incomplete stored
 * facts) — never a silent live year.
 *
 * Client-safe: no Prisma, no Shopify, no `.server`.
 */

export const PERIOD_HONESTY_SUFFIX = {
  sample: "SAMPLE",
  sales_unavailable: "sales unavailable",
  incomplete_stored_facts: "incomplete · stored facts only",
  stored_facts: "stored facts only",
  facts_incomplete: "facts incomplete",
  live: "live sales",
} as const;

export type PeriodHonestyKind = keyof typeof PERIOD_HONESTY_SUFFIX | "hidden";

export type PeriodHonestyInput = {
  useSampleDesk: boolean;
  listingCapture?: boolean;
  salesError?: boolean;
  blockedMockAsLive?: boolean;
  salesSource?: string | null;
  factsIncomplete?: boolean;
  periodExceedsFactWindow?: boolean;
  /**
   * Selected range (capped at now) is wider than Shopify's ~60-day
   * `read_orders` live window.
   */
  periodWiderThanLiveWindow?: boolean;
  /**
   * @deprecated Prefer `periodWiderThanLiveWindow`. Kept so older call sites
   * that meant “token is 60-day limited” still disclose stored-facts, not live.
   */
  recentWindowOnly?: boolean;
};

const WIDE_STORED_TITLE =
  "Beyond Shopify’s ~60-day live order window — stored sales facts only, not a full live year";

/** Presets that always span past the live `read_orders` window. */
export const PRESETS_BEYOND_LIVE_SHOPIFY_WINDOW = ["l12m", "y3"] as const;

export function periodPresetBeyondLiveShopifyWindow(
  preset: string,
): boolean {
  return (PRESETS_BEYOND_LIVE_SHOPIFY_WINDOW as readonly string[]).includes(
    preset,
  );
}

export function periodHonestyWidePresetTitle(preset: string): string | undefined {
  return periodPresetBeyondLiveShopifyWindow(preset)
    ? WIDE_STORED_TITLE
    : undefined;
}

function assertNever(x: never): never {
  throw new Error(`unexpected period honesty kind: ${String(x)}`);
}

/**
 * One merchant-facing kind for till labels next to Total ROAS.
 * SAMPLE stays SAMPLE. Listing-capture stays period-only.
 */
export function resolvePeriodHonesty(input: PeriodHonestyInput): PeriodHonestyKind {
  if (input.listingCapture) return "hidden";
  if (input.useSampleDesk) return "sample";
  if (
    input.salesError ||
    input.blockedMockAsLive ||
    input.salesSource === "mock"
  ) {
    return "sales_unavailable";
  }

  const beyondLive = Boolean(
    input.periodWiderThanLiveWindow || input.recentWindowOnly,
  );
  const factsIncomplete = Boolean(input.factsIncomplete);
  const exceedsFactWindow = Boolean(input.periodExceedsFactWindow);
  const storedWindow = beyondLive || exceedsFactWindow;

  if (storedWindow && (factsIncomplete || exceedsFactWindow)) {
    return "incomplete_stored_facts";
  }
  if (storedWindow) return "stored_facts";
  if (factsIncomplete) return "facts_incomplete";
  return "live";
}

export function periodHonestySuffix(kind: PeriodHonestyKind): string | null {
  switch (kind) {
    case "hidden":
      return null;
    case "sample":
      return PERIOD_HONESTY_SUFFIX.sample;
    case "sales_unavailable":
      return PERIOD_HONESTY_SUFFIX.sales_unavailable;
    case "incomplete_stored_facts":
      return PERIOD_HONESTY_SUFFIX.incomplete_stored_facts;
    case "stored_facts":
      return PERIOD_HONESTY_SUFFIX.stored_facts;
    case "facts_incomplete":
      return PERIOD_HONESTY_SUFFIX.facts_incomplete;
    case "live":
      return PERIOD_HONESTY_SUFFIX.live;
    default: {
      return assertNever(kind);
    }
  }
}

/** `Month to date · stored facts only` — listing-capture returns the period only. */
export function formatPeriodHonestyTillLabel(
  periodLabel: string,
  input: PeriodHonestyInput,
): string {
  const suffix = periodHonestySuffix(resolvePeriodHonesty(input));
  return suffix ? `${periodLabel} · ${suffix}` : periodLabel;
}

/** Compact chip / explorer note. Null when live, SAMPLE, listing-capture, or unavailable. */
export function periodHonestyChipLabel(kind: PeriodHonestyKind): string | null {
  switch (kind) {
    case "incomplete_stored_facts":
      return "Incomplete · stored facts only";
    case "stored_facts":
      return "Stored facts only";
    case "facts_incomplete":
      return "Facts incomplete";
    case "hidden":
    case "sample":
    case "sales_unavailable":
    case "live":
      return null;
    default: {
      return assertNever(kind);
    }
  }
}

export function formatPeriodHonestyChip(
  input: PeriodHonestyInput,
): string | null {
  return periodHonestyChipLabel(resolvePeriodHonesty(input));
}
