import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { LiveIngestDepth } from "../lib/live-ingest-depth";
import {
  OVERVIEW_PENDING_LINE,
  OVERVIEW_THIN_EMPTY_LINE,
  overviewBusiestWeekday,
  overviewCoverageLine,
  overviewHandoffPeeks,
  overviewLtvWindowLabel,
  overviewReturningCompactDollars,
  overviewWeekendWeekday,
  type OverviewHandoffPeek,
  type OverviewLtvPeekDays,
} from "../lib/overview-first-viewport";
import {
  OVERVIEW_FROM_ORDERS_LABEL,
  OVERVIEW_ORDERS_EMPTY_LINE,
  OVERVIEW_PRIOR_MISSING_LINE,
  overviewOrderDeltaLabel,
  type OverviewOrderBookHero,
} from "../lib/overview-order-book";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskHref } from "../lib/desk-base-path";
import { deskNavHref } from "../lib/desk-nav";

export type OverviewPeekProps = {
  "aria-label"?: string;
  orderCount: number;
  typicalOrder: number | null;
  meanAov: number | null;
  typicalDay?: number | null;
  returningSalesShare: number | null;
  returningSales?: number | null;
  newSales?: number | null;
  /** Order-data greeting from mix + month close — not an AI analyst. */
  mixGreeting?: string | null;
  medianDaysToSecond?: number | null;
  weekendSalesShare?: number | null;
  peakWeekday?: number | null;
  weekdaySalesShare?: number[] | null;
  windowSales?: number | null;
  ltvPeek?: number | null;
  ltvPeekDays?: OverviewLtvPeekDays | null;
  ltvHistoryLimited?: boolean;
  monthClose?: number | null;
  monthCloseRemainingDays?: number | null;
  monthCloseClosed?: boolean;
  /**
   * SalesDayFact / Analytics pending — must NOT blank order-book median,
   * returning $, or weekend on the Overview first fold.
   */
  salesPending: boolean;
  ordersHref: string;
  settingsHref?: string;
  useSampleDesk?: boolean;
  /** OrderFact hero for the first fold. When set, drives the morning number. */
  orderHero?: OverviewOrderBookHero | null;
  periodLabel?: string;
  /** Trial and paid both keep up to 24 months. Required on live Overview. */
  orderBookDepth: LiveIngestDepth;
  /** Order-fact crawl resume — N days on file, window still filling. */
  orderBackfillLine?: string | null;
  /** When Home already shows one pending banner, skip duplicate inline lines. */
  hideInlinePending?: boolean;
};

function PeekCard({
  to,
  nextLabel,
  next,
  formulaBlock,
  label,
  value,
  sub,
  foot,
  icon,
  extra,
  hero = false,
}: {
  to: string;
  nextLabel: string;
  next: string;
  formulaBlock: string;
  label: string;
  value: string;
  sub?: string;
  foot?: string;
  icon: DeskIconName;
  extra?: ReactNode;
  hero?: boolean;
}) {
  const drill = useDeskDrill();
  return (
    <button
      type="button"
      className={
        hero
          ? "mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--hero"
          : "mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"
      }
      data-empty={value === "—" ? "true" : undefined}
      onClick={() =>
        drill?.openDrill({
          title: label,
          value,
          blocks: [
            { k: "What this is", v: formulaBlock },
            sub ? { k: "Also", v: sub } : null,
          ].filter((block): block is { k: string; v: string } => block != null),
          next,
          nextHref: to,
          nextLabel,
          foot,
        })
      }
    >
      <span className="mcfly-kpi__top">
        <DeskIcon name={icon} />
        <span className="mcfly-kpi__label">{label}</span>
      </span>
      <span className="mcfly-kpi__value">{value}</span>
      {sub ? <span className="mcfly-kpi__sub">{sub}</span> : null}
      {extra}
    </button>
  );
}

function useOverviewPeekValues({
  orderCount,
  typicalOrder,
  meanAov,
  typicalDay,
  returningSalesShare,
  returningSales,
  newSales,
  weekendSalesShare,
  peakWeekday,
  weekdaySalesShare,
  windowSales,
}: OverviewPeekProps) {
  const currency = useDeskCurrency();
  const typicalIsMedian =
    typicalOrder != null && Number.isFinite(typicalOrder);
  const typicalValue = typicalIsMedian
    ? typicalOrder
    : meanAov != null && Number.isFinite(meanAov)
      ? meanAov
      : null;
  const typical =
    typicalValue != null ? formatCurrency(typicalValue, currency) : null;
  const returningDollars = overviewReturningCompactDollars(returningSales);
  const returningValue =
    returningDollars == null
      ? "—"
      : formatCurrency(returningDollars, currency);
  const newDollars =
    newSales != null && Number.isFinite(newSales) && newSales > 0
      ? formatCurrency(newSales, currency)
      : null;
  const returningShare =
    returningSalesShare != null && Number.isFinite(returningSalesShare)
      ? newDollars
        ? `${Math.round(returningSalesShare * 100)}% · new ${newDollars}`
        : `${Math.round(returningSalesShare * 100)}% of sales`
      : undefined;
  const weekend = overviewWeekendWeekday(weekendSalesShare);
  const typicalCardValue = typical ?? "—";
  const typicalDayValue =
    typicalDay == null || !Number.isFinite(typicalDay)
      ? "—"
      : formatCurrency(typicalDay, currency);
  const ordersValue = orderCount.toLocaleString();
  const busiest = overviewBusiestWeekday({
    peakWeekday,
    weekdaySalesShare,
    windowSales,
  });
  const busiestValue = busiest
    ? busiest.dollars != null
      ? formatCurrency(busiest.dollars, currency)
      : `${busiest.pct}%`
    : "—";
  return {
    currency,
    typicalIsMedian,
    returningValue,
    returningShare,
    weekend,
    typicalCardValue,
    typicalDayValue,
    ordersValue,
    busiest,
    busiestValue,
  };
}

function handoffPeekCard(
  peek: OverviewHandoffPeek,
  currency: string,
  deskHref: (adminPath: string) => string,
): {
  to: string;
  nextLabel: string;
  next: string;
  formulaBlock: string;
  icon: DeskIconName;
  label: string;
  value: string;
  sub?: string;
  foot?: string;
} {
  switch (peek.kind) {
    case "daysToSecond":
      return {
        to: deskNavHref(deskHref("/app/customers"), {
          extra: { panel: "growth" },
        }),
        nextLabel: `Open ${PRODUCT_NOUN.buyersTitle}`,
        next: "Open Customers for the habit clock and who to reach.",
        formulaBlock:
          "Typical wait is the median first→second gap. Win-back is that wait plus 15 days.",
        icon: "clock",
        label: "Days to second",
        value: `${peek.days}d`,
        sub: `Reach around day ${peek.winBack}`,
        foot: "Among buyers who came back. Guests stay out.",
      };
    case "ltvPeek":
      return {
        to: deskNavHref(deskHref("/app/customers"), {
          extra: { panel: "ltv" },
        }),
        nextLabel: `Open ${PRODUCT_NOUN.buyersTitle}`,
        next: "Open Customers for 30 / 90 / 365 and the written-out formula.",
        formulaBlock: `Average dollars per new buyer in the ${overviewLtvWindowLabel(peek.windowDays)}. Observed order history — not an estimate.`,
        icon: "sales",
        label: "New-buyer worth",
        value: formatCurrency(peek.amount, currency),
        sub: overviewLtvWindowLabel(peek.windowDays),
        foot: "Order history only. Refunds never invented.",
      };
    case "monthClose":
      return {
        to: deskHref("/app/customers"),
        nextLabel: `Open ${PRODUCT_NOUN.buyersTitle}`,
        next: "Month close is so far plus remaining days × the typical day.",
        formulaBlock: peek.closed
          ? "This month is done. The close is so far — not remaining days times a typical day."
          : "Month close = so far + remaining days × typical day. Typical day is the median of stored days with sales.",
        icon: "chart",
        label: "Month close",
        value: formatCurrency(peek.projected, currency),
        sub: peek.closed
          ? "month done — so far"
          : `${peek.remainingDays} days × typical day`,
      };
    default: {
      const _never: never = peek;
      return _never;
    }
  }
}

/**
 * Overview first fold — one morning plane from OrderFact sums.
 * Hero $ labeled From orders. No soft KPI grid. No spend / ROAS.
 * salesPending (SalesDayFact) must not blank median / returning / weekend.
 */
export function OverviewFirstViewport({
  "aria-label": ariaLabel = "Orders this period",
  ordersHref,
  useSampleDesk = false,
  salesPending,
  orderCount,
  mixGreeting: _mixGreeting = null,
  orderHero = null,
  periodLabel = "This month",
  orderBookDepth,
  orderBackfillLine = null,
  hideInlinePending = false,
  ...rest
}: OverviewPeekProps) {
  const currency = useDeskCurrency();
  const money = (n: number) => formatCurrency(n, currency);

  const hero = orderHero;
  const empty = hero?.empty ?? !(orderCount > 0);
  const heroSales =
    hero?.sales != null && Number.isFinite(hero.sales) ? hero.sales : null;
  const heroValue =
    !empty && heroSales != null ? money(heroSales) : "—";
  const count = hero?.orderCount ?? orderCount;
  const countLabel =
    empty && !(count > 0)
      ? "Order count still loading — not 0."
      : `${count.toLocaleString()} orders`;
  const sectionStillLoading =
    !useSampleDesk && (salesPending || Boolean(orderBackfillLine));
  const loadingOr = (label: string) =>
    label === "—" && sectionStillLoading ? "still loading" : label;
  const missingPrior = hero == null || hero.priorSales == null;
  const delta = overviewOrderDeltaLabel({
    yoyPct: hero?.yoyPct ?? null,
    missingPrior,
  });
  const zone = hero?.zone ?? "empty";

  const returning =
    hero?.returningSales != null && hero.returningSales > 0
      ? money(hero.returningSales)
      : overviewReturningCompactDollars(rest.returningSales) != null
        ? money(overviewReturningCompactDollars(rest.returningSales)!)
        : "—";
  const typical =
    hero?.typicalOrder != null && hero.typicalOrder > 0
      ? money(hero.typicalOrder)
      : rest.typicalOrder != null && Number.isFinite(rest.typicalOrder)
        ? money(rest.typicalOrder)
        : "—";
  const weekendShare =
    hero?.weekendShare ?? rest.weekendSalesShare ?? null;
  const weekend = overviewWeekendWeekday(weekendShare);
  const weekendLabel = weekend ? `${weekend.weekendPct}%` : "—";

  return (
    <section
      className="mcfly-overview-plane"
      aria-label={ariaLabel}
      data-sample={useSampleDesk ? "true" : undefined}
    >
      <div className={`mcfly-overview-plane__hero mcfly-overview-plane__hero--${zone}`}>
        <div className="mcfly-overview-plane__hero-top">
          <p className="mcfly-overview-plane__period">{periodLabel}</p>
          {delta ? (
            <p className={`mcfly-overview-plane__delta mcfly-overview-plane__delta--${zone}`}>
              {delta}
            </p>
          ) : (
            <p className="mcfly-overview-plane__delta mcfly-overview-plane__delta--empty">
              {empty
                ? OVERVIEW_ORDERS_EMPTY_LINE
                : sectionStillLoading && missingPrior
                  ? "Last year still loading — not $0."
                  : OVERVIEW_PRIOR_MISSING_LINE}
            </p>
          )}
        </div>
                  <p className="mcfly-overview-plane__value">{heroValue}</p>
        <p className="mcfly-overview-plane__count">{countLabel}</p>
        <p className="mcfly-overview-plane__meta">
          <span className="mcfly-overview-plane__source">{OVERVIEW_FROM_ORDERS_LABEL}</span>
          <span aria-hidden="true"> · </span>
          <span className="mcfly-overview-plane__prior">
            {missingPrior || hero?.priorSales == null
              ? sectionStillLoading
                ? "Last year still loading — not $0."
                : OVERVIEW_PRIOR_MISSING_LINE
              : `same days last year ${money(hero.priorSales)}`}
          </span>
        </p>
        <span className="mcfly-overview-plane__sr">
          {useSampleDesk
            ? `${periodLabel}. Sample shop.`
            : overviewCoverageLine(orderBookDepth)}
        </span>
      </div>

      {!hideInlinePending && orderBackfillLine ? (
        <p className="mcfly-overview-plane__pending">{orderBackfillLine}</p>
      ) : !hideInlinePending && salesPending ? (
        <p className="mcfly-overview-plane__pending">{OVERVIEW_PENDING_LINE}</p>
      ) : null}

      <p className="mcfly-overview-plane__strip">
        <span>Returning {loadingOr(returning)}</span>
        <span aria-hidden="true"> · </span>
        <span>Typical order {loadingOr(typical)}</span>
        <span aria-hidden="true"> · </span>
        <span>Weekend {loadingOr(weekendLabel)}</span>
      </p>

      {empty && !useSampleDesk ? (
        <p className="mcfly-overview-plane__note">{OVERVIEW_THIN_EMPTY_LINE}</p>
      ) : null}
    </section>
  );
}

/** Orders + busiest weekday — after the open sales chart. Typical day leads above. */
export function OverviewDepthPeeks({
  ordersHref,
  salesPending: _salesPending,
  orderCount,
  ...rest
}: OverviewPeekProps) {
  const deskHref = useDeskHref();
  const { ordersValue, busiest, busiestValue, currency } = useOverviewPeekValues({
    ...rest,
    orderCount,
    ordersHref,
    salesPending: false,
  });
  const handoffs = overviewHandoffPeeks({
    medianDaysToSecond: rest.medianDaysToSecond,
    ltvPeek: rest.ltvPeek,
    ltvPeekDays: rest.ltvPeekDays,
    historyLimited: rest.ltvHistoryLimited,
    monthClose: rest.monthClose,
    monthCloseRemainingDays: rest.monthCloseRemainingDays,
    monthCloseClosed: rest.monthCloseClosed,
  });

  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--depth"
      aria-label="More Shopify order depth"
    >
      <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-depth mcfly-kpi-grid--peeks-2">
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for ticket, discounts, and items."
          formulaBlock="Paid orders in this window after returns. Typical order is the middle ticket, not this count."
          icon="orders"
          label="Orders"
          value={ordersValue}
          sub={!(orderCount > 0) ? undefined : "This window"}
        />
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for the weekday breakdown and busiest hour."
          formulaBlock={PRODUCT_NOUN.bookBusiestWeekday}
          icon="weekend"
          label={PRODUCT_NOUN.bookBusiestWeekday}
          value={busiestValue}
          sub={
            busiest ? `${busiest.label} · ${busiest.pct}% of sales` : undefined
          }
        />
      </div>
      {handoffs.length > 0 ? (
        <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-handoff">
          {handoffs.map((peek) => {
            const card = handoffPeekCard(peek, currency, deskHref);
            return (
              <PeekCard
                key={peek.kind}
                to={card.to}
                nextLabel={card.nextLabel}
                next={card.next}
                formulaBlock={card.formulaBlock}
                icon={card.icon}
                label={card.label}
                value={card.value}
                sub={card.sub}
                foot={card.foot}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
