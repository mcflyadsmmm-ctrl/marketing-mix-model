import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  OVERVIEW_OLDER_MONTHS_LINE,
  OVERVIEW_THIN_EMPTY_LINE,
  overviewWeekendWeekday,
} from "../lib/overview-first-viewport";
import { OVERVIEW_PRIOR_MISSING_LINE } from "../lib/overview-order-book";
import type { OverviewOrderBookHero } from "../lib/overview-order-book";

/**
 * Orders first fold. One sales figure, the comparison beside it,
 * three quiet figures, then the chart the page already owns.
 */
export function EnterpriseScoreboard({
  hero,
  olderMonthsLoading = false,
  salesError = false,
  errorLine = null,
  retryHref = "/app",
}: {
  hero: OverviewOrderBookHero;
  olderMonthsLoading?: boolean;
  salesError?: boolean;
  errorLine?: string | null;
  retryHref?: string;
}) {
  const currency = useDeskCurrency();
  const money = (amount: number) => formatCurrency(amount, currency);
  const sales =
    !hero.empty && hero.sales != null && Number.isFinite(hero.sales)
      ? money(hero.sales)
      : "—";
  const comparison =
    hero.priorSales != null && Number.isFinite(hero.priorSales)
      ? `same days last year ${money(hero.priorSales)}`
      : OVERVIEW_PRIOR_MISSING_LINE;
  const returning =
    hero.returningSales != null && hero.returningSales > 0
      ? money(hero.returningSales)
      : "—";
  const typical =
    hero.typicalOrder != null && hero.typicalOrder > 0
      ? money(hero.typicalOrder)
      : "—";
  const weekend = overviewWeekendWeekday(hero.weekendShare);
  const weekendLabel = weekend ? `${weekend.weekendPct}%` : "—";
  const figures = [
    { label: "Returning", value: returning },
    { label: "Typical order", value: typical },
    { label: "Weekend", value: weekendLabel },
  ] as const;

  return (
    <section className="mcfly-scoreboard" aria-label="Orders">
      {olderMonthsLoading ? (
        <p className="mcfly-scoreboard__status">{OVERVIEW_OLDER_MONTHS_LINE}</p>
      ) : null}
      {hero.empty ? (
        <p className="mcfly-scoreboard__empty">{OVERVIEW_THIN_EMPTY_LINE}</p>
      ) : (
        <>
          <div className="mcfly-scoreboard__hero-row">
            <p className="mcfly-scoreboard__sales">{sales}</p>
            <p className="mcfly-scoreboard__compare">{comparison}</p>
          </div>
          <p className="mcfly-scoreboard__count">
            {hero.orderCount.toLocaleString()} orders
          </p>
          <div className="mcfly-scoreboard__figures">
            {figures.map((figure) => (
              <p key={figure.label} className="mcfly-scoreboard__figure">
                <span className="mcfly-scoreboard__figure-label">{figure.label}</span>
                <span className="mcfly-scoreboard__figure-value">{figure.value}</span>
              </p>
            ))}
          </div>
        </>
      )}
      {salesError && errorLine ? (
        <p className="mcfly-scoreboard__empty">{errorLine}</p>
      ) : null}
      {salesError ? (
        <div className="mcfly-scoreboard__retry">
          <s-button href={retryHref} variant="primary">
            Retry
          </s-button>
        </div>
      ) : null}
    </section>
  );
}
