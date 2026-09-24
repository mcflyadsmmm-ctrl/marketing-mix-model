import {
  customersDaysToSecondCopy,
  type CustomersWindowDays,
} from "../lib/customers-days-to-second";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { VerticalBars } from "./CustomerCharts";
import type { CustomerAnalytics } from "../lib/customers-analytics";

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}
function pct(s: number | null | undefined): string {
  if (!isNum(s)) return "—";
  const whole = Math.round(s * 100);
  if (whole === 0 && s !== 0) return "—";
  return `${whole}%`;
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
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  verb: string;
  detail: string;
  href?: string;
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
  if (href) {
    return (
      <a
        href={href}
        className={`mcfly-cust-kpi mcfly-cust-kpi--${tone} mcfly-cust-kpi--soft mcfly-cust-kpi--action`}
      >
        {body}
      </a>
    );
  }
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
        not $0. Sample shop fills this in; a fresh live shop fills in as
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
export function CustomerRetentionBoard({
  analytics,
  windowDays,
}: {
  analytics: CustomerAnalytics;
  /** Period on screen. Typical repurchase uses that wait, not a longer window. */
  windowDays?: CustomersWindowDays;
}) {
  const drill = useDeskDrill();
  const a = analytics;
  const windowCopy = windowDays ? customersDaysToSecondCopy(windowDays) : null;

  if (!a.available) {
    return <RetentionEmptyFrame />;
  }

  const cadenceItems = a.daysToSecond.map((b) => ({
    key: b.label,
    label: b.label,
    value: b.customers,
    detail: `Buyers whose second order landed ${b.label.replace("d", " days")} after their first.`,
  }));

  const funnel: Array<{ k: string; v: number; share: number | null }> = [
    { k: "Identified buyers", v: a.identifiedBuyers, share: 1 },
    {
      k: "Placed a 2nd order",
      v: a.repeatBuyers,
      share: isNum(a.repeatShare) ? a.repeatShare : null,
    },
    {
      k: "Placed a 3rd+ order",
      v: a.thirdPlusBuyers,
      share: isNum(a.thirdPlusShare) ? a.thirdPlusShare : null,
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
          value={
            windowDays
              ? (windowCopy?.value ?? "—")
              : day(a.repurchaseTypicalDays)
          }
          sub={windowDays ? windowDays.label : clockSub}
          tone="good"
          verb="Repurchase"
          detail={
            windowCopy
              ? windowCopy.line
              : "Time the ask around this day — when identified buyers typically place a second order from this shop's order history."
          }
        />
        <ActionCard
          label="Win-back by"
          value={
            windowDays ? (windowCopy?.value ?? "—") : day(a.winBackDay)
          }
          sub={
            windowDays ? windowDays.label : "typical repurchase + 15 days"
          }
          tone="warn"
          verb="Win-back"
          detail={
            windowCopy
              ? windowCopy.line
              : "Reach one-order buyers by this day — just past typical repurchase, before the slow tail falls off."
          }
          href="#mcfly-win-back"
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
                kicker: `${pct(row.share)} of identified buyers`,
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
              {isNum(row.share) ? (
                <span
                  className="mcfly-cust-funnel__bar"
                  style={{ width: `${Math.max(row.share > 0 ? 4 : 0, row.share * 100)}%` }}
                />
              ) : null}
            </span>
            <span className="mcfly-cust-funnel__v">
              {row.v.toLocaleString()}
              <span className="mcfly-cust-funnel__pct"> · {pct(row.share)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mcfly-cust-play mcfly-cust-play--soft">
        <p className="mcfly-cust-play__k">
          <DeskIcon name="clock" /> Win-back play
        </p>
        <p className="mcfly-cust-play__body">
          {windowCopy
            ? windowCopy.line
            : isNum(a.winBackDay)
              ? `Reach the ${a.saveNowOneOrder.toLocaleString()} one-order buyers already past ${day(a.winBackDay).toLowerCase()} — just beyond the typical repurchase, before the slow tail.`
              : "Win-back timing needs more repeat orders on file — not zero."}
        </p>
        {everLine ? <p className="mcfly-cust-play__meta">{everLine}. {within30Line}</p> : null}
        <p className="mcfly-cust-play__note">
          Suggesting a specific 2nd-order product needs order line items (SKUs / titles), which
          <code> read_orders</code> Level-1 facts do not include — so Mcfly will not guess one. Timing above is from real order history.
        </p>
      </div>
    </section>
  );
}
