/**
 * One-shop accuracy scorecard — judgment helpers for
 * docs/ops/ACCURACY_ONE_SHOP_SCORECARD.md and LIVE_UNPARK_CHECKLIST §4.
 *
 * Client-safe. Does not unpark Live, touch billing, or paint the desk.
 * Humans still fill Admin numbers; these functions only judge what they see.
 */

import {
  type LiveUnparkStage,
  type LiveUnparkTab,
} from "./live-unpark";
import { formatMer } from "./mer-format";

/** Same 10 rows as LIVE_UNPARK_CHECKLIST §4 / the one-shop sheet. */
export const ONE_SHOP_ACCURACY_CHECKS = [
  "sample_contamination",
  "kill_switch",
  "shop_tz",
  "refunds",
  "overview_sales",
  "orders_typical",
  "sync_pending",
  "customers_returning",
  "ltv_window",
  "empty_vs_zero",
] as const;

export type OneShopAccuracyCheck = (typeof ONE_SHOP_ACCURACY_CHECKS)[number];

export type ScorecardVerdict = "pass" | "fail" | "hold";

export type ScorecardJudgment = {
  verdict: ScorecardVerdict;
  reason: string;
};

export type DeskViewMode = "sample" | "live";

/** Painted unknown — never a certified $0. */
export const HONEST_EMPTY = "—";

/** Live OrderFact.source — must not appear on the SAMPLE book, and vice versa. */
export const LIVE_ORDER_FACT_SOURCE = "shopify_order_v1";

export const SAMPLE_SOURCE = "sample";

/** Shopify Overview vs Mcfly: $1 or 0.5% of the larger side. */
export const ADMIN_MONEY_ABS = 1;
export const ADMIN_MONEY_REL = 0.005;

/** Median ticket vs a 10-order spot-check: $5 or 10%. */
export const TYPICAL_TICKET_ABS = 5;
export const TYPICAL_TICKET_REL = 0.1;

/** Below this, typical-order is an honest empty, not a FAIL. */
export const TYPICAL_MIN_ORDERS = 5;

const LIVE_NUMBER_CHECKS: readonly OneShopAccuracyCheck[] = [
  "shop_tz",
  "refunds",
  "overview_sales",
  "orders_typical",
  "sync_pending",
];

function judgment(
  verdict: ScorecardVerdict,
  reason: string,
): ScorecardJudgment {
  return { verdict, reason };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isSampleSource(source: string | null | undefined): boolean {
  return String(source ?? "").trim().toLowerCase() === SAMPLE_SOURCE;
}

/** SAMPLE ledger notes (`sample:snowdevil-2`, leftover `sample:snowdevil-1`). */
export function isSampleLedgerNote(note: string | null | undefined): boolean {
  return /^sample:/i.test(String(note ?? "").trim());
}

export function mixedSampleLiveSources(
  sources: readonly (string | null | undefined)[],
): boolean {
  let sawSample = false;
  let sawLive = false;
  for (const source of sources) {
    if (isSampleSource(source)) sawSample = true;
    else if (String(source ?? "").trim()) sawLive = true;
    if (sawSample && sawLive) return true;
  }
  return false;
}

export function liveLedgerContaminated(
  rows: readonly { source?: string | null; note?: string | null }[],
): boolean {
  return rows.some(
    (row) => isSampleSource(row.source) || isSampleLedgerNote(row.note),
  );
}

export function sampleBookContaminatedByLive(
  rows: readonly { source?: string | null }[],
): boolean {
  return rows.some((row) => {
    const source = String(row.source ?? "").trim();
    if (!source) return false;
    return !isSampleSource(source);
  });
}

/**
 * SAMPLE / Live must never share a painted ledger.
 * Live: no `sample` source, no `sample:` notes.
 * Sample: every sourced row is `sample`.
 * Either mode: mixed sources in one view is contamination.
 */
export function judgeSampleContamination(input: {
  mode: DeskViewMode;
  watermarkOn: boolean;
  rows?: readonly { source?: string | null; note?: string | null }[];
}): ScorecardJudgment {
  const rows = input.rows ?? [];
  const sources = rows.map((row) => row.source);
  if (mixedSampleLiveSources(sources)) {
    return judgment("fail", "mixed SAMPLE and Live sources in one view");
  }
  switch (input.mode) {
    case "sample":
      if (!input.watermarkOn) {
        return judgment("fail", "Sample mode must keep the SAMPLE watermark on");
      }
      if (sampleBookContaminatedByLive(rows)) {
        return judgment("fail", "Live source on the SAMPLE book");
      }
      return judgment("pass", "SAMPLE labeled; sources stay sample");
    case "live":
      if (input.watermarkOn) {
        return judgment("fail", "Live mode must drop the Snowdevil watermark");
      }
      if (liveLedgerContaminated(rows)) {
        return judgment("fail", "SAMPLE spend or sample: note on the live ledger");
      }
      return judgment("pass", "Live ledger has no SAMPLE rows");
    default: {
      const _never: never = input.mode;
      return _never;
    }
  }
}

export type HonestyKind = "missing" | "pending" | "certified_zero" | "known";

/** Missing / pending paint —; certified $0 stays 0; known stays the number. */
export function paintHonesty(
  kind: HonestyKind,
  known?: number,
): typeof HONEST_EMPTY | number {
  switch (kind) {
    case "missing":
    case "pending":
      return HONEST_EMPTY;
    case "certified_zero":
      return 0;
    case "known":
      return isFiniteNumber(known) ? known : HONEST_EMPTY;
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

/**
 * Empty spend is never `0.00×`. Pending sales withhold the ratio.
 * Certified $0 sales with spend on file may paint `0.00×`.
 */
export function paintTotalRoas(input: {
  spend: number;
  mer: number | null;
  salesPending?: boolean;
}): string {
  if (!(input.spend > 0) || !Number.isFinite(input.spend)) return HONEST_EMPTY;
  if (input.salesPending) return HONEST_EMPTY;
  if (input.mer == null || !Number.isFinite(input.mer)) return HONEST_EMPTY;
  return `${formatMer(input.mer)}×`;
}

export function judgePaintedRoas(input: {
  spend: number;
  painted: string;
  salesPending?: boolean;
}): ScorecardJudgment {
  const painted = input.painted.trim();
  const looksZeroX = /0\.00\s*×/.test(painted);
  if (!(input.spend > 0) || !Number.isFinite(input.spend)) {
    if (looksZeroX) {
      return judgment("fail", "empty spend painted 0.00× — must be —");
    }
    if (painted === HONEST_EMPTY) {
      return judgment("pass", "empty spend is — not 0.00×");
    }
    return judgment("fail", `empty spend must paint ${HONEST_EMPTY}`);
  }
  if (input.salesPending) {
    if (looksZeroX || /\$0 sales/.test(painted)) {
      return judgment("fail", "pending sales painted as $0 / 0.00×");
    }
    if (painted === HONEST_EMPTY || /loading|pending|still/i.test(painted)) {
      return judgment("pass", "pending sales withheld — unknown is not $0");
    }
    return judgment("fail", "pending sales must withhold the ratio");
  }
  return judgment("pass", "spend on file — ratio may paint");
}

export function judgePaintedMoney(input: {
  kind: HonestyKind;
  painted: string;
}): ScorecardJudgment {
  const painted = input.painted.trim();
  const looksZero = /^\$?0(?:\.0+)?$/.test(painted) || painted === "0";
  switch (input.kind) {
    case "missing":
    case "pending":
      if (looksZero) {
        return judgment("fail", `${input.kind} painted $0 — must be —`);
      }
      if (painted === HONEST_EMPTY) {
        return judgment("pass", `${input.kind} is — not $0`);
      }
      return judgment("fail", `${input.kind} must paint ${HONEST_EMPTY}`);
    case "certified_zero":
      if (looksZero || painted === "$0") {
        return judgment("pass", "certified $0 may paint $0");
      }
      if (painted === HONEST_EMPTY) {
        return judgment("fail", "certified $0 must not collapse to —");
      }
      return judgment("fail", "certified $0 must paint $0");
    case "known":
      if (painted === HONEST_EMPTY || looksZero) {
        return judgment("fail", "known dollars must not paint — or $0");
      }
      return judgment("pass", "known dollars painted");
    default: {
      const _never: never = input.kind;
      return _never;
    }
  }
}

function moneyTolerance(desk: number, admin: number, abs: number, rel: number) {
  const scale = Math.max(Math.abs(desk), Math.abs(admin), 1);
  return Math.max(abs, scale * rel);
}

/**
 * Admin Analytics vs Mcfly money. Missing last year on both sides is PASS
 * (honest empty). Desk $0 vs missing Admin prior is FAIL.
 */
export function compareAdminMoney(
  desk: number | null | undefined,
  admin: number | null | undefined,
  opts?: { pending?: boolean; abs?: number; rel?: number },
): ScorecardJudgment {
  if (opts?.pending) {
    return judgment("hold", "desk pending — unknown is not $0");
  }
  const deskKnown = isFiniteNumber(desk);
  const adminKnown = isFiniteNumber(admin);
  if (!deskKnown && !adminKnown) {
    return judgment("pass", "both missing — honest empty, not $0");
  }
  if (deskKnown && !adminKnown) {
    if (desk === 0) {
      return judgment("fail", "desk painted $0 for a missing Admin number");
    }
    return judgment("fail", "desk has dollars; Admin side is missing");
  }
  if (!deskKnown && adminKnown) {
    if (admin === 0) {
      return judgment("fail", "Admin is certified $0; desk painted empty");
    }
    return judgment("fail", "Admin has dollars; desk painted empty");
  }
  const absTol = moneyTolerance(
    desk as number,
    admin as number,
    opts?.abs ?? ADMIN_MONEY_ABS,
    opts?.rel ?? ADMIN_MONEY_REL,
  );
  const delta = Math.abs((desk as number) - (admin as number));
  if (delta <= absTol) {
    return judgment("pass", `within $${absTol.toFixed(2)}`);
  }
  return judgment(
    "fail",
    `desk ${desk} vs Admin ${admin} (tol $${absTol.toFixed(2)})`,
  );
}

export function compareTypicalTicket(
  deskMedian: number | null | undefined,
  spotCheckMedian: number | null | undefined,
  orderCount: number,
): ScorecardJudgment {
  if (orderCount < TYPICAL_MIN_ORDERS) {
    if (deskMedian == null || !Number.isFinite(deskMedian)) {
      return judgment("pass", "thin shop — typical is — not $0");
    }
    return judgment("hold", `need ≥${TYPICAL_MIN_ORDERS} orders for typical`);
  }
  return compareAdminMoney(deskMedian, spotCheckMedian, {
    abs: TYPICAL_TICKET_ABS,
    rel: TYPICAL_TICKET_REL,
  });
}

export function scorecardCheckApplies(
  check: OneShopAccuracyCheck,
  stage: LiveUnparkStage,
): boolean {
  switch (check) {
    case "customers_returning":
      return stage === "customers" || stage === "ltv";
    case "ltv_window":
      return stage === "ltv";
    case "sample_contamination":
    case "kill_switch":
    case "shop_tz":
    case "refunds":
    case "overview_sales":
    case "orders_typical":
    case "sync_pending":
    case "empty_vs_zero":
      return true;
    default: {
      const _never: never = check;
      return _never;
    }
  }
}

/**
 * What you can fill on today's tip vs what still needs Live / a later stage.
 * Freeze on: SAMPLE-path rows only. Live dollars need freeze off + mode live.
 */
export function scorecardCheckRunability(
  check: OneShopAccuracyCheck,
  ctx: {
    sampleOnlyFreeze: boolean;
    stage: LiveUnparkStage;
    mode: DeskViewMode;
  },
): "run" | "hold_needs_live" | "hold_needs_stage" {
  const needsLive =
    ctx.sampleOnlyFreeze || ctx.mode !== "live" || ctx.stage === "parked";
  switch (check) {
    case "sample_contamination":
    case "kill_switch":
    case "empty_vs_zero":
      return "run";
    case "shop_tz":
    case "refunds":
    case "overview_sales":
    case "orders_typical":
    case "sync_pending":
      return needsLive ? "hold_needs_live" : "run";
    case "customers_returning":
    case "ltv_window":
      if (!scorecardCheckApplies(check, ctx.stage)) return "hold_needs_stage";
      return needsLive ? "hold_needs_live" : "run";
    default: {
      const _never: never = check;
      return _never;
    }
  }
}

export function tipReadyChecks(ctx: {
  sampleOnlyFreeze: boolean;
  stage: LiveUnparkStage;
  mode: DeskViewMode;
}): OneShopAccuracyCheck[] {
  return ONE_SHOP_ACCURACY_CHECKS.filter(
    (check) => scorecardCheckRunability(check, ctx) === "run",
  );
}

/** Tabs a human should open for a given check. Never a spend door on Overview. */
export function scorecardCheckTabs(
  check: OneShopAccuracyCheck,
): readonly LiveUnparkTab[] {
  switch (check) {
    case "sample_contamination":
    case "kill_switch":
    case "empty_vs_zero":
      return ["overview"];
    case "shop_tz":
    case "overview_sales":
      return ["overview"];
    case "refunds":
    case "orders_typical":
      return ["orders"];
    case "sync_pending":
      return ["overview", "orders"];
    case "customers_returning":
      return ["customers"];
    case "ltv_window":
      return ["ltv"];
    default: {
      const _never: never = check;
      return _never;
    }
  }
}

export function liveNumberChecks(): readonly OneShopAccuracyCheck[] {
  return LIVE_NUMBER_CHECKS;
}
