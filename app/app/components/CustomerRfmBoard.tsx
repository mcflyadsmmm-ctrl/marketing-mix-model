import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import type {
  CustomerRfmView,
  RfmEmpty,
  RfmEmptyKind,
  RfmSegment,
} from "../lib/customers-rfm";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
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

function segmentTone(key: RfmSegment["key"]): "good" | "warn" | "plain" {
  switch (key) {
    case "champions":
      return "good";
    case "rising":
      return "plain";
    case "at_risk":
      return "warn";
    case "quiet":
      return "plain";
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

/**
 * RFM-lite — recency / frequency / monetary terciles and four actionable
 * segments from the stored order book. Soft dense, not a 5×5 dump. First-win
 * empties are ActionCard-shaped. Order history only.
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
          <p className="mcfly-panel__muted">
            Recency · frequency · monetary · order history
          </p>
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
                  v: `Floor: ${empty.need} identified buyers who have lived 30 days. Then recency / frequency / monetary bands and the four segments. Same math — no spend required.`,
                },
              ],
              next: "Order history only — not email, not a Shopify RFM export.",
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

  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-cust-rfm mcfly-desk-anchor"
      aria-label="RFM-lite"
    >
      <div className="mcfly-panel__head">
        <h2>RFM-lite</h2>
        <p className="mcfly-panel__muted">{historyLine(rfm)}</p>
      </div>

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
                  { k: "What to do", v: `${seg.verb} — ${pct(seg.share)} of identified buyers on file.` },
                  {
                    k: "On-file dollars",
                    v: formatCurrency(seg.dollars, currency),
                  },
                  {
                    k: "How this is scored",
                    v: "Recency, frequency, and monetary terciles from this shop’s stored orders. High dollars + cooling recency is At risk. Not a 5×5 export.",
                  },
                ],
                next: "Whale watchlist above holds the high-LTV names to reach first.",
              })
            }
          >
            <p className="mcfly-cust-kpi__verb">{seg.verb}</p>
            <p className="mcfly-cust-kpi__k">{seg.label}</p>
            <p className="mcfly-cust-kpi__v">{seg.buyers.toLocaleString()}</p>
            <p className="mcfly-cust-kpi__sub">
              {pct(seg.share)} · {formatCurrency(seg.dollars, currency)}
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
                      style={{ width: `${Math.max(6, (slice.buyers / max) * 100)}%` }}
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
          {atRisk.buyers.toLocaleString()} high-dollar {atRisk.buyers === 1 ? "buyer is" : "buyers are"} cooling —
          the watchlist beside What to do is the first reach.
        </p>
      ) : null}
      {rfm.recencyTruncatedAt != null ? (
        <p className="mcfly-cust-note">
          Recency past ~{rfm.recencyTruncatedAt} days needs more order history than
          this install shares — withheld, not a fake year.
        </p>
      ) : null}
    </section>
  );
}
