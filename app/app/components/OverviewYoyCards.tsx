import { formatCurrency } from "../lib/mer-format";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import {
  OVERVIEW_YOY_ANALYTICS_LEDE,
  OVERVIEW_YOY_MISSING,
  OVERVIEW_YOY_SAME_WINDOW,
  overviewWindowsCollapsed,
  type OverviewYoyCard,
} from "../lib/overview-yoy";

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
    ? `${sign}${dollars} · ${pct}`
    : `${sign}${dollars} vs last year`;
}

/**
 * Overview = three YoY sales cards. Spend / explorer / glance live elsewhere.
 */
export function OverviewYoyCards({
  cards,
  salesPending,
  yoyHref = "/app/yoy",
}: {
  cards: OverviewYoyCard[];
  salesPending: boolean;
  yoyHref?: string;
}) {
  const drill = useDeskDrill();
  if (salesPending) {
    return (
      <p className="mcfly-book__lede">
        Sales for closed days are still loading — not $0.
      </p>
    );
  }
  if (cards.length === 0) return null;

  const allMissingPrior = cards.every((card) => card.missingPrior);
  const sameWindow = overviewWindowsCollapsed(cards);

  return (
    <section className="mcfly-yoy" aria-label="Sales versus last year">
      <p className="mcfly-yoy__lede">{OVERVIEW_YOY_ANALYTICS_LEDE}</p>
      <div className="mcfly-yoy__grid">
        {cards.map((card) => {
          const vs = deltaLine(card);
          const priorLabel = card.missingPrior
            ? "—"
            : formatCurrency(card.priorSales ?? 0);
          return (
            <button
              type="button"
              className="mcfly-yoy__card mcfly-yoy__card--drill"
              key={card.id}
              onClick={() =>
                drill?.openDrill({
                  title: card.label,
                  value: formatCurrency(card.sales),
                  kicker: "Same days last year",
                  blocks: [
                    { k: "This year", v: formatCurrency(card.sales) },
                    { k: "Last year", v: priorLabel },
                    vs ? { k: "Change", v: vs } : null,
                    {
                      k: "What this is",
                      v: "Shopify Total Sales for this window next to the same calendar days last year. Shopify Analytics Overview is this period only.",
                    },
                  ].filter(
                    (block): block is { k: string; v: string } => block != null,
                  ),
                  next: "Open YoY for this month vs last month vs last year plus last 7.",
                  nextHref: yoyHref,
                  nextLabel: "Open YoY",
                  foot: card.missingPrior ? OVERVIEW_YOY_MISSING : undefined,
                })
              }
            >
              <p className="mcfly-yoy__k">
                <DeskIcon name="yoy" />
                {card.label}
              </p>
              <p className="mcfly-yoy__v">{formatCurrency(card.sales)}</p>
              <p className="mcfly-yoy__prior">
                <span>Last year</span>
                <span>{priorLabel}</span>
              </p>
              {vs ? <p className="mcfly-yoy__vs">{vs}</p> : null}
              <p className="mcfly-kpi__hint">Click for detail</p>
            </button>
          );
        })}
      </div>
      {sameWindow ? (
        <p className="mcfly-yoy__note">{OVERVIEW_YOY_SAME_WINDOW}</p>
      ) : allMissingPrior ? (
        <p className="mcfly-yoy__note">{OVERVIEW_YOY_MISSING}</p>
      ) : null}
    </section>
  );
}
