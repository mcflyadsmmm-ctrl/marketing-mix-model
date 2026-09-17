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

function ActionCard({
  label,
  value,
  sub,
  tone = "plain",
  verb,
  detail,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  verb: string;
  detail: string;
}) {
  const drill = useDeskDrill();
  const open = () =>
    drill?.openDrill({
      title: label,
      value,
      kicker: verb,
      blocks: [
        { k: "What to do", v: detail },
        sub ? { k: "Also", v: sub } : null,
      ].filter((b): b is { k: string; v: string } => b != null),
      next: "Order history only — not email, not spend.",
    });
  const body = (
    <>
      <p className="mcfly-cust-kpi__verb">{verb}</p>
      <p className="mcfly-cust-kpi__k">{label}</p>
      <p className="mcfly-cust-kpi__v">{value}</p>
      {sub ? <p className="mcfly-cust-kpi__sub">{sub}</p> : null}
    </>
  );
  return drill ? (
    <button
      type="button"
      className={`mcfly-cust-kpi mcfly-cust-kpi--${tone} mcfly-cust-kpi--soft mcfly-cust-kpi--action`}
      onClick={open}
    >
      {body}
    </button>
  ) : (
    <div className={`mcfly-cust-kpi mcfly-cust-kpi--${tone} mcfly-cust-kpi--soft mcfly-cust-kpi--action`}>
      {body}
    </div>
  );
}

function RetentionEmptyFrame() {
  const ghost = [1, 0.64, 0.28];
  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-cust-empty mcfly-cust-card--soft"
      aria-label="What to do"
    >
      <div className="mcfly-panel__head">
        <h2>What to do</h2>
        <p className="mcfly-panel__muted">
          When they come back · repurchase clock · fall-off &amp; win-back
        </p>
      </div>
      <div className="mcfly-cust-empty__ghost" aria-hidden="true">
        <div className="mcfly-cust-empty__clock">
          <span className="mcfly-cust-empty__clock-face" />
          <span className="mcfly-cust-empty__clock-hand" />
        </div>
        <div className="mcfly-cust-empty__funnel">
          {ghost.map((width, i) => (
            <span
              key={i}
              className="mcfly-cust-empty__funnel-bar"
              style={{ width: `${width * 100}%` }}
            />
          ))}
        </div>
      </div>
      <p className="mcfly-cust-empty__copy">
        Repurchase cadence needs identified buyers with a second order on file —
        not $0. Snowdevil SAMPLE fills this in; a fresh live shop fills in as
        orders land.
      </p>
    </section>
  );
}

/**
 * What to do — the Black Clover Customers retention flow Shopify Analytics
 * never puts on one screen: a repurchase clock, a fall-off funnel, a days-to-2nd
 * cadence histogram, and an honest win-back play. Three action cards, not a
 * metric dump. Order history only — no email, no spend. Product-level cross-sell
 * is withheld (no SKU/title in Level-1 facts), never guessed.
 */
export function CustomerRetentionBoard({ analytics }: { analytics: CustomerAnalytics }) {
  const drill = useDeskDrill();
  const a = analytics;

  if (!a.available) {
    return <RetentionEmptyFrame />;
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

  const clockSub =
    isNum(a.repurchaseFastDays) && isNum(a.repurchaseSlowDays)
      ? `fast ${Math.round(a.repurchaseFastDays)}d · slow ${Math.round(a.repurchaseSlowDays)}d`
      : undefined;
  const everLine =
    a.identifiedBuyers > 0
      ? `${pct(a.everRepeatShare)} ever a 2nd order · ${a.everRepeatCount.toLocaleString()} of ${a.identifiedBuyers.toLocaleString()}`
      : undefined;
  const within30Line =
    a.eligible30 > 0
      ? `${pct(a.within30Share)} came back ≤30d · ${a.within30Count.toLocaleString()} of ${a.eligible30.toLocaleString()} eligible`
      : "Came back ≤30d needs 30 days of follow-up — not zero.";

  return (
    <section className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-desk-anchor" aria-label="What to do">
      <div className="mcfly-panel__head">
        <h2>What to do</h2>
        <p className="mcfly-panel__muted">
          When they come back · repurchase clock · fall-off &amp; win-back · last ~{a.historyDays} days
        </p>
      </div>

      <div className="mcfly-cust-kpis mcfly-cust-kpis--actions">
        <ActionCard
          label="Typical repurchase"
          value={day(a.repurchaseTypicalDays)}
          sub={clockSub}
          tone="good"
          verb="Repurchase"
          detail="Time the ask around this day — when identified buyers typically place a second order from this shop's order history."
        />
        <ActionCard
          label="Win-back by"
          value={day(a.winBackDay)}
          sub="typical repurchase + 15 days"
          tone="warn"
          verb="Win-back"
          detail="Reach one-order buyers by this day — just past typical repurchase, before the slow tail falls off."
        />
        <ActionCard
          label="Save now"
          value={a.saveNowOneOrder.toLocaleString()}
          sub="one-order buyers past win-back"
          tone="warn"
          verb="Save now"
          detail="These one-order buyers are already past the win-back day. Prioritize them first — order history timing, not an email guess."
        />
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

      <div className="mcfly-cust-funnel mcfly-cust-funnel--soft" aria-label="Fall-off funnel">
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

      <div className="mcfly-cust-play mcfly-cust-play--soft">
        <p className="mcfly-cust-play__k">
          <DeskIcon name="clock" /> Win-back play
        </p>
        <p className="mcfly-cust-play__body">
          {isNum(a.winBackDay)
            ? `Reach the ${a.saveNowOneOrder.toLocaleString()} one-order buyers already past ${day(a.winBackDay).toLowerCase()} — just beyond the typical repurchase, before the slow tail.`
            : "Win-back timing needs more repeat orders on file — not zero."}
        </p>
        {everLine ? <p className="mcfly-cust-play__meta">{everLine}. {within30Line}</p> : null}
        <p className="mcfly-cust-play__note">
          Suggesting a specific 2nd-order product needs order line items (SKUs / titles), which
          <code> read_orders</code> Level-1 facts don't include — so Mcfly won't guess one. Timing above is from real order history.
        </p>
      </div>
    </section>
  );
}
