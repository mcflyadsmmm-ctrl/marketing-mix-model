import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { VerticalBars } from "./CustomerCharts";
import type { CustomerAnalytics } from "../lib/customers-analytics";

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}
function pct(s: number | null | undefined): string {
  return isNum(s) ? `${Math.round(s * 100)}%` : "—";
}
function day(n: number | null | undefined): string {
  return isNum(n) ? `Day ${Math.round(n)}` : "—";
}

type Tone = "good" | "warn" | "plain";

function Kpi({
  label,
  value,
  sub,
  tone = "plain",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <div className={`mcfly-cust-kpi mcfly-cust-kpi--${tone}`}>
      <p className="mcfly-cust-kpi__k">{label}</p>
      <p className="mcfly-cust-kpi__v">{value}</p>
      {sub ? <p className="mcfly-cust-kpi__sub">{sub}</p> : null}
    </div>
  );
}

/**
 * "When they come back" — the actionable retention flow Shopify Analytics never
 * puts on one screen: a repurchase clock, a fall-off funnel, a days-to-2nd
 * cadence histogram, and an honest win-back play. Order history only — no email,
 * no spend. Product-level cross-sell is withheld (no SKU/title in Level-1 facts),
 * never guessed.
 */
export function CustomerRetentionBoard({ analytics }: { analytics: CustomerAnalytics }) {
  const drill = useDeskDrill();
  const a = analytics;

  if (!a.available) {
    return (
      <section className="mcfly-panel mcfly-cust-card" aria-label="When they come back">
        <div className="mcfly-panel__head">
          <h2>When they come back</h2>
          <p className="mcfly-panel__muted">Repurchase clock · fall-off &amp; win-back · order history</p>
        </div>
        <p className="mcfly-cust-note">
          Repurchase cadence needs identified buyers with a second order on file — not $0.
          Snowdevil SAMPLE fills this in; a fresh live shop fills in as orders land.
        </p>
      </section>
    );
  }

  const cadenceItems = a.daysToSecond.map((b) => ({
    key: b.label,
    label: b.label,
    value: b.customers,
    detail: `Buyers whose second order landed ${b.label.replace("d", " days")} after their first.`,
  }));

  const funnel = [
    { k: "Identified buyers", v: a.identifiedBuyers, share: 1 },
    {
      k: "Placed a 2nd order",
      v: a.repeatBuyers,
      share: isNum(a.repeatShare) ? a.repeatShare : 0,
    },
    {
      k: "Placed a 3rd+ order",
      v: a.thirdPlusBuyers,
      share: isNum(a.thirdPlusShare) ? a.thirdPlusShare : 0,
    },
  ];

  return (
    <section className="mcfly-panel mcfly-cust-card mcfly-desk-anchor" aria-label="When they come back">
      <div className="mcfly-panel__head">
        <h2>When they come back</h2>
        <p className="mcfly-panel__muted">
          Repurchase clock · fall-off &amp; win-back · who to save · order history, last ~{a.historyDays} days
        </p>
      </div>

      <div className="mcfly-cust-kpis">
        <Kpi label="Typical repurchase" value={day(a.repurchaseTypicalDays)} sub={
          isNum(a.repurchaseFastDays) && isNum(a.repurchaseSlowDays)
            ? `fast ${Math.round(a.repurchaseFastDays)}d · slow ${Math.round(a.repurchaseSlowDays)}d`
            : undefined
        } tone="good" />
        <Kpi label="Win-back by" value={day(a.winBackDay)} sub="typical repurchase + 15 days" tone="warn" />
        <Kpi label="Ever a 2nd order" value={pct(a.everRepeatShare)} sub={`${a.everRepeatCount.toLocaleString()} of ${a.identifiedBuyers.toLocaleString()} buyers`} tone="good" />
        <Kpi label="Came back ≤30d" value={pct(a.within30Share)} sub={a.eligible30 > 0 ? `${a.within30Count.toLocaleString()} of ${a.eligible30.toLocaleString()} eligible` : "needs 30 days of follow-up"} />
        <Kpi label="Save now" value={a.saveNowOneOrder.toLocaleString()} sub="one-order buyers past win-back" tone="warn" />
        <Kpi label="First-time buyers" value={a.identifiedBuyers.toLocaleString()} sub={`identified, last ~${a.historyDays} days`} />
      </div>

      <VerticalBars
        title="Retention cadence"
        subtitle="days to 2nd order"
        items={cadenceItems}
        ariaUnit=" buyers"
        emptyCopy="No second orders on file yet — not zero."
      />
      {a.daysToSecondTruncatedAt != null ? (
        <p className="mcfly-cust-note">
          Days-to-2nd past ~{a.daysToSecondTruncatedAt} days needs more order history than
          Shopify shares on this install — withheld, not zero.
        </p>
      ) : null}

      <div className="mcfly-cust-funnel" aria-label="Fall-off funnel">
        <p className="mcfly-cust-vbars__title">
          <DeskIcon name="chart" /> Fall-off funnel
        </p>
        {funnel.map((row) => (
          <button
            type="button"
            key={row.k}
            className="mcfly-cust-funnel__row"
            onClick={() =>
              drill?.openDrill({
                title: row.k,
                value: row.v.toLocaleString(),
                kicker: `${Math.round(row.share * 100)}% of identified buyers`,
                blocks: [
                  {
                    k: "What this is",
                    v: "Identified buyers who reached this order count in the trailing order-history window. Fall-off is everyone who has not yet.",
                  },
                ],
                next: "Win-back play: reach one-order buyers around the win-back day.",
              })
            }
          >
            <span className="mcfly-cust-funnel__k">{row.k}</span>
            <span className="mcfly-cust-funnel__track" aria-hidden="true">
              <span
                className="mcfly-cust-funnel__bar"
                style={{ width: `${Math.max(4, row.share * 100)}%` }}
              />
            </span>
            <span className="mcfly-cust-funnel__v">
              {row.v.toLocaleString()}
              <span className="mcfly-cust-funnel__pct"> · {Math.round(row.share * 100)}%</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mcfly-cust-play">
        <p className="mcfly-cust-play__k">
          <DeskIcon name="clock" /> Win-back play
        </p>
        <p className="mcfly-cust-play__body">
          {isNum(a.winBackDay)
            ? `Reach the ${a.saveNowOneOrder.toLocaleString()} one-order buyers already past ${day(a.winBackDay).toLowerCase()} — just beyond the typical repurchase, before the slow tail.`
            : "Win-back timing needs more repeat orders on file — not zero."}
        </p>
        <p className="mcfly-cust-play__note">
          Suggesting a specific 2nd-order product needs order line items (SKUs / titles), which
          <code> read_orders</code> Level-1 facts don't include — so Mcfly won't guess one. Timing above is from real order history.
        </p>
      </div>
    </section>
  );
}
