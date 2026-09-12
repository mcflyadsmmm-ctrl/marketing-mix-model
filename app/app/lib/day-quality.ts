/**
 * Day-quality period board — orders / AOV / new-sales share / spend / ROAS
 * on one screen. Pure math; no Prisma. Shopify Analytics will not put this join
 * on Overview.
 *
 * A day with no sales fact is left out of the board entirely — a missing fact
 * is not a $0 sales day. `coverage` reports the shortfall so the merchant can
 * see the board is thinner than the period instead of reading holes as zeros.
 */

export type DayQualityFact = {
  sales: number;
  orderCount: number;
  newCustomerNetSales?: number | null;
  returningCustomerNetSales?: number | null;
};

export type DayQualityRow = {
  /** `YYYY-MM-DD` day key, or `YYYY-Www` when the board rolled up to weeks. */
  dayKey: string;
  label: string;
  orders: number;
  sales: number;
  aov: number | null;
  newSales: number | null;
  newShare: number | null;
  spend: number;
  /** sales ÷ spend when spend > 0 (cash MER). */
  roas: number | null;
  band: "above" | "near" | "below" | null;
  partial: boolean;
};

export type DayQualityTotals = {
  orders: number;
  sales: number;
  aov: number | null;
  newSales: number | null;
  newShare: number | null;
  spend: number;
  roas: number | null;
};

export type DayQualityTable = {
  /** Newest first. */
  rows: DayQualityRow[];
  totals: DayQualityTotals;
  prior: DayQualityTotals | null;
  coverage: {
    factDays: number;
    expectedClosedDays: number;
    daysWithSpend: number;
    daysInPeriod: number;
  };
  customerSplitAvailable: boolean;
  granularity: "day" | "week";
};

export type BuildDayQualityInput = {
  factRows: Map<string, DayQualityFact> | Record<string, DayQualityFact>;
  spendByDay: Map<string, number> | Record<string, number>;
  periodStartKey: string;
  periodEndKey: string;
  todayKey: string;
  /** Cash break-even MER (sales÷spend). Null → no band. */
  breakEvenMer: number | null;
  priorFactRows?:
    | Map<string, DayQualityFact>
    | Record<string, DayQualityFact>
    | null;
  priorSpendByDay?: Map<string, number> | Record<string, number> | null;
  priorStartKey?: string | null;
  priorEndKey?: string | null;
  /** Force week buckets (auto when period ≥ 62 days). */
  granularity?: "day" | "week";
};

function asFactMap(
  rows: Map<string, DayQualityFact> | Record<string, DayQualityFact>,
): Map<string, DayQualityFact> {
  return rows instanceof Map ? rows : new Map(Object.entries(rows));
}

function asSpendMap(
  rows: Map<string, number> | Record<string, number>,
): Map<string, number> {
  return rows instanceof Map ? rows : new Map(Object.entries(rows));
}

/** A non-finite or negative amount is never money the board shows. */
function safeMoney(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

/** Same guard, but an absent split stays absent instead of collapsing to $0. */
function safeOptionalMoney(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.max(0, value);
}

function safeOrders(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

/** Inclusive day count between YYYY-MM-DD keys. */
export function inclusiveDayCount(startKey: string, endKey: string): number {
  const start = Date.parse(`${startKey}T12:00:00Z`);
  const end = Date.parse(`${endKey}T12:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

function addDaysKey(dayKey: string, delta: number): string {
  const t = Date.parse(`${dayKey}T12:00:00Z`);
  const d = new Date(t + delta * 86_400_000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 3-year periods are ~1.1k days; the cap only catches an unparseable key. */
const MAX_PERIOD_DAYS = 5000;

function eachDayKey(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  if (!startKey || !endKey || startKey > endKey) return out;
  let cursor = startKey;
  while (cursor <= endKey && out.length < MAX_PERIOD_DAYS) {
    out.push(cursor);
    cursor = addDaysKey(cursor, 1);
  }
  return out;
}

export function formatDayQualityLabel(dayKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey.trim());
  if (!m) return dayKey;
  const d = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12),
  );
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Monday-start ISO-ish week key `YYYY-Www`. */
function weekKeyFromDay(dayKey: string): string {
  const t = Date.parse(`${dayKey}T12:00:00Z`);
  const d = new Date(t);
  const day = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** ±5% dead zone around break-even — noise is not a verdict. */
const BAND_MARGIN = 0.05;

/**
 * Compared as a ratio (not `rail * 1.05`) because `3 * 1.05` lands above
 * `3.15` in binary floating point, which would band a day sitting exactly on
 * the threshold as "near".
 */
function resolveBand(
  roas: number | null,
  breakEvenMer: number | null,
): DayQualityRow["band"] {
  if (roas == null || !Number.isFinite(roas)) return null;
  if (breakEvenMer == null || !Number.isFinite(breakEvenMer)) return null;
  if (breakEvenMer <= 0) return null;
  const ratio = roas / breakEvenMer;
  const epsilon = 1e-9;
  if (ratio >= 1 + BAND_MARGIN - epsilon) return "above";
  if (ratio < 1 - BAND_MARGIN - epsilon) return "below";
  return "near";
}

function sumFacts(
  keys: string[],
  facts: Map<string, DayQualityFact>,
  spend: Map<string, number>,
): {
  orders: number;
  sales: number;
  newSales: number | null;
  returningSales: number | null;
  spend: number;
  splitKnown: boolean;
} {
  let orders = 0;
  let sales = 0;
  let newSales = 0;
  let returningSales = 0;
  let spendTotal = 0;
  let splitKnown = true;
  let any = false;
  for (const key of keys) {
    const fact = facts.get(key);
    if (!fact) continue;
    any = true;
    orders += safeOrders(fact.orderCount);
    sales += safeMoney(fact.sales);
    spendTotal += safeMoney(spend.get(key));
    const dayNew = safeOptionalMoney(fact.newCustomerNetSales);
    const dayReturning = safeOptionalMoney(fact.returningCustomerNetSales);
    // One day missing the split makes the whole sum a guess — say so with null
    // rather than add a partial column that reads like the period total.
    if (dayNew == null || dayReturning == null) {
      splitKnown = false;
    } else {
      newSales += dayNew;
      returningSales += dayReturning;
    }
  }
  if (!any) {
    return {
      orders: 0,
      sales: 0,
      newSales: null,
      returningSales: null,
      spend: 0,
      splitKnown: false,
    };
  }
  return {
    orders,
    sales,
    newSales: splitKnown ? newSales : null,
    returningSales: splitKnown ? returningSales : null,
    spend: spendTotal,
    splitKnown,
  };
}

function toTotals(sum: {
  orders: number;
  sales: number;
  newSales: number | null;
  returningSales: number | null;
  spend: number;
}): DayQualityTotals {
  const attributed =
    sum.newSales != null && sum.returningSales != null
      ? sum.newSales + sum.returningSales
      : null;
  return {
    orders: sum.orders,
    sales: sum.sales,
    aov: sum.orders > 0 ? sum.sales / sum.orders : null,
    newSales: sum.newSales,
    newShare:
      attributed != null && attributed > 0 && sum.newSales != null
        ? sum.newSales / attributed
        : null,
    spend: sum.spend,
    roas: sum.spend > 0 ? sum.sales / sum.spend : null,
  };
}

/**
 * Build the period day-quality board. Omits days with no sales fact (never
 * invents $0 sales). Newest row first.
 */
export function buildDayQuality(input: BuildDayQualityInput): DayQualityTable {
  const facts = asFactMap(input.factRows);
  const spend = asSpendMap(input.spendByDay);
  const start = input.periodStartKey.trim();
  const end = input.periodEndKey.trim();
  const today = input.todayKey.trim();
  const daysInPeriod = inclusiveDayCount(start, end);

  const closedEnd = today && today <= end ? addDaysKey(today, -1) : end;
  const expectedClosedDays =
    start && closedEnd && closedEnd >= start
      ? inclusiveDayCount(start, closedEnd)
      : 0;

  const calendarDays = eachDayKey(start, end);
  const periodDays = calendarDays.filter((k) => facts.has(k));
  // Every spend day in the window counts, fact row or not — otherwise a day
  // with entered spend and no sales fact would vanish from coverage too.
  const daysWithSpend = calendarDays.filter(
    (k) => safeMoney(spend.get(k)) > 0,
  ).length;

  const granularity: "day" | "week" =
    input.granularity ?? (daysInPeriod >= 62 ? "week" : "day");

  let customerSplitAvailable = false;
  const rows: DayQualityRow[] = [];

  if (granularity === "day") {
    for (const dayKey of periodDays) {
      const fact = facts.get(dayKey)!;
      const daySpend = safeMoney(spend.get(dayKey));
      const orders = safeOrders(fact.orderCount);
      const sales = safeMoney(fact.sales);
      const newSales = safeOptionalMoney(fact.newCustomerNetSales);
      const returningSales = safeOptionalMoney(
        fact.returningCustomerNetSales,
      );
      const attributed =
        newSales != null && returningSales != null
          ? newSales + returningSales
          : null;
      if (attributed != null && attributed > 0) customerSplitAvailable = true;
      const roas = daySpend > 0 ? sales / daySpend : null;
      rows.push({
        dayKey,
        label: formatDayQualityLabel(dayKey),
        orders,
        sales,
        aov: orders > 0 ? sales / orders : null,
        newSales,
        newShare:
          attributed != null && attributed > 0 && newSales != null
            ? newSales / attributed
            : null,
        spend: daySpend,
        roas,
        band: resolveBand(roas, input.breakEvenMer),
        partial: dayKey === today,
      });
    }
    rows.sort((a, b) =>
      a.dayKey < b.dayKey ? 1 : a.dayKey > b.dayKey ? -1 : 0,
    );
  } else {
    const byWeek = new Map<string, string[]>();
    for (const dayKey of periodDays) {
      const wk = weekKeyFromDay(dayKey);
      const list = byWeek.get(wk) ?? [];
      list.push(dayKey);
      byWeek.set(wk, list);
    }
    const weekKeys = [...byWeek.keys()].sort((a, b) => (a < b ? 1 : -1));
    for (const wk of weekKeys) {
      const keys = (byWeek.get(wk) ?? []).sort();
      const sum = sumFacts(keys, facts, spend);
      const weekAttributed =
        sum.newSales != null && sum.returningSales != null
          ? sum.newSales + sum.returningSales
          : null;
      if (weekAttributed != null && weekAttributed > 0) {
        customerSplitAvailable = true;
      }
      const roas = sum.spend > 0 ? sum.sales / sum.spend : null;
      const first = keys[0]!;
      const last = keys[keys.length - 1]!;
      rows.push({
        dayKey: wk,
        label: `${formatDayQualityLabel(first)}–${formatDayQualityLabel(last)}`,
        orders: sum.orders,
        sales: sum.sales,
        aov: sum.orders > 0 ? sum.sales / sum.orders : null,
        newSales: sum.newSales,
        newShare:
          weekAttributed != null && weekAttributed > 0 && sum.newSales != null
            ? sum.newSales / weekAttributed
            : null,
        spend: sum.spend,
        roas,
        band: resolveBand(roas, input.breakEvenMer),
        partial: keys.includes(today),
      });
    }
  }

  const totals = toTotals(sumFacts(periodDays, facts, spend));

  let prior: DayQualityTotals | null = null;
  if (input.priorFactRows && input.priorStartKey && input.priorEndKey) {
    const priorFacts = asFactMap(input.priorFactRows);
    const priorSpend = asSpendMap(input.priorSpendByDay ?? {});
    const priorKeys = eachDayKey(
      input.priorStartKey.trim(),
      input.priorEndKey.trim(),
    ).filter((k) => priorFacts.has(k));
    if (priorKeys.length > 0) {
      prior = toTotals(sumFacts(priorKeys, priorFacts, priorSpend));
    }
  }

  return {
    rows,
    totals,
    prior,
    coverage: {
      factDays: periodDays.length,
      expectedClosedDays,
      daysWithSpend,
      daysInPeriod,
    },
    customerSplitAvailable,
    granularity,
  };
}

/**
 * CSV download for the period board (Sheets replacement). `day` is the sortable
 * key (`YYYY-MM-DD`, or `YYYY-Www` on a week board); `period` is the desk label.
 */
export function formatDayQualityCsv(table: DayQualityTable): string {
  const headers = [
    "day",
    "period",
    "orders",
    "sales",
    "aov",
    "new_sales",
    "new_share",
    "spend",
    "roas",
    "band",
    "partial",
  ];
  const lines = [headers.join(",")];
  const esc = (v: string | number | null | boolean) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  for (const row of table.rows) {
    lines.push(
      [
        row.dayKey,
        row.label,
        row.orders,
        row.sales.toFixed(2),
        row.aov != null ? row.aov.toFixed(2) : "",
        row.newSales != null ? row.newSales.toFixed(2) : "",
        row.newShare != null ? (row.newShare * 100).toFixed(1) : "",
        row.spend.toFixed(2),
        row.roas != null ? row.roas.toFixed(2) : "",
        row.band ?? "",
        row.partial ? "1" : "0",
      ]
        .map(esc)
        .join(","),
    );
  }
  lines.push(
    [
      "TOTAL",
      "Total",
      table.totals.orders,
      table.totals.sales.toFixed(2),
      table.totals.aov != null ? table.totals.aov.toFixed(2) : "",
      table.totals.newSales != null ? table.totals.newSales.toFixed(2) : "",
      table.totals.newShare != null
        ? (table.totals.newShare * 100).toFixed(1)
        : "",
      table.totals.spend.toFixed(2),
      table.totals.roas != null ? table.totals.roas.toFixed(2) : "",
      "",
      "",
    ]
      .map(esc)
      .join(","),
  );
  return `${lines.join("\n")}\n`;
}

export type DayQualityInsight = {
  /** Best closed day/week by sales (skips partial today). */
  best: { label: string; sales: number; orders: number } | null;
  /** Softest closed day/week by sales among rows with orders. */
  softest: { label: string; sales: number; orders: number } | null;
  /** AOV change vs prior totals when both exist. */
  aovDeltaPct: number | null;
  /**
   * True when strongest/softest are only among loaded fact days — not the
   * full closed period. Merchants must not read that as a final ranking.
   */
  amongFilledDays: boolean;
};

/**
 * One-line merchant answers from the day board — no spend required.
 * Skips partial “today” so open days do not win best/worst.
 */
export function summarizeDayQuality(table: DayQualityTable): DayQualityInsight {
  const closed = table.rows.filter((row) => !row.partial && row.orders > 0);
  let best: DayQualityInsight["best"] = null;
  let softest: DayQualityInsight["softest"] = null;
  for (const row of closed) {
    if (!best || row.sales > best.sales) {
      best = { label: row.label, sales: row.sales, orders: row.orders };
    }
    if (!softest || row.sales < softest.sales) {
      softest = { label: row.label, sales: row.sales, orders: row.orders };
    }
  }
  if (best && softest && best.label === softest.label) {
    softest = null;
  }

  let aovDeltaPct: number | null = null;
  if (
    table.totals.aov != null &&
    table.prior?.aov != null &&
    table.prior.aov > 0
  ) {
    aovDeltaPct = ((table.totals.aov - table.prior.aov) / table.prior.aov) * 100;
  }

  const amongFilledDays =
    table.coverage.expectedClosedDays > 0 &&
    table.coverage.factDays < table.coverage.expectedClosedDays;

  return { best, softest, aovDeltaPct, amongFilledDays };
}

