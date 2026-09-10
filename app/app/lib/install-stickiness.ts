/**
 * Install stickiness for mass App Store installs.
 *
 * First-open ritual (under 10 minutes):
 *   typed one-day spend (paste / CSV for backfill) → trusted Total ROAS →
 *   (optional) margin for break-even
 *
 * Cash religion: Total ROAS = Shopify sales ÷ ad spend.
 * Reviews API is soft and late — never on SAMPLE, never before trusted MER,
 * never before 24h, never in the first 60s of a trusted-desk session, never
 * on empty / sales-error scoreboards. No pixels / MTA / Pro wall on Spend empty.
 */

import { PRODUCT_NOUN } from "./product-labels";

export const FIRST_TRUSTED_MER_MINUTES = 10;
export const REVIEW_MIN_INSTALL_MS = 24 * 60 * 60 * 1000;
/** Dwell after trusted Total ROAS is on screen — do not ask during first glance. */
export const REVIEW_MIN_SESSION_MS = 60 * 1000;

export type ActivationStep = "spend" | "desk";

export type ReviewAskReason =
  | "ok"
  | "sample"
  | "untrusted_mer"
  | "too_soon"
  | "shot"
  | "empty"
  | "history_limited"
  | "incomplete";

export type ReviewAskRevealReason =
  | "ok"
  | "off"
  | "dismissed"
  | "no_api"
  | "session_too_soon";

export type ReviewAskDecision = {
  ask: boolean;
  reason: ReviewAskReason;
};

export type ReviewAskReveal = {
  show: boolean;
  reason: ReviewAskRevealReason;
};

/** Post-value, calm MDS voice. Button only — never auto-modal. */
export const REVIEW_ASK_COPY = {
  heading: "Trusted Total ROAS is on the desk",
  body: "If sales ÷ spend helped, a short App Store review helps the next merchant find it. Not required.",
  acceptLabel: "Leave a review",
  dismissLabel: "Not now",
} as const;

export type FirstOpenRedirectInput = {
  pathname: string;
  search?: string;
  marginConfirmed: boolean;
  hasLiveSpend: boolean;
  useSampleDesk: boolean;
  shotMode?: boolean;
};

export type SpendEmptyTeach = {
  heading: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  /** CSV/template fallback — never the first ask. */
  secondaryLabel: string;
  secondaryHref: string;
  steps: string[];
};

function searchParams(search?: string): URLSearchParams {
  if (!search) return new URLSearchParams();
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

function withParams(path: string, search: string | undefined, patch: Record<string, string>): string {
  const params = searchParams(search);
  params.delete("stay");
  for (const [key, value] of Object.entries(patch)) {
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function resolveActivationStep(input: {
  marginConfirmed: boolean;
  hasLiveSpend: boolean;
  useSampleDesk: boolean;
}): ActivationStep {
  // Margin is optional for break-even — never the first-open bounce.
  void input.marginConfirmed;
  if (input.useSampleDesk || input.hasLiveSpend) return "desk";
  return "spend";
}

/**
 * Sales-first: Overview never bounces cold merchants to Spend.
 * Shopify order economics paint first; spend is a secondary unlock for Total ROAS.
 * `resolveActivationStep` still teaches Spend as the next action inside the guide.
 * SAMPLE / shot / non-Overview paths stay no-ops (legacy `?stay=1` ignored).
 */
export function firstOpenRedirect(input: FirstOpenRedirectInput): string | null {
  void input;
  return null;
}

export function isActivationQuery(search?: string): boolean {
  return searchParams(search).get("activate") === "1";
}

export function spendSkipHref(search?: string): string {
  return withParams("/app/spend", search, { activate: "1" });
}

/**
 * Teaching Spend empty — the typed one-day row first, CSV/template second.
 * Nothing here needs a download. Never a Pro wall.
 */
export function spendEmptyTeach(options?: {
  /** Anchor / route for the typed date + amount + channel row. */
  typeHref?: string;
  templateHref?: string;
  /** Jump to bill → daily rows (fastest path to trusted coverage). */
  billHref?: string;
  /** After Sample → Real with no live spend yet. */
  justSwitchedReal?: boolean;
}): SpendEmptyTeach {
  const primaryHref = options?.typeHref ?? "#mcfly-spend-day";
  const secondaryHref = options?.billHref ?? "#mcfly-spend-bill";
  const tertiaryHref = options?.templateHref ?? "/app/spend/template?blank=1";
  const shared = {
    primaryLabel: "Type one day",
    primaryHref,
    secondaryLabel: "Divide a monthly bill into days",
    secondaryHref,
  };
  if (options?.justSwitchedReal) {
    return {
      ...shared,
      heading: "Real store is on — get coverage on the desk",
      body: `Type one day below, or divide a Meta/Google invoice into equal daily rows so Total ROAS is not waiting on 14 hand-typed days. ${PRODUCT_NOUN.definition}.`,
      steps: [
        "Fastest coverage: Divide a monthly bill → download daily rows → import.",
        "Or type day + amount + channel, then Save this day.",
        `Open ${PRODUCT_NOUN.totalRoas} — Shopify sales ÷ that spend.`,
      ],
    };
  }
  return {
    ...shared,
    heading: "Get spend on the desk — one day or a whole bill",
    body: `Operators making real budget calls need coverage, not a 27-hole wall. Type one day to see Total ROAS now, or divide a monthly/quarterly invoice into daily rows so the multiple is honest. ${PRODUCT_NOUN.definition}. No ad-network login.`,
    steps: [
      "Have an invoice? Divide a bill into daily rows (below) — then import.",
      "Have one number? Type day + amount + channel, then Save this day.",
      "Backfilling months? Paste rows or CSV — blank template if you need a shape.",
      `Open ${PRODUCT_NOUN.totalRoas} — Shopify sales ÷ that spend.`,
    ],
  };
}

export function isTrustedMer(input: {
  useSampleDesk: boolean;
  hasLiveSpend: boolean;
  mer: number | null;
  blockedMockAsLive?: boolean;
  salesError?: string | null;
}): boolean {
  if (input.useSampleDesk) return false;
  if (!input.hasLiveSpend) return false;
  if (input.blockedMockAsLive) return false;
  if (input.salesError) return false;
  return input.mer != null && Number.isFinite(input.mer) && input.mer > 0;
}

function toEpochMs(value: Date | string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Soft Reviews API gate (server). Shopify also refuses <24h (`recently-installed`);
 * we fail closed the same way plus SAMPLE / untrusted MER / empty scoreboard.
 * Client still waits {@link REVIEW_MIN_SESSION_MS} before revealing.
 */
export function decideReviewAsk(input: {
  useSampleDesk: boolean;
  trustedMer: boolean;
  installedAt: Date | string;
  now?: Date;
  shotMode?: boolean;
  /** Live Total ROAS is on screen — not cold empty / sales error. */
  scoreboardReady?: boolean;
  /** Long period without read_all_orders — charts are history-capped. */
  historyLimited?: boolean;
  /** Sales facts still backfilling — do not ask over incomplete coverage. */
  factsIncomplete?: boolean;
}): ReviewAskDecision {
  if (input.shotMode) return { ask: false, reason: "shot" };
  if (input.useSampleDesk) return { ask: false, reason: "sample" };
  if (input.scoreboardReady === false) return { ask: false, reason: "empty" };
  if (input.historyLimited) return { ask: false, reason: "history_limited" };
  if (input.factsIncomplete) return { ask: false, reason: "incomplete" };
  if (!input.trustedMer) return { ask: false, reason: "untrusted_mer" };
  const installedAt = toEpochMs(input.installedAt);
  if (installedAt == null) {
    return { ask: false, reason: "too_soon" };
  }
  const now = toEpochMs(input.now ?? new Date()) ?? Date.now();
  if (now - installedAt < REVIEW_MIN_INSTALL_MS) {
    return { ask: false, reason: "too_soon" };
  }
  return { ask: true, reason: "ok" };
}

/**
 * Client reveal after server eligibility. Fail closed for the first 60s of a
 * trusted-desk session, dismissed merchants, and missing Reviews API.
 */
export function decideReviewAskReveal(input: {
  eligible: boolean;
  dismissed: boolean;
  reviewsApiAvailable: boolean;
  sessionStartedAt: Date | string | number | null;
  now?: Date | number;
}): ReviewAskReveal {
  if (!input.eligible) return { show: false, reason: "off" };
  if (input.dismissed) return { show: false, reason: "dismissed" };
  if (!input.reviewsApiAvailable) return { show: false, reason: "no_api" };
  const started = toEpochMs(input.sessionStartedAt);
  if (started == null) return { show: false, reason: "session_too_soon" };
  const now = toEpochMs(input.now ?? Date.now()) ?? Date.now();
  if (now - started < REVIEW_MIN_SESSION_MS) {
    return { show: false, reason: "session_too_soon" };
  }
  return { show: true, reason: "ok" };
}
