import { formatCurrency } from "../lib/mer-format";
import {
  OVERVIEW_YOY_MISSING,
  type OverviewYoyCard,
} from "../lib/overview-yoy";
import { OVERVIEW_COVERAGE_LINE } from "../lib/overview-first-viewport";

function deltaLine(card: OverviewYoyCard): string | null {
  if (card.missingPrior || card.delta == null || card.priorSales == null) {
    return null;
  }
  const sign = card.delta > 0 ? "+" : card.delta < 0 ? "−" : "";
  const dollars = formatCurrency(Math.abs(card.delta));
  const pct =
    card.yoySalesPct == null
      ? null
      : `${card.yoySalesPct > 0 ? "+" : ""}${Math.round(card.yoySalesPct)}%`;
  if (card.delta === 0) {
    return `Even with last year ${formatCurrency(card.priorSales)}`;
  }
  return pct
    ? `${sign}${dollars} · ${pct} vs last year ${formatCurrency(card.priorSales)}`
    : `${sign}${dollars} vs last year ${formatCurrency(card.priorSales)}`;
}

/**
 * Overview = three YoY sales cards. Spend / explorer / glance live elsewhere.
 */
export function OverviewYoyCards({
  cards,
  salesPending,
}: {
  cards: OverviewYoyCard[];
  salesPending: boolean;
}) {
  if (salesPending) return null;
  if (cards.length === 0) return null;

  return (
    <section className="mcfly-yoy" aria-label="Sales versus last year">
      <p className="mcfly-book__lede">{OVERVIEW_COVERAGE_LINE}</p>
      <div className="mcfly-yoy__grid">
        {cards.map((card) => {
          const vs = deltaLine(card);
          return (
            <article className="mcfly-yoy__card" key={card.id}>
              <p className="mcfly-yoy__k">{card.label}</p>
              <p className="mcfly-yoy__v">{formatCurrency(card.sales)}</p>
              {card.missingPrior ? (
                <p className="mcfly-yoy__miss">{OVERVIEW_YOY_MISSING}</p>
              ) : (
                <p className="mcfly-yoy__vs">{vs}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
