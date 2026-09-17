import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import type { RefundHonesty, RefundHonestyBasis } from "../lib/ltv-flagship";

function basisCopy(basis: RefundHonestyBasis): string {
  switch (basis) {
    case "sample_gross_known":
      return "SAMPLE Snowdevil orders carry a known gross so the refund haircut is visible. Net dollars below are after those refunds.";
    case "shopify_current_total":
      return "Live dollars use Shopify Total Sales after returns (current total). This shop’s facts do not break out refund dollars separately — we do not invent a refund total.";
    case "unknown":
      return "Refund dollars are not on file. LTV stays net when Shopify sent a current total; we never invent a refund.";
    default: {
      const _exhaustive: never = basis;
      return _exhaustive;
    }
  }
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * Refund honesty on LTV — net of refunds when the order book supports it.
 * Never paints a invented refund dollar. Soft card, not a metric dump.
 */
export function LtvRefundHonesty({ refunds }: { refunds: RefundHonesty | null }) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (!refunds || refunds.orderCount === 0) return null;

  const value = refunds.brokenOut
    ? formatCurrency(refunds.refundedDollars ?? 0, currency)
    : "Net of returns";
  const sub = refunds.brokenOut
    ? `${pct(refunds.refundShare ?? 0)} of gross · ${refunds.refundedOrderCount?.toLocaleString() ?? "0"} orders`
    : "Refund $ not broken out — not $0 refunds";

  return (
    <section
      className="mcfly-book mcfly-depth mcfly-depth--soft mcfly-depth-refunds"
      aria-label="LTV net of refunds"
    >
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">
          <DeskIcon name="orders" />
          Net of refunds
        </h3>
        <p className="mcfly-chart__muted">{basisCopy(refunds.basis)}</p>
      </div>
      <button
        type="button"
        className="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--soft"
        onClick={() =>
          drill?.openDrill({
            title: "Net of refunds",
            value,
            kicker: `${refunds.orderCount.toLocaleString()} identified orders`,
            blocks: [
              {
                k: "What this is",
                v: basisCopy(refunds.basis),
              },
              {
                k: "Net dollars in this book",
                v: formatCurrency(refunds.netDollars, currency),
              },
              {
                k: "Refunds broken out",
                v: refunds.brokenOut
                  ? `${formatCurrency(refunds.refundedDollars ?? 0, currency)} taken back.`
                  : "Not on file — we do not invent a refund total.",
              },
            ],
            next: "LTV cards on this page use net dollars. Never a fake $0 refund.",
          })
        }
      >
        <span className="mcfly-kpi__top">
          <DeskIcon name="orders" />
          <span className="mcfly-kpi__label">
            {refunds.brokenOut ? "Taken back" : "How LTV is counted"}
          </span>
        </span>
        <span className="mcfly-kpi__value">{value}</span>
        <span className="mcfly-depth-windows__sub">{sub}</span>
      </button>
    </section>
  );
}
