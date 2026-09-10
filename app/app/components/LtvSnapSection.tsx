import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { PeriodPreset } from "../lib/periods";

export type LtvSnapTill = {
  available: boolean;
  emptyReason: string | null;
  cashCac: number | null;
  avgRevenueD30: number | null;
  avgRevenueD90: number | null;
  avgRevenueD365: number | null;
  repeatRate: number | null;
  ltvCacRatio: number | null;
  newBuyers: number;
  paybackDays: number | null;
};

type LtvRow = { k: string; v: string; d: string };

/** Whole percents in merchant chrome — 25%, never 25.0%. */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

function ltvWindows(tillLtv: LtvSnapTill): LtvRow[] {
  const windows: Array<LtvRow | null> = [
    isNum(tillLtv.avgRevenueD90)
      ? {
          k: "First 90 days",
          v: formatCurrency(tillLtv.avgRevenueD90),
          d: PRODUCT_NOUN.ltv90Def,
        }
      : null,
    isNum(tillLtv.avgRevenueD30)
      ? {
          k: "First 30 days",
          v: formatCurrency(tillLtv.avgRevenueD30),
          d: PRODUCT_NOUN.ltv30Def,
        }
      : null,
    isNum(tillLtv.avgRevenueD365)
      ? {
          k: "First year",
          v: formatCurrency(tillLtv.avgRevenueD365),
          d: PRODUCT_NOUN.ltv365Def,
        }
      : null,
  ];
  return windows.filter((row): row is LtvRow => row !== null);
}

function spendRows(
  tillLtv: LtvSnapTill,
  hasSpend: boolean,
  cashCpa: number | null,
): LtvRow[] {
  if (!hasSpend) return [];
  const rows: LtvRow[] = [];
  if (isNum(tillLtv.cashCac)) {
    const payback =
      tillLtv.paybackDays != null
        ? ` Recovered in about ${tillLtv.paybackDays} days on average.`
        : "";
    rows.push({
      k: "Cash CAC",
      v: formatCurrency(tillLtv.cashCac),
      d: `${PRODUCT_NOUN.cashCacDef}.${payback}`,
    });
  }
  if (isNum(cashCpa)) {
    rows.push({
      k: "Cash CPA",
      v: formatCurrency(cashCpa),
      d: "Spend ÷ identified buyers in this window. Shopify Analytics has no spend.",
    });
  }
  if (isNum(tillLtv.ltvCacRatio)) {
    rows.push({
      k: "Value vs cost",
      v: `${tillLtv.ltvCacRatio.toFixed(2)}×`,
      d: "First 90 days of revenue ÷ Cash CAC. An average, not a causal claim.",
    });
  }
  return rows;
}

function emptyLine(emptyReason: string | null): string {
  if (emptyReason === "no_timezone") {
    return "Shop timezone needed before first-order months can bucket by local day.";
  }
  if (emptyReason === "history_limited") {
    return `Order history is limited — open ${PRODUCT_NOUN.ltvTitle} for coverage.`;
  }
  return `Backfilling first-order months — open ${PRODUCT_NOUN.ltvTitle} for progress.`;
}

export function LtvSnapSection({
  tillLtv,
  preset,
  hasSpend,
  cashCpa,
}: {
  tillLtv: LtvSnapTill;
  preset: PeriodPreset;
  hasSpend: boolean;
  cashCpa: number | null;
}) {
  const windows = ltvWindows(tillLtv);
  const hero = tillLtv.available ? windows[0] : undefined;
  const rows = hero
    ? [
        ...windows.slice(1),
        ...(isNum(tillLtv.repeatRate)
          ? [
              {
                k: "Repeat rate",
                v: pct(tillLtv.repeatRate),
                d: "Extra orders beyond the first in 90 days — an average, not causal.",
              },
            ]
          : []),
        ...spendRows(tillLtv, hasSpend, cashCpa),
      ]
    : [];

  return (
    <section
      className="mcfly-book"
      aria-label={`${PRODUCT_NOUN.ltvTitle} snapshot`}
    >
      <p className="mcfly-book__lede">
        {PRODUCT_NOUN.ltvTitle} —{" "}
        {hasSpend
          ? PRODUCT_NOUN.ltvSnapMutedWithSpend
          : PRODUCT_NOUN.ltvSnapMutedNoSpend}
      </p>

      {hero ? (
        <div className="mcfly-book__hero">
          <p className="mcfly-book__hero-k">{hero.k}</p>
          <p className="mcfly-book__hero-v">{hero.v}</p>
          <p className="mcfly-book__hero-def">
            {hero.d}
            {tillLtv.newBuyers > 0
              ? ` ${tillLtv.newBuyers.toLocaleString()} new customers.`
              : ""}
          </p>
        </div>
      ) : (
        <p className="mcfly-book__lede">{emptyLine(tillLtv.emptyReason)}</p>
      )}

      {rows.length > 0 ? (
        <div className="mcfly-book__rows">
          {rows.map((row) => (
            <details className="mcfly-book__row" key={row.k}>
              <summary className="mcfly-book__row-sum">
                <span className="mcfly-book__row-k">{row.k}</span>
                <span className="mcfly-book__row-v">{row.v}</span>
              </summary>
              <p className="mcfly-book__row-d">{row.d}</p>
            </details>
          ))}
        </div>
      ) : null}

      <p className="mcfly-book__cta">
        <s-link href={`/app/ltv?period=${preset}`}>
          {PRODUCT_NOUN.openLtv}
        </s-link>
      </p>
    </section>
  );
}
