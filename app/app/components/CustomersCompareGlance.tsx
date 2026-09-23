import { DeskIcon } from "./DeskIcon";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import type { LastYearMix } from "../lib/customers-analytics";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";
import {
  CUSTOMERS_COMPARE_MISSING_LINE,
  CUSTOMERS_COMPARE_SECTION_LABEL,
  CUSTOMERS_PENDING_LINE,
  buildCustomersCompareKpis,
} from "../lib/customers-first-viewport";

function deltaCopy(dir: "up" | "down" | "flat", pct: number): string {
  if (dir === "flat") return "Even vs last year";
  const sign = dir === "up" ? "+" : "−";
  return `${sign}${Math.abs(Math.round(pct * 10) / 10)}% vs last year`;
}

/**
 * Compact last-year strip — returning $, new $, dollars per buyer. No essay.
 */
export function CustomersCompareGlance({
  book,
  lastYear,
  salesPending,
}: {
  book: Pick<
    ShopifyNativePeriodStats,
    | "returningSales"
    | "newSales"
    | "newBuyerArpu"
    | "returningBuyerArpu"
  >;
  lastYear: LastYearMix;
  salesPending: boolean;
}) {
  const currency = useDeskCurrency();
  const money = (n: number) => formatCurrency(n, currency);

  if (salesPending) {
    return (
      <section
        className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane mcfly-yoy--metrics mcfly-customers-compare"
        aria-label={CUSTOMERS_COMPARE_SECTION_LABEL}
      >
        <h3 className="mcfly-yoy__h">{CUSTOMERS_COMPARE_SECTION_LABEL}</h3>
        <span className="mcfly-yoy__sr">{CUSTOMERS_PENDING_LINE}</span>
        <p className="mcfly-yoy__note mcfly-yoy__note--quiet">—</p>
      </section>
    );
  }

  const kpis = buildCustomersCompareKpis(book, lastYear, money);
  if (kpis.length === 0) {
    return (
      <section
        className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane mcfly-yoy--metrics mcfly-customers-compare"
        aria-label={CUSTOMERS_COMPARE_SECTION_LABEL}
      >
        <h3 className="mcfly-yoy__h">{CUSTOMERS_COMPARE_SECTION_LABEL}</h3>
        <p className="mcfly-yoy__note mcfly-yoy__note--quiet">
          {CUSTOMERS_COMPARE_MISSING_LINE}
        </p>
      </section>
    );
  }

  return (
    <section
      className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane mcfly-yoy--metrics mcfly-customers-compare"
      aria-label={CUSTOMERS_COMPARE_SECTION_LABEL}
    >
      <h3 className="mcfly-yoy__h">{CUSTOMERS_COMPARE_SECTION_LABEL}</h3>
      {!lastYear.onFile ? (
        <p className="mcfly-yoy__note mcfly-yoy__note--quiet">
          {CUSTOMERS_COMPARE_MISSING_LINE}
        </p>
      ) : null}
      <div className="mcfly-yoy__grid mcfly-yoy__grid--metrics">
        {kpis.map((kpi) => (
          <article
            className="mcfly-yoy__card mcfly-yoy__card--plane"
            key={kpi.key}
          >
            <p className="mcfly-yoy__k">
              <DeskIcon name="customers" />
              {kpi.label}
            </p>
            <p className="mcfly-yoy__v">{kpi.value}</p>
            {kpi.delta ? (
              <p className={`mcfly-yoy__vs mcfly-yoy__vs--${kpi.delta.dir}`}>
                {deltaCopy(kpi.delta.dir, kpi.delta.pct)}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
