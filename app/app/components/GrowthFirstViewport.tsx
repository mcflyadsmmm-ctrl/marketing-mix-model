import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { SAMPLE_GROWTH_DOOR } from "../lib/sample-live-handoff";
import {
  GROWTH_ANALYTICS_CONTRAST,
  GROWTH_PENDING_LINE,
  GROWTH_THIN_EMPTY_LINE,
  buildGrowthLeadPeeks,
  growthHabitSub,
  growthOperatorGreeting,
  growthTypicalWaitLabel,
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

/**
 * First-fold Growth — typical wait to a second order vs Shopify’s
 * returning-customer rate, then win-back / reach-now / 30-day peeks
 * Analytics does not put next to that rate. SAMPLE Snowdevil is the craft
 * canvas. Order history only.
 */
export function GrowthFirstViewport({
  tt2,
  salesPending,
  useSampleDesk = false,
}: {
  tt2: GrowthTt2View;
  salesPending: boolean;
  useSampleDesk?: boolean;
}) {
  const greeting = growthOperatorGreeting({ salesPending, tt2 });
  const typical = salesPending && !tt2.available ? null : growthTypicalWaitLabel(tt2);
  const habitSub = salesPending && !tt2.available ? null : growthHabitSub(tt2);
  const peeks =
    salesPending && !tt2.available ? [] : buildGrowthLeadPeeks(tt2);
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
    </section>
  );
}
