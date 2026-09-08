/**
 * Install stickiness for mass App Store installs.
 *
 * First-open ritual (under 10 minutes):
 *   profit margin → CSV spend (template) → trusted Total ROAS
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

export type ActivationStep = "margin" | "spend" | "desk";

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
  if (input.useSampleDesk || input.hasLiveSpend) return "desk";
  if (!input.marginConfirmed) return "margin";
  return "spend";
}

/**
 * First Overview load sends a cold live merchant to the current ritual step.
 * SAMPLE / shot / `?stay=1` never bounce. Once live spend exists, stay on the desk.
 */
export function firstOpenRedirect(input: FirstOpenRedirectInput): string | null {
  if (input.shotMode || input.useSampleDesk) return null;
  if (input.pathname !== "/app") return null;
  const params = searchParams(input.search);
  if (params.get("stay") === "1") return null;

  const step = resolveActivationStep(input);
  switch (step) {
    case "margin":
      return withParams("/app/settings", input.search, { activate: "1" });
    case "spend":
      return withParams("/app/spend", input.search, { activate: "1" });
    case "desk":
      return null;
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

export function isActivationQuery(search?: string): boolean {
  return searchParams(search).get("activate") === "1";
}

export function spendSkipHref(search?: string): string {
  return withParams("/app/spend", search, { activate: "1" });
}

/**
 * Teaching Spend empty — template download is the primary. Never a Pro wall.
 */
export function spendEmptyTeach(options?: {
  templateHref?: string;
}): SpendEmptyTeach {
  const primaryHref = options?.templateHref ?? "/app/spend/template?blank=1";
  return {
    heading: `Add spend in under ${FIRST_TRUSTED_MER_MINUTES} minutes`,
    body: `Download the blank daily CSV, fill Meta / Google / Other, upload. ${PRODUCT_NOUN.definition}. No ad-network login.`,
    primaryLabel: "Download blank template",
    primaryHref,
    steps: [
      "Pick the channels you advertise (Meta + Google are Free).",
      "Download the blank template — one row is one day.",
      "Fill spend amounts, then upload or paste the same file here.",
      `Open ${PRODUCT_NOUN.totalRoas} — Shopify Total Sales ÷ that spend.`,
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
  return input.mer != null && Number.isFinite(input.mer);
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
