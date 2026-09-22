import type { ReactNode } from "react";
import type { LiveIngestDepth } from "../lib/live-ingest-depth";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import {
  overviewClockSentenceFromPayload,
  type OverviewClockPayload,
} from "../lib/overview-sales-chart";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  OVERVIEW_PENDING_IN_TOTAL_SALES,
  OVERVIEW_PENDING_LINE,
  OVERVIEW_PERIOD_TOTAL_LABEL,
  OVERVIEW_PERIOD_TOTAL_SENTENCE,
  OVERVIEW_SHOP_NOT_COMPANY,
  OVERVIEW_THIN_EMPTY_LINE,
  overviewBusiestWeekday,
  overviewCoverageLine,
  overviewHandoffPeeks,
  overviewLtvWindowLabel,
  overviewOperatorGreeting,
  overviewPendingFinding,
  overviewPlainSalesWindows,
  overviewPlainWindowFormula,
  overviewReturningCompactDollars,
  overviewThinEmptyFinding,
  overviewWeekendWeekday,
  type OverviewFinding,
  type OverviewHandoffPeek,
  type OverviewLtvPeekDays,
} from "../lib/overview-first-viewport";
import { SAMPLE_OVERVIEW_DOOR } from "../lib/sample-live-handoff";
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
  /** Stored sales days the chart and year cards already use. No order crawl. */
  storedSalesDays?: ReadonlyArray<{ dateKey: string; sales: number }> | null;
  /** Year-over-year “this month” sales. This month to date uses this number. */
  monthToDateSales?: number | null;
  /** Latest stored sales day — the day the year board calls yesterday. */
  salesAsOfKey?: string | null;
  ltvPeek?: number | null;
  ltvPeekDays?: OverviewLtvPeekDays | null;
  ltvHistoryLimited?: boolean;
  monthClose?: number | null;
  monthCloseRemainingDays?: number | null;
  monthCloseClosed?: boolean;
  salesPending: boolean;
  ordersHref: string;
  settingsHref?: string;
  useSampleDesk?: boolean;
  /** Unpaid = 90 closed days of order rows. Paid / SAMPLE = up to 24 months. */
  orderBookDepth?: LiveIngestDepth;
  /** Through this clock versus the same weekday last year. */
  clock?: OverviewClockPayload | null;
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
          ? "mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--soft mcfly-kpi--hero"
          : "mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--soft"
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
  salesPending,
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
    salesPending || returningDollars == null
      ? "—"
      : formatCurrency(returningDollars, currency);
  const newDollars =
    !salesPending && newSales != null && Number.isFinite(newSales) && newSales > 0
      ? formatCurrency(newSales, currency)
      : null;
  const returningShare =
    !salesPending &&
    returningSalesShare != null &&
    Number.isFinite(returningSalesShare)
      ? newDollars
        ? `${Math.round(returningSalesShare * 100)}% · new ${newDollars}`
        : `${Math.round(returningSalesShare * 100)}% of sales`
      : undefined;
  const weekend = salesPending
    ? null
    : overviewWeekendWeekday(weekendSalesShare);
  const typicalCardValue = salesPending ? "—" : (typical ?? "—");
  const typicalDayValue =
    salesPending || typicalDay == null || !Number.isFinite(typicalDay)
      ? "—"
      : formatCurrency(typicalDay, currency);
  const ordersValue = salesPending ? "—" : orderCount.toLocaleString();
  const busiest = salesPending
    ? null
    : overviewBusiestWeekday({
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
          "Typical wait is the median first→second gap. Win-back is that wait plus 15 days. Shopify Analytics Overview is a returning-customer rate.",
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

function FindingStrip({ finding }: { finding: OverviewFinding }) {
  return (
    <div className="mcfly-book__clock" aria-label="What to notice">
      <div>
        <p className="mcfly-book__clock-k">Signal</p>
        <p className="mcfly-book__clock-v">{finding.signal}</p>
      </div>
      <div>
        <p className="mcfly-book__clock-k">Evidence</p>
        <p className="mcfly-book__clock-v">{finding.evidence}</p>
      </div>
      <div>
        <p className="mcfly-book__clock-k">Next move</p>
        <p className="mcfly-book__clock-v">{finding.next}</p>
      </div>
    </div>
  );
}

function moneyOrDash(
  salesPending: boolean,
  amount: number | null | undefined,
  currency: string,
): string {
  if (salesPending || amount == null || !Number.isFinite(amount)) return "—";
  return formatCurrency(amount, currency);
}

/**
 * First-fold peeks — period Shopify Total Sales, then typical order,
 * returning $, weekend, and typical day, then yesterday / this week /
 * this month to date from stored sales days. Days-to-second / LTV /
 * month-close handoffs follow. SAMPLE Snowdevil is the craft canvas.
 * Spend stays off Overview. YoY sits beside this board.
 * Depth peeks stay after the open sales chart.
 * Pending / thin empty keep the KPI shells as — plus Signal / Evidence / Next
 * move — never a pamphlet, never an AI analyst theater, never a fake $0.
 */
export function OverviewFirstViewport({
  "aria-label": ariaLabel = "Shopify sales this period",
  ordersHref,
  useSampleDesk = false,
  orderBookDepth = "paid_full",
  salesPending,
  orderCount,
  mixGreeting = null,
  windowSales = null,
  storedSalesDays = null,
  monthToDateSales = null,
  salesAsOfKey = null,
  clock = null,
  ...rest
}: OverviewPeekProps) {
  const deskHref = useDeskHref();
  const {
    currency,
    typicalIsMedian,
    returningValue,
    returningShare,
    weekend,
    typicalCardValue,
    typicalDayValue,
  } = useOverviewPeekValues({
    ...rest,
    windowSales,
    orderCount,
    ordersHref,
    useSampleDesk,
    salesPending,
  });
  const periodTotal = moneyOrDash(salesPending, windowSales, currency);
  const clockSentence = clock
    ? overviewClockSentenceFromPayload(
        salesPending ? { ...clock, pending: true } : clock,
        (amount) => formatCurrency(amount, currency),
      )
    : null;
  const plainWindows = overviewPlainSalesWindows({
    days: storedSalesDays ?? [],
    monthSales: monthToDateSales,
    asOfKey: salesAsOfKey,
  });
  const typicalLabel =
    salesPending || typicalCardValue === "—" ? null : typicalCardValue;
  const greeting = salesPending
    ? OVERVIEW_PENDING_LINE
    : overviewOperatorGreeting({
        salesPending: false,
        orderCount,
        typicalOrderLabel: typicalLabel,
        returningSalesShare: rest.returningSalesShare,
        weekendSalesShare: rest.weekendSalesShare,
      });
  const trust = useSampleDesk
    ? SAMPLE_OVERVIEW_DOOR
    : mixGreeting && mixGreeting !== greeting
      ? mixGreeting
      : null;
  const handoffs = salesPending
    ? []
    : overviewHandoffPeeks({
        medianDaysToSecond: rest.medianDaysToSecond,
        ltvPeek: rest.ltvPeek,
        ltvPeekDays: rest.ltvPeekDays,
        historyLimited: rest.ltvHistoryLimited,
        monthClose: rest.monthClose,
        monthCloseRemainingDays: rest.monthCloseRemainingDays,
        monthCloseClosed: rest.monthCloseClosed,
      });

  let finding: OverviewFinding | null = null;
  if (salesPending) {
    finding = {
      ...overviewPendingFinding(),
      next: "Typical order, returning $, and weekend fill as closed days land — not $0.",
    };
  } else if (!useSampleDesk && !(orderCount > 0)) {
    finding = {
      ...overviewThinEmptyFinding(),
      evidence: OVERVIEW_THIN_EMPTY_LINE,
    };
  }

  return (
    <section className="mcfly-score mcfly-book mcfly-score--soft" aria-label={ariaLabel}>
      <p className="mcfly-score__greeting">{greeting}</p>
      {trust ? <p className="mcfly-score__trust">{trust}</p> : null}
      {finding ? <FindingStrip finding={finding} /> : null}

      <div className="mcfly-well mcfly-well--scoreboard mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead mcfly-kpi-grid--peeks-4 mcfly-kpi-grid--soft">
        <PeekCard
          hero
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for the tickets inside this period’s Shopify Total Sales."
          formulaBlock={`${OVERVIEW_PERIOD_TOTAL_SENTENCE} ${OVERVIEW_PENDING_IN_TOTAL_SALES} ${OVERVIEW_SHOP_NOT_COMPANY}`}
          icon="sales"
          label={OVERVIEW_PERIOD_TOTAL_LABEL}
          value={periodTotal}
          sub={
            salesPending || periodTotal === "—"
              ? undefined
              : `${OVERVIEW_PERIOD_TOTAL_SENTENCE} ${OVERVIEW_PENDING_IN_TOTAL_SALES} ${OVERVIEW_SHOP_NOT_COMPANY}`
          }
        />
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Typical order, discounts, and weekend sit on Orders — Shopify Analytics only shows the average."
          formulaBlock={
            typicalIsMedian
              ? PRODUCT_NOUN.bookTypicalOrderDef
              : "Average order value when median is not available yet."
          }
          icon="orders"
          label={typicalIsMedian ? PRODUCT_NOUN.bookTypicalOrder : "AOV"}
          value={typicalCardValue}
          sub={
            salesPending || typicalCardValue === "—"
              ? undefined
              : typicalIsMedian
                ? "Median"
                : undefined
          }
        />
        <PeekCard
          to={deskHref("/app/customers")}
          nextLabel={`Open ${PRODUCT_NOUN.buyersTitle}`}
          next="Open Customers for returning dollars and guest checkouts."
          formulaBlock="Sales from returning customers in this window. Shopify Analytics Overview is a returning-customer rate."
          icon="customers"
          label="Returning"
          value={returningValue}
          sub={returningShare}
          foot="Dollars, not headcount."
          extra={
            !salesPending &&
            rest.returningSalesShare != null &&
            Number.isFinite(rest.returningSalesShare) ? (
              <span
                className="mcfly-split"
                aria-hidden="true"
                title={returningShare}
              >
                <span
                  className="mcfly-split__return"
                  style={{
                    width: `${Math.round(rest.returningSalesShare * 100)}%`,
                  }}
                />
              </span>
            ) : null
          }
        />
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for the weekday breakdown."
          formulaBlock="Weekend vs weekday sales share, shop-local. Shopify Analytics Overview does not put this next to typical order."
          icon="weekend"
          label="Weekend"
          value={weekend ? `${weekend.weekendPct}%` : "—"}
          sub={weekend ? `vs weekday ${weekend.weekdayPct}%` : undefined}
          extra={
            weekend ? (
              <span
                className="mcfly-split"
                aria-hidden="true"
                title={`Weekend ${weekend.weekendPct}%`}
              >
                <span
                  className="mcfly-split__weekend"
                  style={{ width: `${weekend.weekendPct}%` }}
                />
              </span>
            ) : null
          }
        />
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for typical day, discounts, and the sales clock. The open sales chart paints each day vs this typical."
          formulaBlock={PRODUCT_NOUN.bookTypicalDayDef}
          icon="clock"
          label={PRODUCT_NOUN.bookTypicalDay}
          value={typicalDayValue}
          sub={
            salesPending || typicalDayValue === "—"
              ? undefined
              : "Median daily sales · day vs typical on the chart"
          }
        />
      </div>

      {clockSentence ? (
        <p className="mcfly-score__trust" data-overview-compare="clock">
          {clockSentence}
        </p>
      ) : null}

      <div
        className="mcfly-kpi-grid mcfly-kpi-grid--windows"
        aria-label="Yesterday, this week, and this month to date"
      >
        {plainWindows.map((plain) => (
          <PeekCard
            key={plain.id}
            to={ordersHref}
            nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
            next="Open Orders for the tickets inside this Shopify Total Sales window."
            formulaBlock={overviewPlainWindowFormula(plain.id)}
            icon="sales"
            label={plain.label}
            value={moneyOrDash(salesPending, plain.sales, currency)}
            sub={OVERVIEW_PERIOD_TOTAL_LABEL}
          />
        ))}
      </div>

      {handoffs.length > 0 ? (
        <div className="mcfly-well mcfly-well--scoreboard mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-handoff mcfly-kpi-grid--soft">
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

      {!finding ? (
        <p className="mcfly-score__trust">
          {overviewCoverageLine(orderBookDepth)} {OVERVIEW_PENDING_IN_TOTAL_SALES}{" "}
          {OVERVIEW_SHOP_NOT_COMPANY}
        </p>
      ) : null}
    </section>
  );
}

/** Orders + busiest weekday — after the open sales chart. Typical day leads above. */
export function OverviewDepthPeeks({
  ordersHref,
  salesPending,
  orderCount,
  ...rest
}: OverviewPeekProps) {
  const { ordersValue, busiest, busiestValue } = useOverviewPeekValues({
    ...rest,
    orderCount,
    ordersHref,
    salesPending,
  });

  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--depth mcfly-score--soft"
      aria-label="More Shopify order depth"
    >
      <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-depth mcfly-kpi-grid--peeks-2 mcfly-kpi-grid--soft">
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for ticket, discounts, and items."
          formulaBlock="Paid orders in this window after returns. Typical order is the middle ticket, not this count."
          icon="orders"
          label="Orders"
          value={ordersValue}
          sub={
            salesPending || !(orderCount > 0) ? undefined : "This window"
          }
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
    </section>
  );
}
