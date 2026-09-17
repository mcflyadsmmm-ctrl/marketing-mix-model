import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import {
  OVERVIEW_YOY_ANALYTICS_LEDE,
  OVERVIEW_YOY_IDS,
  OVERVIEW_YOY_LABELS,
  OVERVIEW_YOY_MISSING,
  OVERVIEW_YOY_PENDING,
  OVERVIEW_YOY_SAME_WINDOW,
  overviewWindowRange,
  overviewWindowsCollapsed,
  overviewYoyZone,
  overviewYoyZoneLabel,
  type OverviewYoyCard,
  type OverviewYoyId,
  type OverviewYoyZone,
} from "../lib/overview-yoy";

function deltaLine(card: OverviewYoyCard, currency: string): string | null {
  if (card.missingPrior || card.delta == null || card.priorSales == null) {
    return null;
  }
  const sign = card.delta > 0 ? "+" : card.delta < 0 ? "−" : "";
  const dollars = formatCurrency(Math.abs(card.delta), currency);
  const pct =
    card.yoySalesPct == null
      ? null
      : `${card.yoySalesPct > 0 ? "+" : ""}${Math.round(card.yoySalesPct)}%`;
  if (card.delta === 0) {
    return `Even with last year ${formatCurrency(card.priorSales, currency)}`;
  }
  return pct
    ? `${sign}${dollars} · ${pct}`
    : `${sign}${dollars} vs last year`;
}

function zoneClass(zone: OverviewYoyZone): string {
  switch (zone) {
    case "up":
      return "mcfly-yoy__card--up";
    case "down":
      return "mcfly-yoy__card--down";
    case "even":
      return "mcfly-yoy__card--even";
    case "empty":
      return "mcfly-yoy__card--empty";
    default: {
      const _never: never = zone;
      return _never;
    }
  }
}

function PendingYoyShell({ id }: { id: OverviewYoyId }) {
  return (
    <article className="mcfly-yoy__card mcfly-yoy__card--empty" key={id}>
      <p className="mcfly-yoy__k">
        <DeskIcon name="yoy" />
        {OVERVIEW_YOY_LABELS[id]}
      </p>
      <p className="mcfly-yoy__v">—</p>
      <p className="mcfly-yoy__prior">
        <span>Last year</span>
        <span>—</span>
      </p>
    </article>
  );
}

/**
 * Overview glance spine — three certified sales windows vs last year.
 * Spend / explorer live on later tabs. Pending shells only when sales
 * are unknown — a $0 month with missing last year uses OVERVIEW_YOY_MISSING.
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
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (salesPending) {
    return (
      <section className="mcfly-yoy" aria-label="Sales versus last year">
        <p className="mcfly-yoy__lede">{OVERVIEW_YOY_PENDING}</p>
        <div className="mcfly-yoy__grid">
          {OVERVIEW_YOY_IDS.map((id) => (
            <PendingYoyShell id={id} key={id} />
          ))}
        </div>
      </section>
    );
  }

  if (cards.length === 0) {
    return (
      <section className="mcfly-yoy" aria-label="Sales versus last year">
        <p className="mcfly-yoy__lede">{OVERVIEW_YOY_ANALYTICS_LEDE}</p>
        <div className="mcfly-yoy__grid">
          {OVERVIEW_YOY_IDS.map((id) => (
            <PendingYoyShell id={id} key={id} />
          ))}
        </div>
        <p className="mcfly-yoy__note">{OVERVIEW_YOY_MISSING}</p>
      </section>
    );
  }

  const allMissingPrior = cards.every((card) => card.missingPrior);
  const sameWindow = overviewWindowsCollapsed(cards);

  return (
    <section className="mcfly-yoy" aria-label="Sales versus last year">
      <p className="mcfly-yoy__lede">{OVERVIEW_YOY_ANALYTICS_LEDE}</p>
      <div className="mcfly-yoy__grid">
        {cards.map((card) => {
          const vs = deltaLine(card, currency);
          const zone = overviewYoyZone(card);
          const zoneLabel = overviewYoyZoneLabel(zone);
          const range = overviewWindowRange(card.fromKey, card.toKey);
          const priorLabel = card.missingPrior
            ? "—"
            : formatCurrency(card.priorSales ?? 0, currency);
          return (
            <button
              type="button"
              className={`mcfly-yoy__card mcfly-yoy__card--drill ${zoneClass(zone)}`}
              key={card.id}
              onClick={() =>
                drill?.openDrill({
                  title: card.label,
                  value: formatCurrency(card.sales, currency),
                  kicker: range ?? "Same days last year",
                  blocks: [
                    { k: "This year", v: formatCurrency(card.sales, currency) },
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
                <span className="mcfly-yoy__k-main">
                  <DeskIcon name="yoy" />
                  {card.label}
                </span>
                {zoneLabel ? (
                  <span className={`mcfly-yoy__zone mcfly-yoy__zone--${zone}`}>
                    {zoneLabel}
                  </span>
                ) : null}
              </p>
              {range ? <p className="mcfly-yoy__range">{range}</p> : null}
              <p className={`mcfly-yoy__v mcfly-yoy__v--${zone}`}>
                {formatCurrency(card.sales, currency)}
              </p>
              <p className="mcfly-yoy__prior">
                <span>Last year {priorLabel}</span>
                {vs ? (
                  <span className={`mcfly-yoy__vs mcfly-yoy__vs--${zone}`}>{vs}</span>
                ) : null}
              </p>
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
