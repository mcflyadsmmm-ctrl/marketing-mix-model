import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { VerticalBars } from "./CustomerCharts";
import {
  growthTt2HistoryLine,
  growthTt2Read,
  type GrowthTt2Empty,
  type GrowthTt2EmptyKind,
  type GrowthTt2View,
} from "../lib/growth-tt2";

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

function day(n: number | null | undefined): string {
  return isNum(n) ? `${Math.round(n)}d` : "—";
}

function pct(s: number | null | undefined): string {
  return isNum(s) ? `${Math.round(s * 100)}%` : "—";
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
    <div
      className={`mcfly-cust-kpi mcfly-cust-kpi--${tone} mcfly-cust-kpi--soft mcfly-cust-kpi--action`}
    >
      {body}
    </div>
  );
}

function emptyValue(empty: GrowthTt2Empty): string {
  switch (empty.kind) {
    case "syncing":
      return "Waiting on orders";
    case "thin":
    case "young":
      return `${empty.buyers.toLocaleString()} on file`;
    default: {
      const _exhaustive: never = empty.kind;
      return _exhaustive;
    }
  }
}

function emptyFloor(kind: GrowthTt2EmptyKind, need: number): string {
  switch (kind) {
    case "syncing":
    case "thin":
    case "young":
      return `Floor: ${need} buyers × 30 days, then typical wait — not $0.`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/**
 * Days-to-second habit clock + win-back fall-off. Soft dense Black Clover —
 * three ActionCards, a cadence histogram, and still-waiting buckets. First-win
 * empties are ActionCard-shaped. Order history only. Not a Customers dump.
 */
export function GrowthTt2Board({ tt2 }: { tt2: GrowthTt2View }) {
  const drill = useDeskDrill();
  const empty = tt2.empty;
  const read = growthTt2Read(tt2);

  if (empty) {
    return (
      <section
        className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-growth-tt2"
        aria-label="Days to a second order"
      >
        <div className="mcfly-panel__head">
          <h2>Days to a second order</h2>
          <p className="mcfly-panel__muted">
            Habit clock · fall-off · when to re-engage
          </p>
        </div>
        <button
          type="button"
          className="mcfly-cust-rfm__empty"
          data-kind={empty.kind}
          onClick={() =>
            drill?.openDrill({
              title: "Days to a second order",
              value: emptyValue(empty),
              kicker: empty.verb,
              blocks: [
                { k: "What this is", v: empty.copy },
                {
                  k: "What fills next",
                  v: `Floor: ${empty.need} identified buyers who have lived 30 days. Then typical wait, win-back day, and still-waiting buckets. Same math — no spend required.`,
                },
              ],
              next: "Order history only — not email, not a Shopify returning-rate.",
            })
          }
        >
          <span className="mcfly-cust-rfm__empty-k">First win</span>
          <span className="mcfly-cust-rfm__empty-verb">{empty.verb}</span>
          <span className="mcfly-cust-rfm__empty-v">{emptyValue(empty)}</span>
          <span className="mcfly-cust-rfm__empty-line">{empty.copy}</span>
          <span className="mcfly-cust-rfm__empty-line">
            {emptyFloor(empty.kind, empty.need)}
          </span>
        </button>
        <div
          className="mcfly-cust-empty__ghost mcfly-cust-empty__ghost--bars"
          aria-hidden="true"
        >
          {[0.38, 0.72, 0.55, 0.84, 0.46].map((h, i) => (
            <span key={i} className="mcfly-cust-empty__col">
              <span
                className="mcfly-cust-empty__col-a"
                style={{ height: `${h * 100}%` }}
              />
              <span
                className="mcfly-cust-empty__col-b"
                style={{ height: `${Math.max(16, (1 - h) * 60)}%` }}
              />
            </span>
          ))}
        </div>
      </section>
    );
  }

  const clockSub =
    isNum(tt2.fastDays) && isNum(tt2.slowDays)
      ? `fast ${Math.round(tt2.fastDays)}d · slow ${Math.round(tt2.slowDays)}d`
      : tt2.clockEmpty?.copy;
  const cadenceItems = tt2.daysToSecond.map((b) => ({
    key: b.label,
    label: b.label,
    value: b.buyers,
    detail: `Buyers whose second order landed ${b.label.replace("d", " days")} after their first. Order-history habit — not an email list.`,
  }));
  const fallMax = Math.max(...tt2.fallOff.map((b) => b.buyers), 1);
  const within30Line =
    tt2.eligible30 > 0
      ? `${pct(tt2.within30Share)} came back ≤30d · ${tt2.within30Count.toLocaleString()} of ${tt2.eligible30.toLocaleString()} eligible`
      : "Came back ≤30d needs 30 days of follow-up — not zero.";

  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-growth-tt2 mcfly-desk-anchor"
      aria-label="Days to a second order"
    >
      <div className="mcfly-panel__head">
        <h2>Days to a second order</h2>
        <p className="mcfly-panel__muted">{growthTt2HistoryLine(tt2)}</p>
      </div>

      {read ? (
        <button
          type="button"
          className="mcfly-growth-tt2__read"
          onClick={() =>
            drill?.openDrill({
              title: "Days to a second order",
              value: isNum(read.typicalDays) ? `${read.typicalDays}d` : "—",
              kicker: "Today’s read",
              blocks: [
                { k: "What this is", v: read.line },
                {
                  k: "Win-back day",
                  v: isNum(tt2.winBackDay)
                    ? `Re-engage one-order buyers around day ${Math.round(tt2.winBackDay)} — typical wait plus 15 days.`
                    : "Win-back timing needs 5 second orders on file — not $0.",
                },
                { k: "30-day come-back", v: within30Line },
              ],
              next: "Order history only — not email, not a Shopify returning-rate.",
            })
          }
        >
          <span className="mcfly-growth-tt2__read-k">Today’s read</span>
          <span className="mcfly-growth-tt2__read-v">
            {isNum(read.typicalDays) ? `${read.typicalDays}d` : "—"}
          </span>
          <span className="mcfly-growth-tt2__read-line">{read.line}</span>
        </button>
      ) : null}

      <div className="mcfly-cust-kpis mcfly-cust-kpis--actions">
        <ActionCard
          label="Typical wait"
          value={day(tt2.typicalDays)}
          sub={clockSub}
          tone="good"
          verb="Habit"
          detail="Time the second ask around this day — the middle wait between a first and second order from this shop’s order history."
        />
        <ActionCard
          label="Win-back by"
          value={day(tt2.winBackDay)}
          sub="typical wait + 15 days"
          tone="warn"
          verb="Win-back"
          detail="Reach one-order buyers by this day — just past typical wait, before the slow tail falls off."
        />
        <ActionCard
          label="Reach now"
          value={tt2.reachNow.toLocaleString()}
          sub="one-order buyers past win-back"
          tone="warn"
          verb="Reach now"
          detail="These one-order buyers are already past the win-back day. Prioritize them first — order history timing, not an email guess."
        />
      </div>

      <div className="mcfly-growth-tt2__split">
        <VerticalBars
          title="Days-to-2nd habit"
          subtitle="when the second order landed"
          items={cadenceItems}
          ariaUnit=" buyers"
          emptyCopy={
            tt2.clockEmpty?.copy ??
            "No second orders on file yet — not zero."
          }
        />

        <div
          className="mcfly-cust-funnel mcfly-cust-funnel--soft"
          aria-label="Still waiting"
        >
          <p className="mcfly-cust-vbars__title">
            <DeskIcon name="clock" /> Still waiting
          </p>
          {tt2.fallEmpty ? (
            <button
              type="button"
              className="mcfly-cust-rfm__empty"
              data-kind={tt2.fallEmpty.kind}
              onClick={() =>
                drill?.openDrill({
                  title: "Still waiting",
                  value: "None waiting",
                  kicker: tt2.fallEmpty?.verb,
                  blocks: [
                    { k: "What this is", v: tt2.fallEmpty!.copy },
                    {
                      k: "What fills next",
                      v: "Fall-off buckets fill when a first-timer stays quiet past the first week.",
                    },
                  ],
                  next: "Order history only — not email.",
                })
              }
            >
              <span className="mcfly-cust-rfm__empty-verb">
                {tt2.fallEmpty.verb}
              </span>
              <span className="mcfly-cust-rfm__empty-line">
                {tt2.fallEmpty.copy}
              </span>
            </button>
          ) : (
            tt2.fallOff.map((row) => {
              const share = row.buyers / fallMax;
              return (
                <button
                  type="button"
                  key={row.label}
                  className="mcfly-cust-funnel__row"
                  onClick={() =>
                    drill?.openDrill({
                      title: `Still waiting · ${row.label}`,
                      value: row.buyers.toLocaleString(),
                      kicker: "One-order buyers",
                      blocks: [
                        {
                          k: "What this is",
                          v: `Identified buyers with one order on file, ${row.label.replace("d", " days")} since that first order. Re-engage around the win-back day — order history, not email.`,
                        },
                      ],
                      next: "Win-back play: reach one-order buyers around typical wait plus 15 days.",
                    })
                  }
                >
                  <span className="mcfly-cust-funnel__k">{row.label}</span>
                  <span className="mcfly-cust-funnel__track" aria-hidden="true">
                    <span
                      className="mcfly-cust-funnel__bar"
                      style={{
                        width: `${row.buyers > 0 ? Math.max(6, share * 100) : 0}%`,
                      }}
                    />
                  </span>
                  <span className="mcfly-cust-funnel__v">
                    {row.buyers.toLocaleString()}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {tt2.daysToSecondTruncatedAt != null || tt2.fallOffTruncatedAt != null ? (
        <p className="mcfly-cust-note">
          Fall-off past ~{tt2.fallOffTruncatedAt ?? tt2.daysToSecondTruncatedAt}{" "}
          days needs more order history than this install shares — withheld, not
          zero.
        </p>
      ) : null}

      <p className="mcfly-growth-tt2__meta">
        {within30Line}
        {isNum(tt2.habitSpanDays)
          ? ` · habit span ${Math.round(tt2.habitSpanDays)}d (slow minus fast)`
          : ""}
      </p>
    </section>
  );
}
