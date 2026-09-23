import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskHref } from "../lib/desk-base-path";
import { deskNavHref } from "../lib/desk-nav";
import {
  OVERVIEW_LAST_YEAR_NOT_ON_FILE,
  OVERVIEW_YOY_GLANCE_ID,
  OVERVIEW_YOY_YEAR_ID,
  OVERVIEW_YOY_YEAR_PANEL,
} from "../lib/overview-first-viewport";
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

function PendingYoyShell({
  id,
  prior = "—",
}: {
  id: OverviewYoyId;
  prior?: string;
}) {
  return (
    <article
      className="mcfly-yoy__card mcfly-yoy__card--empty mcfly-yoy__card--plane"
      key={id}
    >
      <p className="mcfly-yoy__k">
        <DeskIcon name="yoy" />
        {OVERVIEW_YOY_LABELS[id]}
      </p>
      <p className="mcfly-yoy__v">—</p>
      <p className="mcfly-yoy__prior">
        <span>Last year</span>
        <span>{prior}</span>
      </p>
    </article>
  );
}

/**
 * Overview glance spine — three certified sales windows vs last year.
 * Dense rows: label + $ + one LY/delta line. No UP pills, no YTD essay.
 */
export function OverviewYoyCards({
  cards,
  salesPending,
  yoyHref,
}: {
  cards: OverviewYoyCard[];
  salesPending: boolean;
  yoyHref?: string;
}) {
  const currency = useDeskCurrency();
  const deskHref = useDeskHref();
  const nextHref =
    yoyHref ??
    deskNavHref(deskHref("/app"), {
      extra: { panel: OVERVIEW_YOY_YEAR_PANEL },
      hash: OVERVIEW_YOY_YEAR_ID,
    });
  const drill = useDeskDrill();
  if (salesPending) {
    return (
      <section
        className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane"
        id={OVERVIEW_YOY_GLANCE_ID}
        aria-label="Sales versus last year"
      >
        <p className="mcfly-yoy__lede mcfly-yoy__lede--quiet">{OVERVIEW_YOY_PENDING}</p>
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
      <section
        className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane"
        id={OVERVIEW_YOY_GLANCE_ID}
        aria-label="Sales versus last year"
      >
        <p className="mcfly-yoy__lede mcfly-yoy__lede--quiet">{OVERVIEW_YOY_ANALYTICS_LEDE}</p>
        <div className="mcfly-yoy__grid">
          {OVERVIEW_YOY_IDS.map((id) => (
            <PendingYoyShell
              id={id}
              key={id}
              prior={OVERVIEW_LAST_YEAR_NOT_ON_FILE}
            />
          ))}
        </div>
        <p className="mcfly-yoy__note">{OVERVIEW_YOY_MISSING}</p>
      </section>
    );
  }

  const allMissingPrior = cards.every((card) => card.missingPrior);
  const sameWindow = overviewWindowsCollapsed(cards);

  return (
    <section
      className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane"
      id={OVERVIEW_YOY_GLANCE_ID}
      aria-label="Sales versus last year"
    >
      <div className="mcfly-yoy__grid">
        {cards.map((card) => {
          const vs = deltaLine(card, currency);
          const zone = overviewYoyZone(card);
          const range = overviewWindowRange(card.fromKey, card.toKey);
          const priorAmount =
            card.missingPrior || card.priorSales == null
              ? null
              : formatCurrency(card.priorSales, currency);
          const priorLabel = priorAmount ?? OVERVIEW_LAST_YEAR_NOT_ON_FILE;
          return (
            <button
              type="button"
              className={`mcfly-yoy__card mcfly-yoy__card--drill mcfly-yoy__card--plane ${zoneClass(zone)}`}
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
                      v: "Order-book dollars for this window next to the same calendar days last year.",
                    },
                  ].filter(
                    (block): block is { k: string; v: string } => block != null,
                  ),
                  next: "Open the 12-month board vs last year below on Overview.",
                  nextHref,
                  nextLabel: "Open year board",
                  foot: card.missingPrior ? OVERVIEW_YOY_MISSING : undefined,
                })
              }
            >
              <p className="mcfly-yoy__k">
                <span className="mcfly-yoy__k-main">
                  <DeskIcon name="yoy" />
                  {card.label}
                  {range ? (
                    <span className="mcfly-yoy__range"> · {range}</span>
                  ) : null}
                </span>
              </p>
              <p className={`mcfly-yoy__v mcfly-yoy__v--${zone}`}>
                {formatCurrency(card.sales, currency)}
              </p>
              <p className="mcfly-yoy__prior">
                <span>
                  {priorAmount == null ? priorLabel : `LY ${priorAmount}`}
                </span>
                {vs ? (
                  <span className={`mcfly-yoy__vs mcfly-yoy__vs--${zone}`}>
                    {vs}
                  </span>
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
