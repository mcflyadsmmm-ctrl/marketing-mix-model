import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import {
  customersDaysToSecondCopy,
  type CustomersWindowDays,
} from "../lib/customers-days-to-second";
import { SAMPLE_GROWTH_DOOR } from "../lib/sample-live-handoff";
import {
  GROWTH_ANALYTICS_CONTRAST,
  GROWTH_PENDING_LINE,
  GROWTH_THIN_EMPTY_LINE,
  buildGrowthHabitDepth,
  buildGrowthLeadPeeks,
  growthHabitSub,
  growthOperatorGreeting,
  growthTypicalWaitLabel,
  type GrowthHabitDepth,
  type GrowthWeekendDepth,
} from "../lib/growth-first-viewport";
import { growthTt2Read, type GrowthTt2View } from "../lib/growth-tt2";

function PeekCard({
  label,
  value,
  sub,
  detail,
  extra,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  detail?: string;
  extra?: ReactNode;
  icon: DeskIconName;
}) {
  const drill = useDeskDrill();
  return (
    <button
      type="button"
      className="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--soft"
      onClick={() =>
        drill?.openDrill({
          title: label,
          value,
          blocks: [
            detail ? { k: "What this is", v: detail } : null,
            sub ? { k: "Also", v: sub } : null,
          ].filter((block): block is { k: string; v: string } => block != null),
          next: "Order history only — not email, not a Shopify returning-rate.",
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

function weekendValue(depth: GrowthWeekendDepth): string {
  switch (depth.mode) {
    case "weekend":
    case "weekday":
      return depth.value;
    default: {
      const _never: never = depth.mode;
      return _never;
    }
  }
}

/**
 * Compact repurchase habit under the #115 heroes — days-to-second shape
 * (green = typical wait, grey = the rest) and Sat–Sun vs Mon–Fri. Not
 * weekend sales, not a second scoreboard.
 */
function GrowthHabitStrip({ depth }: { depth: GrowthHabitDepth }) {
  const drill = useDeskDrill();
  const secondOrders = depth.days.reduce((sum, bucket) => sum + bucket.buyers, 0);
  const maxBuyers = Math.max(...depth.days.map((bucket) => bucket.buyers), 1);
  const weekend = depth.weekend;
  const weekendFill = weekend
    ? Math.min(1, Math.max(0, weekend.weekendFill))
    : 0;
  return (
    <div
      className="mcfly-growth-habit"
      aria-label="Days to a second order and weekends"
    >
      <button
        type="button"
        className="mcfly-growth-habit__days"
        onClick={() =>
          drill?.openDrill({
            title: "Days to a second order",
            value: secondOrders.toLocaleString(),
            blocks: [
              { k: "What this is", v: depth.daysLine },
              ...depth.days
                .filter((bucket) => bucket.buyers > 0)
                .map((bucket) => ({
                  k: bucket.label,
                  v: `${bucket.buyers.toLocaleString()} second ${bucket.buyers === 1 ? "order" : "orders"}${bucket.holdsTypical ? " · typical wait" : ""}`,
                })),
            ],
            next: "Order history only — not email, not weekend sales.",
          })
        }
      >
        <span className="mcfly-growth-habit__k">Days to a second order</span>
        <span className="mcfly-growth-habit__bars" aria-hidden="true">
          {depth.days.map((bucket) => (
            <span key={bucket.label} className="mcfly-growth-habit__col">
              <span
                className={
                  bucket.holdsTypical
                    ? "mcfly-growth-habit__bar mcfly-growth-habit__bar--green"
                    : "mcfly-growth-habit__bar mcfly-growth-habit__bar--grey"
                }
                style={{
                  height: `${bucket.buyers > 0 ? Math.max(12, (bucket.buyers / maxBuyers) * 100) : 8}%`,
                }}
              />
              <span className="mcfly-growth-habit__tick">{bucket.label}</span>
            </span>
          ))}
        </span>
        <span className="mcfly-growth-habit__sub">{depth.daysLine}</span>
      </button>
      {weekend ? (
        <button
          type="button"
          className="mcfly-growth-habit__weekends"
          onClick={() =>
            drill?.openDrill({
              title: "Weekends",
              value: weekendValue(weekend),
              blocks: [
                { k: "What this is", v: weekend.detail },
                { k: "Also", v: weekend.sub },
              ],
              next: "Second-order timing from order history — not weekend sales.",
            })
          }
        >
          <span className="mcfly-growth-habit__k">Weekends</span>
          <span className="mcfly-growth-habit__v">{weekendValue(weekend)}</span>
          <span className="mcfly-growth-habit__split" aria-hidden="true">
            <span
              className="mcfly-growth-habit__fill mcfly-growth-habit__fill--green"
              style={{ width: `${weekendFill * 100}%` }}
            />
            <span
              className="mcfly-growth-habit__fill mcfly-growth-habit__fill--grey"
              style={{ width: `${(1 - weekendFill) * 100}%` }}
            />
          </span>
          <span className="mcfly-growth-habit__sub">{weekend.sub}</span>
        </button>
      ) : null}
    </div>
  );
}

/**
 * On-screen period only. A full-book wait and a longer comeback window
 * are different facts and do not share this hero.
 */
function GrowthWindowDaysHero({
  windowDays,
  salesPending,
  useSampleDesk,
}: {
  windowDays: CustomersWindowDays;
  salesPending: boolean;
  useSampleDesk: boolean;
}) {
  const copy = salesPending ? null : customersDaysToSecondCopy(windowDays);
  const greeting = salesPending
    ? `Days to a second order in ${windowDays.label} fills as closed days land — not $0.`
    : copy
      ? `${copy.line} ${GROWTH_ANALYTICS_CONTRAST}`
      : `Days to a second order in ${windowDays.label} needs a second order on file — not $0.`;
  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--growth-hero mcfly-score--soft"
      aria-label={`Days to a second order · ${windowDays.label}`}
    >
      <p className="mcfly-score__greeting">{greeting}</p>
      {useSampleDesk ? (
        <p className="mcfly-score__trust">{SAMPLE_GROWTH_DOOR}</p>
      ) : null}
      <article className="mcfly-growth-hero mcfly-growth-hero--soft">
        <p className="mcfly-growth-hero__k">
          <DeskIcon name="clock" />
          Days to a second order
        </p>
        <p className="mcfly-growth-hero__v">{copy?.value ?? "—"}</p>
        <p className="mcfly-growth-hero__sub">{windowDays.label}</p>
        {copy ? <p className="mcfly-growth-hero__def">{copy.line}</p> : null}
      </article>
    </section>
  );
}

/**
 * First-fold Growth — typical wait to a second order vs Shopify’s
 * returning-customer rate, then win-back / reach-now / 30-day peeks
 * Analytics does not put next to that rate. Habit depth (days-to-second
 * shape + weekends) sits under those heroes. Sample shop is the craft
 * canvas. Order history only.
 */
export function GrowthFirstViewport({
  tt2,
  salesPending,
  useSampleDesk = false,
  windowDays,
}: {
  tt2: GrowthTt2View;
  salesPending: boolean;
  useSampleDesk?: boolean;
  /** Period already on the Customers screen. When set, this hero is that wait only. */
  windowDays?: CustomersWindowDays;
}) {
  if (windowDays) {
    return (
      <GrowthWindowDaysHero
        windowDays={windowDays}
        salesPending={salesPending}
        useSampleDesk={useSampleDesk}
      />
    );
  }
  const greeting = growthOperatorGreeting({ salesPending, tt2 });
  const typical = salesPending && !tt2.available ? null : growthTypicalWaitLabel(tt2);
  const habitSub = salesPending && !tt2.available ? null : growthHabitSub(tt2);
  const peeks =
    salesPending && !tt2.available ? [] : buildGrowthLeadPeeks(tt2);
  const habit =
    salesPending && !tt2.available ? null : buildGrowthHabitDepth(tt2);
  const trust = useSampleDesk && tt2.available ? SAMPLE_GROWTH_DOOR : null;
  const read = tt2.available ? growthTt2Read(tt2) : null;
  const heroDef = read?.line
    ? `${read.line} ${GROWTH_ANALYTICS_CONTRAST}`
    : "Middle wait between a first and second order, from this shop’s order history. Shopify Analytics customers is a returning-customer rate.";

  if (salesPending && !tt2.available) {
    return (
      <section
        className="mcfly-score mcfly-book mcfly-score--growth-hero mcfly-score--soft"
        aria-label="Days to a second order"
      >
        <p className="mcfly-score__greeting">{GROWTH_PENDING_LINE}</p>
        <p className="mcfly-state__copy">
          Typical wait, win-back, and who to reach fill as closed days land —
          not $0.
        </p>
      </section>
    );
  }

  if (!useSampleDesk && (tt2.empty || typical == null)) {
    return (
      <section
        className="mcfly-score mcfly-book mcfly-score--growth-hero mcfly-score--soft"
        aria-label="Days to a second order"
      >
        <p className="mcfly-score__greeting">{greeting}</p>
        <p className="mcfly-state__copy">
          {tt2.empty?.copy ?? GROWTH_THIN_EMPTY_LINE}
        </p>
      </section>
    );
  }

  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--growth-hero mcfly-score--soft"
      aria-label="Days to a second order"
    >
      <p className="mcfly-score__greeting">{greeting}</p>
      {trust ? <p className="mcfly-score__trust">{trust}</p> : null}

      {typical ? (
        <article className="mcfly-growth-hero mcfly-growth-hero--soft">
          <p className="mcfly-growth-hero__k">
            <DeskIcon name="clock" />
            Days to a second order
          </p>
          <p className="mcfly-growth-hero__v">{typical}</p>
          {habitSub ? (
            <p className="mcfly-growth-hero__sub">{habitSub}</p>
          ) : null}
          <p className="mcfly-growth-hero__def">{heroDef}</p>
        </article>
      ) : null}

      {peeks.length > 0 ? (
        <div className="mcfly-well mcfly-well--scoreboard mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead mcfly-kpi-grid--soft">
          {peeks.map((row) => (
            <PeekCard
              key={row.k}
              icon={row.icon}
              label={row.k}
              value={row.v}
              sub={row.s}
              detail={row.d}
            />
          ))}
        </div>
      ) : null}

      {habit ? <GrowthHabitStrip depth={habit} /> : null}
    </section>
  );
}
