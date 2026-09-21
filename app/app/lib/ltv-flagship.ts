/**
 * LTV flagship compete math — 30/90/365 come-back + revenue, a written-out
 * first-year estimate, refund honesty, and path-LTV lift. Order history only.
 *
 * Inputs are the same opaque {@link CustomerDepth} / {@link DepthOrder} rows
 * the depth pack already uses. No spend, no COGS, no pixels. Live refund
 * dollars stay null unless a known gross is on the order — never invented.
 *
 * Merchant chrome says these in shop-owner English (first-order month, come
 * back, later order). Internal ids may say window / mature / flagship.
 */

import {
  buildLtvDepth,
  monthLabel,
  rollUpCustomers,
  type CustomerDepth,
  type DepthOrder,
  type LtvDepthView,
  type PathLtvRow,
} from "./ltv-depth";
import {
  expectedLtvFromRetention,
  type ExpectedLtvEstimate,
} from "./expected-ltv";
import {
  buildFirstProductDrivers,
  type FirstProductDriversView,
} from "./ltv-first-product";
import { buildProductLtv, type ProductLtvView } from "./ltv-product";
import { buildPromoLtv, type PromoLtvView } from "./ltv-promo";

export const LTV_FLAGSHIP_WINDOWS = [30, 90, 365] as const;
export type LtvFlagshipWindow = (typeof LTV_FLAGSHIP_WINDOWS)[number];

/** Buyers with a fully elapsed window before a rate or estimate is honest. */
export const FLAGSHIP_MIN_MATURE = 8;
/** First-order months kept in the 30/90/365 table (most recent). */
export const FLAGSHIP_MAX_MONTH_ROWS = 14;

const DAY_MS = 86_400_000;

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / DAY_MS);
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function windowSpend(customer: CustomerDepth, days: LtvFlagshipWindow): number {
  switch (days) {
    case 30:
      return customer.day30Spend;
    case 90:
      return customer.day90Spend;
    case 365:
      return customer.day365Spend;
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

/**
 * Gross order revenue through the window. Null when any order in the window
 * omitted a known gross — not $0 and not a filled-in net.
 */
function windowGross(
  customer: CustomerDepth,
  days: LtvFlagshipWindow,
): number | null {
  switch (days) {
    case 30:
      return customer.day30Gross;
    case 90:
      return customer.day90Gross;
    case 365:
      return customer.day365Gross;
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

/** Which dollars the revenue-by-first-order table is painting. */
export type CohortRevenueBasis = "includes_refunds" | "gross_orders";

/** Refund-honest path. Operators can defend this without calling it audited. */
export const DEFAULT_COHORT_REVENUE_BASIS: CohortRevenueBasis = "includes_refunds";

export function cohortRevenueBasisLabel(basis: CohortRevenueBasis): string {
  switch (basis) {
    case "includes_refunds":
      return "Includes refunds";
    case "gross_orders":
      return "Gross orders";
    default: {
      const _exhaustive: never = basis;
      return _exhaustive;
    }
  }
}

export function cohortRevenueFormula(basis: CohortRevenueBasis): string {
  switch (basis) {
    case "includes_refunds":
      return "order revenue − refunds attributed to cohort window";
    case "gross_orders":
      return "order revenue in the cohort window, before refunds";
    default: {
      const _exhaustive: never = basis;
      return _exhaustive;
    }
  }
}

/**
 * Painted dollars for one triangle cell. Includes-refunds is net.
 * Gross orders is null when gross was not on file — a dash, not $0.
 */
export function cohortCellRevenue(
  cell: { revenue: number | null; grossRevenue: number | null },
  basis: CohortRevenueBasis,
): number | null {
  switch (basis) {
    case "includes_refunds":
      return cell.revenue;
    case "gross_orders":
      return cell.grossRevenue;
    default: {
      const _exhaustive: never = basis;
      return _exhaustive;
    }
  }
}

function windowOrders(customer: CustomerDepth, days: LtvFlagshipWindow): number {
  switch (days) {
    case 30:
      return customer.ordersD30;
    case 90:
      return customer.ordersD90;
    case 365:
      return customer.ordersD365;
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

function windowLabel(days: LtvFlagshipWindow): string {
  switch (days) {
    case 30:
      return "First 30 days";
    case 90:
      return "First 90 days";
    case 365:
      return "First year";
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

export function matureForWindow(
  customers: CustomerDepth[],
  asOf: Date,
  days: LtvFlagshipWindow,
): CustomerDepth[] {
  return customers.filter((c) => daysBetween(c.firstOrderedAt, asOf) >= days);
}

// —— 30 / 90 / 365 retention + revenue (blended + first-order months) ————————

export interface FlagshipWindowPoint {
  days: LtvFlagshipWindow;
  label: string;
  /** Share who placed a second order inside the window (mature buyers only). */
  retention: number | null;
  /** Average net dollars per mature buyer through the window. */
  revenue: number | null;
  n: number;
  /**
   * Same-buyer dollars this window added after the prior window.
   * Day 30 has no prior. Null when this window is unsealed.
   */
  added: number | null;
  afterDays: 30 | 90 | null;
}

export interface FlagshipWindowCurve {
  points: FlagshipWindowPoint[];
}

export interface FlagshipMonthRow {
  cohortMonth: string;
  label: string;
  customers: number;
  retain30: number | null;
  retain90: number | null;
  retain365: number | null;
  rev30: number | null;
  rev90: number | null;
  rev365: number | null;
  /**
   * Gross order revenue per buyer. Null when the window is unlived or any
   * order in it omitted a known gross — not $0.
   */
  grossRev30: number | null;
  grossRev90: number | null;
  grossRev365: number | null;
  /** Buyers in this month who have lived each window. 0 when none have. */
  n30: number;
  n90: number;
  n365: number;
}

/**
 * Come-back share among buyers whose first order is at least `days` old:
 * they placed a second order on or before day `days`. Null when too few
 * buyers have lived the window — never a fake 0%.
 */
export function windowRetention(
  customers: CustomerDepth[],
  asOf: Date,
  days: LtvFlagshipWindow,
  options?: { minMature?: number },
): { rate: number | null; n: number } {
  const minMature = options?.minMature ?? FLAGSHIP_MIN_MATURE;
  const mature = matureForWindow(customers, asOf, days);
  if (mature.length < minMature) return { rate: null, n: mature.length };
  let back = 0;
  for (const c of mature) {
    if (c.reorderDays != null && c.reorderDays <= days) back += 1;
  }
  return { rate: back / mature.length, n: mature.length };
}

/**
 * Average net dollars through the window among buyers who have lived it.
 * Null when too few buyers have lived the window — never $0 LTV.
 */
export function windowRevenue(
  customers: CustomerDepth[],
  asOf: Date,
  days: LtvFlagshipWindow,
  options?: { minMature?: number },
): { revenue: number | null; n: number } {
  const minMature = options?.minMature ?? FLAGSHIP_MIN_MATURE;
  const mature = matureForWindow(customers, asOf, days);
  if (mature.length < minMature) return { revenue: null, n: mature.length };
  return {
    revenue: mean(mature.map((c) => windowSpend(c, days))),
    n: mature.length,
  };
}

/**
 * Dollars this window added after the previous window, among the same
 * buyers who have lived the longer window. Never subtracts a larger 30-day
 * pool from a smaller 90-day pool — that mix is not a lift.
 */
function addedAfterPriorAmong(
  customers: CustomerDepth[],
  asOf: Date,
  days: LtvFlagshipWindow,
  minMature: number,
): { added: number; afterDays: 30 | 90 } | null {
  if (days === 30) return null;
  const afterDays: 30 | 90 = days === 90 ? 30 : 90;
  const mature = matureForWindow(customers, asOf, days);
  if (mature.length < minMature) return null;
  const current = mean(mature.map((c) => windowSpend(c, days)));
  const prior = mean(mature.map((c) => windowSpend(c, afterDays)));
  if (current == null || prior == null) return null;
  return { added: current - prior, afterDays };
}

/**
 * Blended 30 / 90 / 365 come-back + revenue. A point stays null when that
 * horizon has not matured for enough buyers (a thin or young book cannot
 * seal a year — that is not a 60-day cap when full history is on file).
 */
export function flagshipWindowCurve(
  customers: CustomerDepth[],
  asOf: Date,
  options?: { minMature?: number },
): FlagshipWindowCurve | null {
  if (customers.length === 0) return null;
  const minMature = options?.minMature ?? FLAGSHIP_MIN_MATURE;
  const points = LTV_FLAGSHIP_WINDOWS.map((days) => {
    const retain = windowRetention(customers, asOf, days, options);
    const rev = windowRevenue(customers, asOf, days, options);
    const added =
      rev.revenue != null
        ? addedAfterPriorAmong(customers, asOf, days, minMature)
        : null;
    return {
      days,
      label: windowLabel(days),
      retention: retain.rate,
      revenue: rev.revenue,
      n: Math.max(retain.n, rev.n),
      added: added?.added ?? null,
      afterDays: added?.afterDays ?? null,
    };
  });
  if (points.every((p) => p.retention == null && p.revenue == null)) return null;
  return { points };
}

function monthWindowCell(
  members: CustomerDepth[],
  asOf: Date,
  days: LtvFlagshipWindow,
): {
  retain: number | null;
  revenue: number | null;
  grossRevenue: number | null;
  n: number;
} {
  const mature = matureForWindow(members, asOf, days);
  if (mature.length === 0) {
    return { retain: null, revenue: null, grossRevenue: null, n: 0 };
  }
  let back = 0;
  for (const c of mature) {
    if (c.reorderDays != null && c.reorderDays <= days) back += 1;
  }
  const grossValues: number[] = [];
  let grossKnown = true;
  for (const customer of mature) {
    const gross = windowGross(customer, days);
    if (gross == null) {
      grossKnown = false;
      break;
    }
    grossValues.push(gross);
  }
  return {
    retain: back / mature.length,
    revenue: mean(mature.map((c) => windowSpend(c, days))),
    grossRevenue: grossKnown ? mean(grossValues) : null,
    n: mature.length,
  };
}

/**
 * Per first-order month: 30 / 90 / 365 come-back share and dollars per buyer.
 * Young months keep later columns as null (—), never a sealed 0% / $0 year.
 */
export function flagshipMonthRows(
  customers: CustomerDepth[],
  asOf: Date,
  options?: { maxRows?: number },
): FlagshipMonthRow[] {
  const maxRows = options?.maxRows ?? FLAGSHIP_MAX_MONTH_ROWS;
  const groups = new Map<string, CustomerDepth[]>();
  for (const c of customers) {
    const list = groups.get(c.cohortMonth) ?? [];
    list.push(c);
    groups.set(c.cohortMonth, list);
  }
  const months = [...groups.keys()].sort();
  const rows: FlagshipMonthRow[] = [];
  for (const cohortMonth of months.slice(-maxRows)) {
    const members = groups.get(cohortMonth) ?? [];
    if (members.length === 0) continue;
    const d30 = monthWindowCell(members, asOf, 30);
    const d90 = monthWindowCell(members, asOf, 90);
    const d365 = monthWindowCell(members, asOf, 365);
    rows.push({
      cohortMonth,
      label: monthLabel(cohortMonth),
      customers: members.length,
      retain30: d30.retain,
      retain90: d90.retain,
      retain365: d365.retain,
      rev30: d30.revenue,
      rev90: d90.revenue,
      rev365: d365.revenue,
      grossRev30: d30.grossRevenue,
      grossRev90: d90.grossRevenue,
      grossRev365: d365.grossRevenue,
      n30: d30.n,
      n90: d90.n,
      n365: d365.n,
    });
  }
  return rows;
}

// —— 30 / 90 / 365 triangle + revenue by first-order month ————————————————

export type WindowTriangleEmptyKind = "syncing" | "thin" | "young";

export interface WindowTriangleCell {
  days: LtvFlagshipWindow;
  header: string;
  /** Come-back share once enough buyers have lived the window. */
  retention: number | null;
  /** Net dollars per buyer once enough buyers have lived the window. */
  revenue: number | null;
  /**
   * Gross order revenue per buyer once enough buyers have lived the window
   * and every order in it had a known gross. Null is a blank — not $0.
   */
  grossRevenue: number | null;
  /** Buyers who have lived the window, even when the cell stays blank. */
  n: number;
}

export interface WindowTriangleRow {
  monthKey: string;
  label: string;
  customers: number;
  cells: WindowTriangleCell[];
}

export interface WindowTriangleView {
  kind: "ready" | WindowTriangleEmptyKind;
  rows: WindowTriangleRow[];
  copy: string;
  verb: string;
}

function triangleHeader(days: LtvFlagshipWindow): string {
  switch (days) {
    case 30:
      return "30 days";
    case 90:
      return "90 days";
    case 365:
      return "First year";
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

/**
 * A cell paints only after {@link FLAGSHIP_MIN_MATURE} buyers in that
 * first-order month have lived the window. Fewer than that stays blank —
 * one shopper is not a come-back rate, and a young month is not $0.
 */
function paintWindow(value: number | null, n: number): number | null {
  if (value == null || n < FLAGSHIP_MIN_MATURE) return null;
  return value;
}

function triangleCells(row: FlagshipMonthRow): WindowTriangleCell[] {
  const specs: Array<{
    days: LtvFlagshipWindow;
    retention: number | null;
    revenue: number | null;
    grossRevenue: number | null;
    n: number;
  }> = [
    {
      days: 30,
      retention: row.retain30,
      revenue: row.rev30,
      grossRevenue: row.grossRev30,
      n: row.n30,
    },
    {
      days: 90,
      retention: row.retain90,
      revenue: row.rev90,
      grossRevenue: row.grossRev90,
      n: row.n90,
    },
    {
      days: 365,
      retention: row.retain365,
      revenue: row.rev365,
      grossRevenue: row.grossRev365,
      n: row.n365,
    },
  ];
  return specs.map((spec) => ({
    days: spec.days,
    header: triangleHeader(spec.days),
    retention: paintWindow(spec.retention, spec.n),
    revenue: paintWindow(spec.revenue, spec.n),
    grossRevenue: paintWindow(spec.grossRevenue, spec.n),
    n: spec.n,
  }));
}

/**
 * 30 / 90 / 365 come-back triangle and the dollars beside it, one row per
 * first-order month. Ready only when two months exist and at least one cell
 * has sealed. Otherwise an honest empty — syncing, one month, or too young.
 */
export function firstOrderWindowTriangle(
  rows: FlagshipMonthRow[],
  buyers: number,
): WindowTriangleView {
  const shaped = rows.map((row) => ({
    monthKey: row.cohortMonth,
    label: row.label,
    customers: row.customers,
    cells: triangleCells(row),
  }));
  const sealed = shaped.some((row) =>
    row.cells.some((cell) => cell.retention != null || cell.revenue != null),
  );
  if (sealed && shaped.length >= 2) {
    return {
      kind: "ready",
      rows: shaped,
      copy: "Each first-order month, then who came back and what they spent in 30 days, 90 days, and the first year. The blank corner is a window not lived by enough buyers yet — not 0%, not $0.",
      verb: "Read the triangle",
    };
  }
  if (buyers <= 0) {
    return {
      kind: "syncing",
      rows: [],
      copy: "Orders still syncing — not $0. Come-back and dollars by first-order month fill as identified buyers land.",
      verb: "Refresh this page",
    };
  }
  if (shaped.length < 2) {
    return {
      kind: "thin",
      rows: shaped,
      copy: "Needs two first-order months. Blank is not 0% — the triangle fills as months pass. Order history only.",
      verb: "Watch the next month",
    };
  }
  return {
    kind: "young",
    rows: shaped,
    copy: `First 30 days seals once ${FLAGSHIP_MIN_MATURE} buyers in a first-order month have lived 30 days — not $0.`,
    verb: "Wait for day 30",
  };
}

// —— Transparent predictive LTV (historical analog, written out) ————————————

export interface PredictiveLtv {
  /** Average first-order dollars among buyers who have lived 90 days. */
  firstOrder90: number | null;
  /** Average extra orders in the first 90 days (zeros included). */
  extraOrders90: number | null;
  /** Average later-order dollars among 90-day repeaters. */
  laterOrder90: number | null;
  /** firstOrder90 + extraOrders90 × laterOrder90 */
  predicted90: number | null;
  /** Observed first-90 average among the same mature buyers. */
  observed90: number | null;
  nMature90: number;
  firstOrder365: number | null;
  extraOrders365: number | null;
  laterOrder365: number | null;
  predicted365: number | null;
  observed365: number | null;
  nMature365: number;
  formula90: string;
  formula365: string | null;
}

function laterOrderAverage(
  mature: CustomerDepth[],
  days: LtvFlagshipWindow,
): number | null {
  const later: number[] = [];
  for (const c of mature) {
    const extra = Math.max(0, windowOrders(c, days) - 1);
    if (extra <= 0) continue;
    const extraDollars = Math.max(0, windowSpend(c, days) - c.firstAmount);
    later.push(extraDollars / extra);
  }
  return mean(later);
}

function extraOrderAverage(
  mature: CustomerDepth[],
  days: LtvFlagshipWindow,
): number | null {
  if (mature.length === 0) return null;
  return mean(mature.map((c) => Math.max(0, windowOrders(c, days) - 1)));
}

function predictedFromParts(
  firstOrder: number | null,
  extraOrders: number | null,
  laterOrder: number | null,
): number | null {
  if (firstOrder == null) return null;
  return firstOrder + (extraOrders ?? 0) * (laterOrder ?? 0);
}

function formulaLine(
  label: string,
  firstOrder: number,
  extraOrders: number,
  laterOrder: number,
  predicted: number,
): string {
  const later = laterOrder > 0 ? laterOrder : 0;
  return (
    `${label} ≈ average first order + average extra orders × average later order` +
    ` → ${firstOrder.toFixed(2)} + ${extraOrders.toFixed(2)} × ${later.toFixed(2)}` +
    ` = ${predicted.toFixed(2)}`
  );
}

/**
 * Historical-analog estimate written as algebra — not a hidden model.
 *
 * First 90 days ≈ average first order
 *   + average extra orders in those 90 days
 *   × average later-order dollars
 *
 * Taken only among buyers whose first order is at least 90 days ago.
 * First year uses the same shape among buyers with a full year on file.
 * A missing year stays null until enough buyers have lived a year —
 * never an invented 365.
 */
export function predictiveLtv(
  customers: CustomerDepth[],
  asOf: Date,
  options?: { minMature?: number },
): PredictiveLtv | null {
  const minMature = options?.minMature ?? FLAGSHIP_MIN_MATURE;
  const mature90 = matureForWindow(customers, asOf, 90);
  const mature365 = matureForWindow(customers, asOf, 365);

  const firstOrder90 = mean(mature90.map((c) => c.firstAmount));
  const extraOrders90 = extraOrderAverage(mature90, 90);
  const laterOrder90 = laterOrderAverage(mature90, 90);
  const predicted90 =
    mature90.length >= minMature
      ? predictedFromParts(firstOrder90, extraOrders90, laterOrder90)
      : null;
  const observed90 =
    mature90.length >= minMature
      ? mean(mature90.map((c) => c.day90Spend))
      : null;

  const firstOrder365 = mean(mature365.map((c) => c.firstAmount));
  const extraOrders365 = extraOrderAverage(mature365, 365);
  const laterOrder365 = laterOrderAverage(mature365, 365);
  const predicted365 =
    mature365.length >= minMature
      ? predictedFromParts(firstOrder365, extraOrders365, laterOrder365)
      : null;
  const observed365 =
    mature365.length >= minMature
      ? mean(mature365.map((c) => c.day365Spend))
      : null;

  if (predicted90 == null && predicted365 == null) return null;

  return {
    firstOrder90: mature90.length >= minMature ? firstOrder90 : null,
    extraOrders90: mature90.length >= minMature ? extraOrders90 : null,
    laterOrder90: mature90.length >= minMature ? laterOrder90 : null,
    predicted90,
    observed90,
    nMature90: mature90.length,
    firstOrder365: mature365.length >= minMature ? firstOrder365 : null,
    extraOrders365: mature365.length >= minMature ? extraOrders365 : null,
    laterOrder365: mature365.length >= minMature ? laterOrder365 : null,
    predicted365,
    observed365,
    nMature365: mature365.length,
    formula90:
      predicted90 != null &&
      firstOrder90 != null &&
      extraOrders90 != null
        ? formulaLine(
            "First 90 days",
            firstOrder90,
            extraOrders90,
            laterOrder90 ?? 0,
            predicted90,
          )
        : "First 90 days ≈ average first order + average extra orders × average later order. Not enough buyers have lived 90 days yet.",
    formula365:
      predicted365 != null &&
      firstOrder365 != null &&
      extraOrders365 != null
        ? formulaLine(
            "First year",
            firstOrder365,
            extraOrders365,
            laterOrder365 ?? 0,
            predicted365,
          )
        : null,
  };
}

// —— Refund honesty (net of refunds when gross is on file) ——————————————————

export type RefundHonestyBasis =
  | "shopify_current_total"
  | "sample_gross_known"
  | "unknown";

export interface RefundHonesty {
  /**
   * True only when at least one order carried a known gross above net.
   * False means we do not invent a refund total — not “$0 refunds.”
   */
  brokenOut: boolean;
  /** Net shop dollars (the LTV numerator). */
  netDollars: number;
  /** Σ (gross − net) on orders that carried a known gross, else null. */
  refundedDollars: number | null;
  /** Refunded ÷ (net + refunded) when refunds are broken out. */
  refundShare: number | null;
  orderCount: number;
  refundedOrderCount: number | null;
  basis: RefundHonestyBasis;
}

/**
 * Refund honesty from order rows. Live facts store Shopify Total Sales
 * (`currentTotalPriceSet`, already net). SAMPLE may carry `grossAmount` so
 * the haircut is visible. A missing gross is never filled in.
 */
export function refundHonesty(
  orders: DepthOrder[],
  options: { sample: boolean },
): RefundHonesty {
  let netDollars = 0;
  let refundedDollars = 0;
  let knownGross = 0;
  let refundedOrderCount = 0;
  let orderCount = 0;

  for (const o of orders) {
    if (!o.customerKey) continue;
    if (!Number.isFinite(o.amount)) continue;
    const net = Math.max(0, o.amount);
    orderCount += 1;
    netDollars += net;
    if (o.grossAmount == null || !Number.isFinite(o.grossAmount)) continue;
    knownGross += 1;
    const gross = Math.max(net, o.grossAmount);
    const refunded = Math.max(0, gross - net);
    refundedDollars += refunded;
    if (refunded > 0.005) refundedOrderCount += 1;
  }

  const brokenOut = knownGross > 0 && refundedDollars > 0;
  let basis: RefundHonestyBasis;
  if (brokenOut && options.sample) {
    basis = "sample_gross_known";
  } else if (options.sample) {
    basis = "sample_gross_known";
  } else if (orderCount > 0) {
    basis = "shopify_current_total";
  } else {
    basis = "unknown";
  }

  if (!brokenOut) {
    return {
      brokenOut: false,
      netDollars,
      refundedDollars: null,
      refundShare: null,
      orderCount,
      refundedOrderCount: null,
      basis,
    };
  }

  const gross = netDollars + refundedDollars;
  return {
    brokenOut: true,
    netDollars,
    refundedDollars,
    refundShare: gross > 0 ? refundedDollars / gross : null,
    orderCount,
    refundedOrderCount,
    basis,
  };
}

// —— Path LTV clarity (best journey vs shop, same-product share) ————————————

export interface PathClarity {
  bestLifetime: PathLtvRow;
  best90: PathLtvRow | null;
  /** Best-journey lifetime ÷ shop average lifetime. */
  lift: number | null;
  /** Share of named-journey buyers who bought the same product again. */
  sameProductShare: number | null;
  shopLifetime: number;
}

/**
 * One-screen read on first→second journeys: the highest-LTV path, its lift
 * versus the shop average, and how often the second order is the same product.
 * Null when no named journeys cleared the buyer floor (live titles hidden).
 */
export function pathClarity(
  paths: PathLtvRow[],
  customers: CustomerDepth[],
): PathClarity | null {
  if (paths.length === 0 || customers.length === 0) return null;
  const shopLifetime = mean(customers.map((c) => c.lifetimeSpend));
  if (shopLifetime == null || shopLifetime <= 0) return null;
  const bestLifetime = paths.reduce((lead, row) =>
    row.lifetimeLtv > lead.lifetimeLtv ? row : lead,
  );
  const matured90 = paths.filter((row) => row.day90N > 0);
  const best90 =
    matured90.length > 0
      ? matured90.reduce((lead, row) =>
          row.day90Ltv > lead.day90Ltv ? row : lead,
        )
      : null;
  const pathBuyers = paths.reduce((sum, row) => sum + row.buyers, 0);
  const sameBuyers = paths
    .filter((row) => row.samePath)
    .reduce((sum, row) => sum + row.buyers, 0);
  return {
    bestLifetime,
    best90,
    lift: bestLifetime.lifetimeLtv / shopLifetime,
    sameProductShare: pathBuyers > 0 ? sameBuyers / pathBuyers : null,
    shopLifetime,
  };
}

/**
 * Same-buyer dollars this window added after the prior window.
 * Day 30 has no prior — null (the card is the start, not a lift).
 * Reads the curve’s same-buyer lift; never a mixed-pool subtraction.
 */
export function windowAddedAfterPrior(
  points: FlagshipWindowPoint[],
  days: LtvFlagshipWindow,
): { added: number; afterDays: 30 | 90 } | null {
  if (days === 30) return null;
  const point = points.find((p) => p.days === days);
  if (point?.added == null || point.afterDays == null) return null;
  return { added: point.added, afterDays: point.afterDays };
}

export type FlagshipEmptyKind = "syncing" | "thin" | "young";

export interface FlagshipEmpty {
  kind: FlagshipEmptyKind;
  buyers: number;
  /** How many identified buyers seal a window. */
  need: number;
  copy: string;
  /** One next step — ActionCard-shaped, not a dump. */
  verb: string;
}

/**
 * First-win empty when 30/90/365 has not sealed. Never a blank board.
 * Syncing / thin / young — not $0 LTV, not a missing chart.
 */
export function flagshipEmptyState(
  windows: FlagshipWindowCurve | null,
  buyers: number,
): FlagshipEmpty | null {
  if (windows) return null;
  const need = FLAGSHIP_MIN_MATURE;
  if (buyers <= 0) {
    return {
      kind: "syncing",
      buyers: 0,
      need,
      copy: "Orders still syncing — not $0. First 30 days, 90 days, and the first year fill as identified buyers land.",
      verb: "Refresh this page",
    };
  }
  if (buyers < need) {
    return {
      kind: "thin",
      buyers,
      need,
      copy: `${buyers.toLocaleString()} identified ${buyers === 1 ? "buyer" : "buyers"} on file. Windows seal after ${need} have lived 30 days — not $0.`,
      verb: "Watch first 30 days",
    };
  }
  return {
    kind: "young",
    buyers,
    need,
    copy: `${buyers.toLocaleString()} buyers on file. First 30 days seals once those buyers have lived 30 days — not $0.`,
    verb: "Wait for day 30",
  };
}

/** One-glance daily job: worth, come-back, estimate — no spend. */
export interface FlagshipDailyRead {
  worth: number;
  worthDays: LtvFlagshipWindow;
  comeBack: number | null;
  buyers: number;
  estimate: number | null;
  observed: number | null;
  firstOrder: number | null;
  laterInWindow: number | null;
  yearPending: boolean;
}

/**
 * The morning read on LTV. Prefers first 90 days (the desk hero), then 30,
 * never a sealed year when that window is not on file.
 */
export function flagshipDailyRead(
  windows: FlagshipWindowCurve | null,
  predictive: PredictiveLtv | null,
): FlagshipDailyRead | null {
  if (!windows) return null;
  const prefer: LtvFlagshipWindow[] = [90, 30, 365];
  let pick: FlagshipWindowPoint | null = null;
  for (const days of prefer) {
    const point = windows.points.find((p) => p.days === days);
    if (point?.revenue != null) {
      pick = point;
      break;
    }
  }
  if (pick?.revenue == null) return null;
  const year = windows.points.find((p) => p.days === 365);
  const firstOrder =
    pick.days === 90 ? (predictive?.firstOrder90 ?? null) : null;
  const laterInWindow =
    firstOrder != null ? pick.revenue - firstOrder : null;
  return {
    worth: pick.revenue,
    worthDays: pick.days,
    comeBack: pick.retention,
    buyers: pick.n,
    estimate: pick.days === 90 ? (predictive?.predicted90 ?? null) : null,
    observed: pick.days === 90 ? (predictive?.observed90 ?? null) : null,
    firstOrder,
    laterInWindow,
    yearPending: year?.revenue == null,
  };
}

/** Depth pack plus the flagship 30/90/365 / predictive / refund / path cards. */
export interface LtvFlagshipView extends LtvDepthView {
  windows: FlagshipWindowCurve | null;
  monthWindows: FlagshipMonthRow[];
  predictive: PredictiveLtv | null;
  /**
   * P1-D expected value beside the realized triangle.
   * Average order value × expected orders. Null inputs stay a dash.
   */
  expectedLtv: ExpectedLtvEstimate;
  refunds: RefundHonesty;
  pathClarity: PathClarity | null;
  /** First-product → LTV / path drivers from titled first-line items. */
  productLtv: ProductLtvView;
  /** LTV-chip table: first product, first-order count, revenue from those buyers. */
  firstProductDrivers: FirstProductDriversView;
  /** First-order promo → LTV / lift vs full-price first. */
  promoLtv: PromoLtvView;
}

/**
 * One pass: existing depth pack, then the compete cards. Reuses the same
 * customer roll-up — no second Shopify crawl.
 */
export function buildLtvFlagship(
  orders: DepthOrder[],
  asOf: Date,
  options: { sample: boolean },
): LtvFlagshipView {
  const view = buildLtvDepth(orders, asOf, options);
  const customers = rollUpCustomers(orders);
  return {
    ...view,
    windows: flagshipWindowCurve(customers, asOf),
    monthWindows: flagshipMonthRows(customers, asOf),
    predictive: predictiveLtv(customers, asOf),
    expectedLtv: expectedLtvFromRetention(customers, asOf),
    refunds: refundHonesty(orders, options),
    pathClarity: pathClarity(view.paths, customers),
    productLtv: buildProductLtv(orders, asOf),
    firstProductDrivers: buildFirstProductDrivers(orders),
    promoLtv: buildPromoLtv(orders, asOf),
  };
}
