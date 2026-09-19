import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { SAMPLE_CUSTOMERS_DOOR } from "../lib/sample-live-handoff";
import type { CustomerAnalytics } from "../lib/customers-analytics";
import type { CustomerRfmView } from "../lib/customers-rfm";
import {
  CUSTOMERS_PENDING_LINE,
  CUSTOMERS_THIN_EMPTY_LINE,
  buildCustomersHero,
  buildCustomersLeadPeeks,
  buildCustomersRfmBand,
  customersOperatorGreeting,
  type CustomersPeek,
  type CustomersRfmBandSlice,
} from "../lib/customers-first-viewport";

function PeekCard({
  label,
  value,
  sub,
  detail,
  verb,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  detail?: string;
  verb?: string;
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
          kicker: verb,
          blocks: [
            detail ? { k: "What this is", v: detail } : null,
            sub ? { k: "Also", v: sub } : null,
          ].filter((block): block is { k: string; v: string } => block != null),
          next: "This number is from Shopify orders in this window — not a platform pixel, not email.",
        })
      }
    >
      <span className="mcfly-kpi__top">
        <DeskIcon name={icon} />
        <span className="mcfly-kpi__label">{label}</span>
      </span>
      {verb ? <span className="mcfly-cust-kpi__verb">{verb}</span> : null}
      <span className="mcfly-kpi__value">{value}</span>
      {sub ? <span className="mcfly-kpi__sub">{sub}</span> : null}
    </button>
  );
}

function CustomersRfmBand({ slices }: { slices: CustomersRfmBandSlice[] }) {
  const drill = useDeskDrill();
  return (
    <button
      type="button"
      className="mcfly-customers-rfmband"
      onClick={() =>
        drill?.openDrill({
          title: "RFM-lite",
          value: slices
            .filter((slice) => slice.buyers > 0)
            .map((slice) => `${slice.label} ${slice.buyers}`)
            .join(" · "),
          blocks: slices.map((slice) => ({
            k: `${slice.label} · ${slice.verb}`,
            v: `${slice.buyers.toLocaleString()} buyers`,
          })),
          next: "Full RFM-lite bands sit below. Shopify Analytics Customers is a list.",
        })
      }
    >
      <span className="mcfly-customers-rfmband__track" aria-hidden="true">
        {slices.map((slice) =>
          slice.buyers > 0 ? (
            <span
              key={slice.key}
              className={`mcfly-customers-rfmband__seg mcfly-customers-rfmband__seg--${slice.key}`}
              style={{ width: `${Math.max(6, Math.round(slice.share * 100))}%` }}
            />
          ) : null,
        )}
      </span>
      <span className="mcfly-customers-rfmband__legend">
        {slices.map((slice) => (
          <span
            key={slice.key}
            className={`mcfly-customers-rfmband__tag mcfly-customers-rfmband__tag--${slice.key}`}
          >
            <span className="mcfly-customers-rfmband__tag-k">{slice.label}</span>
            <span className="mcfly-customers-rfmband__tag-v">
              {slice.buyers.toLocaleString()}
            </span>
          </span>
        ))}
      </span>
    </button>
  );
}

function CopyEmpty({
  greeting,
  body,
}: {
  greeting: string;
  body: string;
}) {
  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--customers-hero mcfly-score--soft"
      aria-label={PRODUCT_NOUN.buyersTitle}
    >
      <p className="mcfly-score__greeting">{greeting}</p>
      <p className="mcfly-state__copy">{body}</p>
    </section>
  );
}

function leadPeeks(peeks: CustomersPeek[]): CustomersPeek[] {
  return peeks.filter((peek) => peek.hero !== "actionCards");
}

function actionPeeks(peeks: CustomersPeek[]): CustomersPeek[] {
  return peeks.filter((peek) => peek.hero === "actionCards");
}

/**
 * First-fold Customers — RFM-lite / whale watch / repurchase clock / win-back
 * and Save-now ActionCard peeks. SAMPLE Snowdevil is the craft canvas.
 * Spend stays off Customers. Depth boards stay below.
 */
export function CustomersFirstViewport({
  analytics,
  rfm,
  salesPending,
  useSampleDesk = false,
}: {
  analytics: CustomerAnalytics;
  rfm: CustomerRfmView;
  salesPending: boolean;
  useSampleDesk?: boolean;
}): ReactNode {
  const atRisk = rfm.segments.find((row) => row.key === "at_risk");
  const greeting = customersOperatorGreeting({
    salesPending,
    orderCount: analytics.windowOrders,
    identifiedBuyers: analytics.identifiedBuyers,
    repurchaseTypicalDays: analytics.repurchaseTypicalDays,
    whaleCount: salesPending ? null : rfm.watchlist.length,
    atRiskBuyers: salesPending ? null : atRisk?.buyers ?? null,
  });
  const hero = salesPending ? null : buildCustomersHero(analytics, rfm);
  const peeks = salesPending
    ? []
    : buildCustomersLeadPeeks(analytics, rfm, {
        hideRepurchase: hero?.kind === "repurchaseClock",
      });
  const band = salesPending ? null : buildCustomersRfmBand(rfm);
  const trust = useSampleDesk && !salesPending ? SAMPLE_CUSTOMERS_DOOR : null;
  const lead = leadPeeks(peeks);
  const actions = actionPeeks(peeks);

  if (salesPending) {
    return (
      <CopyEmpty
        greeting={CUSTOMERS_PENDING_LINE}
        body="RFM-lite, whale watch, and the repurchase clock fill as closed days land — not $0."
      />
    );
  }

  if (!useSampleDesk && !(analytics.identifiedBuyers > 0)) {
    return <CopyEmpty greeting={greeting} body={CUSTOMERS_THIN_EMPTY_LINE} />;
  }

  if (!hero && peeks.length === 0) {
    return <CopyEmpty greeting={greeting} body={CUSTOMERS_THIN_EMPTY_LINE} />;
  }

  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--customers-hero mcfly-score--soft"
      aria-label={PRODUCT_NOUN.buyersTitle}
    >
      <p className="mcfly-score__greeting">{greeting}</p>
      {trust ? <p className="mcfly-score__trust">{trust}</p> : null}

      {hero ? (
        <article className="mcfly-customers-hero mcfly-customers-hero--soft">
          <p className="mcfly-customers-hero__k">
            <DeskIcon name={hero.kind === "rfmLite" ? "customers" : "clock"} />
            {hero.k}
          </p>
          <p className="mcfly-customers-hero__v">{hero.v}</p>
          {hero.sub ? (
            <p className="mcfly-customers-hero__sub">{hero.sub}</p>
          ) : null}
          <p className="mcfly-customers-hero__def">{hero.def}</p>
          {band ? <CustomersRfmBand slices={band} /> : null}
        </article>
      ) : null}

      {lead.length > 0 ? (
        <div className="mcfly-well mcfly-well--scoreboard mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead mcfly-kpi-grid--soft">
          {lead.map((row) => (
            <PeekCard
              key={row.k}
              icon={row.icon}
              label={row.k}
              value={row.v}
              sub={row.s}
              detail={row.d}
              verb={row.verb}
            />
          ))}
        </div>
      ) : null}

      {actions.length > 0 ? (
        <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead mcfly-kpi-grid--peeks-handoff mcfly-kpi-grid--soft">
          {actions.map((row) => (
            <PeekCard
              key={row.k}
              icon={row.icon}
              label={row.k}
              value={row.v}
              sub={row.s}
              detail={row.d}
              verb={row.verb}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
