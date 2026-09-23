import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import {
  RFM_FROM_SHOPIFY_ORDERS,
  RFM_MIN_BUYERS,
  RFM_RULES_LINE,
  type CustomerRfmView,
  type RfmChampionFlow,
  type RfmEmpty,
  type RfmEmptyKind,
  type RfmSegment,
} from "../lib/customers-rfm";

function pct(share: number, buyers: number): string {
  if (buyers <= 0) return "0%";
  const whole = Math.round(share * 100);
  if (whole === 0) return "—";
  return `${whole}%`;
}

function emptyValue(empty: RfmEmpty): string {
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

function emptyFloor(kind: RfmEmptyKind, need: number): string {
  switch (kind) {
    case "syncing":
    case "thin":
    case "young":
      return `Floor: ${need} buyers × 30 days, then RFM-lite bands — not $0.`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function historyLine(rfm: CustomerRfmView): string {
  if (rfm.historyLimited) {
    return `On file · last ~${rfm.historyDays} days — not a fake lifetime. Year-scale recency needs more history than this install shares.`;
  }
  return `On-file lifetime · last ~${rfm.historyDays} days of the stored book.`;
}

function championFlowLine(championFlow: RfmChampionFlow, currency: string): string {
  if (!championFlow.sealed) {
    return `Last month's Champion flow seals after ${RFM_MIN_BUYERS} identified buyers — not $0.`;
  }
  if (championFlow.lastMonthChampions < 1) {
    return "No last-month Champions on file — not $0.";
  }
  if (championFlow.cooledBuyers < 1) {
    return `None of last month's ${championFlow.lastMonthChampions.toLocaleString()} Champions are At risk or Hibernating now.`;
  }
  const dollars =
    championFlow.cooledLifetime != null && championFlow.cooledLifetime > 0
      ? ` · ${formatCurrency(championFlow.cooledLifetime, currency)} lifetime`
      : "";
  return `${championFlow.cooledBuyers.toLocaleString()} of last month's ${championFlow.lastMonthChampions.toLocaleString()} Champions are At risk or Hibernating now${dollars}.`;
}

function segmentTone(key: RfmSegment["key"]): "good" | "warn" | "plain" {
  switch (key) {
    case "champions":
      return "good";
    case "new":
      return "plain";
    case "at_risk":
      return "warn";
    case "hibernating":
      return "warn";
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

/**
 * RFM-lite — Champions / At risk / New / Hibernating from simple R·F·M
 * thresholds on the stored Shopify order book. Soft dense, not a 5×5 dump.
 * First-win empties are ActionCard-shaped. No invented customers.
 */
export function CustomerRfmBoard({ rfm }: { rfm: CustomerRfmView }) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const empty = rfm.empty;

  if (empty) {
    return (
      <section
        className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-cust-rfm"
        aria-label="RFM-lite"
      >
        <div className="mcfly-panel__head">
          <h2>RFM-lite</h2>
          <p className="mcfly-panel__muted">{RFM_FROM_SHOPIFY_ORDERS}</p>
        </div>
        <button
          type="button"
          className="mcfly-cust-rfm__empty"
          data-kind={empty.kind}
          onClick={() =>
            drill?.openDrill({
              title: "RFM-lite",
              value: emptyValue(empty),
              kicker: empty.verb,
              blocks: [
                { k: "What this is", v: empty.copy },
                {
                  k: "What fills next",
                  v: `Floor: ${empty.need} identified buyers who have lived 30 days. Then Champions, At risk, New, and Hibernating. ${RFM_RULES_LINE} No customers invented.`,
                },
              ],
              next: RFM_FROM_SHOPIFY_ORDERS,
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
        <div className="mcfly-cust-empty__ghost mcfly-cust-empty__ghost--bars" aria-hidden="true">
          {[0.7, 0.45, 0.88].map((h, i) => (
            <span key={i} className="mcfly-cust-empty__col">
              <span className="mcfly-cust-empty__col-a" style={{ height: `${h * 100}%` }} />
              <span
                className="mcfly-cust-empty__col-b"
                style={{ height: `${Math.max(18, (1 - h) * 70)}%` }}
              />
            </span>
          ))}
        </div>
      </section>
    );
  }

  const atRisk = rfm.segments.find((s) => s.key === "at_risk");
  const championFlow = rfm.championFlow;

  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-cust-rfm mcfly-desk-anchor"
      aria-label="RFM-lite"
    >
      <div className="mcfly-panel__head">
        <h2>RFM-lite</h2>
        <p className="mcfly-panel__muted">{RFM_FROM_SHOPIFY_ORDERS}</p>
      </div>
      <p className="mcfly-cust-note">{RFM_RULES_LINE}</p>

      <div className="mcfly-cust-rfm__segs" aria-label="RFM segments">
        {rfm.segments.map((seg) => (
          <button
            type="button"
            key={seg.key}
            className={`mcfly-cust-kpi mcfly-cust-kpi--${segmentTone(seg.key)} mcfly-cust-kpi--soft mcfly-cust-kpi--action`}
            onClick={() =>
              drill?.openDrill({
                title: seg.label,
                value: `${seg.buyers.toLocaleString()} buyers`,
                kicker: seg.verb,
                blocks: [
                  { k: "What to do", v: `${seg.verb}. ${seg.rule}` },
                  {
                    k: "On-file dollars",
                    v: formatCurrency(seg.dollars, currency),
                  },
                  {
                    k: "How this is scored",
                    v: `${RFM_RULES_LINE} ${pct(seg.share, seg.buyers)} of identified buyers. Buyers outside these four rules stay unlabeled.`,
                  },
                ],
                next: "Whale watchlist ranks top order LTV from Shopify orders. Win-back times the one-order ask.",
              })
            }
          >
            <p className="mcfly-cust-kpi__verb">{seg.verb}</p>
            <p className="mcfly-cust-kpi__k">{seg.label}</p>
            <p className="mcfly-cust-kpi__v">{seg.buyers.toLocaleString()}</p>
            <p className="mcfly-cust-kpi__sub">
              {pct(seg.share, seg.buyers)} · {formatCurrency(seg.dollars, currency)}
            </p>
          </button>
        ))}
      </div>

      <div className="mcfly-cust-rfm__bands" aria-label="Recency frequency monetary">
        {rfm.bands.map((band) => {
          const max = Math.max(band.high.buyers, band.mid.buyers, band.low.buyers, 1);
          const slices = [band.high, band.mid, band.low];
          return (
            <div key={band.key} className="mcfly-cust-rfm__band">
              <p className="mcfly-cust-rfm__band-k">
                <DeskIcon name="chart" /> {band.label}
              </p>
              {slices.map((slice) => (
                <div key={slice.label} className="mcfly-cust-rfm__band-row">
                  <span className="mcfly-cust-rfm__band-label">{slice.label}</span>
                  <span className="mcfly-cust-rfm__band-track" aria-hidden="true">
                    <span
                      className="mcfly-cust-rfm__band-fill"
                      style={{
                        width:
                          slice.buyers <= 0
                            ? "0%"
                            : `${Math.max(6, (slice.buyers / max) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="mcfly-cust-rfm__band-n">{slice.buyers.toLocaleString()}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {atRisk && atRisk.buyers > 0 ? (
        <p className="mcfly-cust-note">
          {atRisk.buyers.toLocaleString()} high-LTV repeat{" "}
          {atRisk.buyers === 1 ? "buyer is" : "buyers are"} cooling —{" "}
          <a href="#mcfly-win-back">Open win-back</a>.
        </p>
      ) : null}
      <p className="mcfly-cust-note">{championFlowLine(championFlow, currency)}</p>
      {rfm.outsideRules > 0 ? (
        <p className="mcfly-cust-note">
          {rfm.outsideRules.toLocaleString()} identified{" "}
          {rfm.outsideRules === 1 ? "buyer sits" : "buyers sit"} outside these
          four rules — unlabeled, not $0.
        </p>
      ) : null}
      <p className="mcfly-cust-note">{historyLine(rfm)}</p>
      {rfm.recencyTruncatedAt != null ? (
        <p className="mcfly-cust-note">
          Recency past ~{rfm.recencyTruncatedAt} days needs more order history than
          this install shares — withheld, not a fake year.
        </p>
      ) : null}
    </section>
  );
}
